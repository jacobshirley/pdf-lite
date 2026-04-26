import { PdfObject } from '../core/objects/pdf-object.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import {
    PdfXRefTable,
    PdfXRefTableEntry,
} from '../core/objects/pdf-xref-table.js'
import { PdfStartXRef } from '../core/objects/pdf-start-xref.js'
import { PdfTrailer, PdfTrailerEntries } from '../core/objects/pdf-trailer.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfComment } from '../core/objects/pdf-comment.js'
import {
    PdfObjStream,
    PdfStream,
    PdfXRefStream,
    PdfXRefStreamCompressedEntry,
    PdfXRefStreamEntry,
} from '../core/objects/pdf-stream.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { Ref } from '../core/ref.js'
import {
    IPdfObjectResolver,
    PdfObjectReference,
} from '../core/objects/pdf-object-reference.js'
import { ByteArray } from '../types.js'
import { concatUint8Arrays, PdfObjectSerializer, PdfToken } from '../index.js'

/**
 * Manages cross-reference (xref) lookup for PDF objects.
 * Handles both traditional xref tables and xref streams, including hybrid documents.
 * Supports linking multiple revisions through the Prev chain.
 */
export class PdfXrefLookup {
    /** The underlying xref object (either a table or stream) */
    object: PdfIndirectObject<PdfXRefStream> | PdfXRefTable
    /** Map of object numbers to their xref entries */
    entries: Map<number, PdfXRefStreamEntry>
    /** Trailer dictionary containing document metadata references */
    trailerDict: PdfDictionary<PdfTrailerEntries>

    resolver?: IPdfObjectResolver

    private type?: 'table' | 'stream'
    private hybridXRefStream?: PdfIndirectObject<PdfXRefStream>

    /**
     * Creates a new xref lookup instance.
     *
     * @param options - Configuration options
     * @param options.type - Type of xref ('table' or 'stream')
     * @param options.object - Pre-existing xref table or stream object
     * @param options.trailerDict - Pre-existing trailer dictionary
     * @param options.prev - Previous xref lookup to link to
     */
    constructor(options?: {
        type?: 'table' | 'stream'
        object?: PdfIndirectObject<PdfStream> | PdfXRefTable
        trailerDict?: PdfDictionary<PdfTrailerEntries>
        prev?: PdfXrefLookup
    }) {
        this.type = options?.type
        this.entries = new Map<number, PdfXRefStreamEntry>()
        this.trailerDict = options?.trailerDict ?? new PdfDictionary()
        if (options?.prev) {
            this.trailerDict.set('Prev', new PdfNumber(options.prev.offset))
        }

        if (options?.object) {
            if (options.object instanceof PdfXRefTable) {
                this.object = options.object
            } else if (options.object.content instanceof PdfXRefStream) {
                this.object = options.object as PdfIndirectObject<PdfXRefStream>
            } else if (options.object.content instanceof PdfStream) {
                this.object = options.object as PdfIndirectObject<PdfXRefStream>
                this.object.content =
                    options.object.content.parseAs(PdfXRefStream)
            } else {
                throw new Error(
                    'Provided object is not a valid XRef table or stream',
                )
            }
            this.size++

            if (
                this.object instanceof PdfIndirectObject &&
                this.object.content instanceof PdfXRefStream
            ) {
                this.type = 'stream'
                this.entries = new Map(
                    this.object.content
                        .getEntryStream()
                        .map((entry) => [entry.objectNumber.value, entry]),
                )
            } else if (this.object instanceof PdfXRefTable) {
                this.type = 'table'
                this.object.entries.forEach((entry) => {
                    this.entries.set(entry.objectNumber.value, entry)
                })
            }
        } else {
            // PDF spec 7.5.4: object 0 must always be a free entry
            // (head of the free list) with generation number 65535.
            this.entries.set(
                0,
                new PdfXRefTableEntry({
                    objectNumber: 0,
                    generationNumber: 65535,
                    byteOffset: 0,
                    inUse: false,
                }),
            )

            this.object = this.update()
        }

        if (this.object instanceof PdfIndirectObject)
            this.object.orderIndex = PdfIndirectObject.MAX_ORDER_INDEX
    }

    get prev(): PdfXrefLookup | undefined {
        const prevEntry = this.trailerDict.get('Prev')
        if (prevEntry?.value) {
            const object = this.resolver?.getObjectAtOffset(prevEntry.value)
            if (!object) {
                throw new Error(
                    `Failed to resolve previous xref object at offset ${prevEntry.value}`,
                )
            }
            return new PdfXrefLookup({
                type: object instanceof PdfXRefTable ? 'table' : 'stream',
                object:
                    object instanceof PdfIndirectObject
                        ? object.content
                        : object,
                trailerDict:
                    object instanceof PdfTrailer ? object.dict : undefined,
            })
        }
        return undefined
    }

    /**
     * Sets the byte offset of the xref object.
     */
    set offset(value: Ref<number>) {
        this.object.offset = value
    }

    /**
     * Gets the byte offset of the xref object.
     */
    get offset(): Ref<number> {
        return this.object.offset
    }

    /**
     * Gets the size of the xref table (highest object number + 1).
     * Ensures size is at least as large as the previous revision.
     */
    get size(): number {
        const trailerSize = this.trailerDict.get('Size')?.value ?? 0
        const prevSize = this.prev?.size ?? 0

        if (trailerSize < prevSize) {
            this.trailerDict.set('Size', new PdfNumber(prevSize))
        }

        const size = Math.max(trailerSize, prevSize)
        if (size !== trailerSize)
            this.trailerDict.set('Size', new PdfNumber(size))

        return size
    }

    /**
     * Sets the size of the xref table.
     */
    set size(value: number) {
        this.trailerDict.set('Size', new PdfNumber(value))
    }

    /**
     * Gets all xref entries as an array.
     */
    get entriesValues(): PdfXRefStreamEntry[] {
        return Array.from(this.entries.values())
    }

    /**
     * Updates the xref object with current entries.
     * Handles both table and stream formats, including hybrid documents.
     *
     * @returns The updated xref object
     */
    update(): PdfIndirectObject<PdfXRefStream> | PdfXRefTable {
        if (this.object?.isImmutable()) {
            return this.object
        }

        if (this.object instanceof PdfXRefTable) {
            const tableEntries = this.entriesValues.filter(
                (entry) => entry instanceof PdfXRefTableEntry,
            )
            const compressedEntries = this.entriesValues.filter(
                (entry) => entry instanceof PdfXRefStreamCompressedEntry,
            )

            this.object.entries = tableEntries

            // If there are compressed entries, create a hybrid xref with an XRefStm
            if (compressedEntries.length > 0) {
                this.hybridXRefStream = new PdfIndirectObject({
                    content: PdfXRefStream.fromEntries(compressedEntries),
                })
                // Store reference to the xref stream offset
                this.trailerDict.set(
                    'XRefStm',
                    new PdfNumber(this.hybridXRefStream.offset),
                )
            } else {
                // Remove XRefStm if no compressed entries exist
                this.trailerDict.delete('XRefStm')
                this.hybridXRefStream = undefined
            }

            return this.object
        } else if (this.object instanceof PdfIndirectObject) {
            this.object.content = PdfXRefStream.fromEntries(
                this.entriesValues,
                this.trailerDict,
            )
            return this.object
        }

        let newObject: PdfIndirectObject<PdfXRefStream> | PdfXRefTable
        if (this.type === 'table') {
            newObject = new PdfXRefTable()
        } else {
            newObject = new PdfIndirectObject({
                content: PdfXRefStream.fromEntries(
                    this.entriesValues,
                    this.trailerDict,
                ),
            })
        }
        this.object = newObject

        return this.object
    }

    /**
     * Reserves a contiguous block of object numbers without registering objects.
     * Use this to pre-assign numbers to objects that will live inside an ObjStm.
     *
     * @param count - Number of object numbers to reserve
     * @returns The first reserved object number
     */
    reserveObjectNumbers(count: number): number {
        const startNum = this.size
        this.size += count
        return startNum
    }

    /**
     * Adds an indirect object to the xref lookup.
     * Assigns an object number if not already set.
     *
     * @param newObject - The indirect object to add
     * @param options - Options for compressed objects
     * @param options.parentObjectNumber - Object number of the containing object stream
     * @param options.indexInStream - Index within the object stream
     * @throws Error if trying to add compressed object with non-zero generation number
     */
    addObject(
        newObject: PdfIndirectObject,
        options?: {
            parentObjectNumber?: number
            indexInStream?: number
        },
    ): void {
        if (!newObject.inPdf()) {
            newObject.objectNumber = this.size++
        }

        if (
            options?.indexInStream !== undefined &&
            options?.parentObjectNumber !== undefined
        ) {
            if (newObject.generationNumber !== 0) {
                throw new Error(
                    'Object streams cannot contain objects with generation number other than 0',
                )
            }
            this.entries.set(
                newObject.objectNumber,
                new PdfXRefStreamCompressedEntry({
                    objectNumber: newObject.objectNumber,
                    objectStreamNumber: options.parentObjectNumber,
                    index: options.indexInStream,
                }),
            )
        } else {
            this.entries.set(
                newObject.objectNumber,
                new PdfXRefTableEntry({
                    objectNumber: newObject.objectNumber,
                    generationNumber: newObject.generationNumber,
                    byteOffset: newObject.offset,
                    inUse: true,
                }),
            )
        }

        this.update()

        if (newObject.content instanceof PdfObjStream) {
            let index = 0
            for (const child of newObject.content.getObjectStream()) {
                this.addObject(child, {
                    parentObjectNumber: newObject.objectNumber,
                    indexInStream: index++,
                })
            }
        }
    }

    /**
     * Removes an indirect object from the xref lookup.
     * Also removes any trailer references to the object.
     *
     * @param object - The indirect object to remove
     */
    removeObject(object: {
        objectNumber: number
        generationNumber: number
    }): void {
        this.entries.delete(object.objectNumber)
        this.prev?.removeObject(object)

        const trailerValues = this.trailerDict.values
        for (const entry of Object.keys(
            trailerValues,
        ) as (keyof PdfTrailerEntries)[]) {
            const value = trailerValues[entry]

            if (
                value instanceof PdfObjectReference &&
                value.objectNumber === object.objectNumber &&
                value.generationNumber === object.generationNumber
            ) {
                this.trailerDict.delete(entry)
            }
        }

        this.update()
    }

    /**
     * Gets an xref entry by object number.
     * Falls back to the previous xref if not found in current entries.
     *
     * @param objectNumber - The object number to look up
     * @returns The xref entry or undefined if not found
     */
    getObject(objectNumber: number): PdfXRefStreamEntry | undefined {
        const entry = this.entries.get(objectNumber)
        if (this.prev && !entry) {
            return this.prev.getObject(objectNumber)
        }

        return entry
    }

    /**
     * Generates the trailer section objects for this xref.
     * Includes xref table/stream, trailer (if using table), startxref, and EOF.
     *
     * @returns Array of objects forming the trailer section
     */
    toTrailerSection(): PdfObject[] {
        const objects: PdfObject[] = []

        // If this is a hybrid xref table with compressed entries, add the xref stream first
        if (this.object instanceof PdfXRefTable && this.hybridXRefStream) {
            objects.push(this.hybridXRefStream)
        }

        objects.push(this.object)

        if (this.object instanceof PdfXRefTable) {
            objects.push(new PdfTrailer(this.trailerDict))
        }

        objects.push(new PdfStartXRef(this.object.offset))
        objects.push(PdfComment.EOF)

        return objects
    }
}
