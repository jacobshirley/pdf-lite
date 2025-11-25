import { PdfObject } from '../core/objects/pdf-object'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfXRefTable, PdfXRefTableEntry } from '../core/objects/pdf-xref-table'
import { PdfStartXRef } from '../core/objects/pdf-start-xref'
import { PdfTrailer, PdfTrailerEntries } from '../core/objects/pdf-trailer'
import { PdfNumber } from '../core/objects/pdf-number'
import { PdfComment } from '../core/objects/pdf-comment'
import {
    PdfObjStream,
    PdfStream,
    PdfXRefStream,
    PdfXRefStreamCompressedEntry,
    PdfXRefStreamEntry,
} from '../core/objects/pdf-stream'
import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { Ref } from '../core/ref'
import { PdfObjectReference } from '../core/objects/pdf-object-reference'

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
    /** Reference to the previous xref lookup in the revision chain */
    prev?: PdfXrefLookup
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
        this.prev = options?.prev
        this.trailerDict = options?.trailerDict ?? new PdfDictionary()

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
        } else {
            this.object = this.update()
        }
        this.size++

        if (this.object instanceof PdfIndirectObject)
            this.object.orderIndex = PdfIndirectObject.MAX_ORDER_INDEX
    }

    /**
     * Links this xref to a previous xref lookup.
     * Copies missing trailer entries from the previous xref.
     *
     * @param xref - The previous xref lookup to link to
     * @throws Error if trying to set self as previous (would create circular reference) or if offsets match (would create ambiguous or invalid xref chain)
     */
    setPrev(xref: PdfXrefLookup) {
        if (xref === this) {
            throw new Error('Cannot set XRef lookup as its own previous lookup')
        }

        if (xref.offset === this.offset) {
            throw new Error(
                'Cannot set XRef lookup previous to another lookup with the same offset',
            )
        }

        this.prev = xref
        const prevDict = xref.trailerDict
        const dict = this.trailerDict

        !dict.has('Info') && dict.set('Info', prevDict.get('Info')?.clone())
        !dict.has('Root') && dict.set('Root', prevDict.get('Root')?.clone())
        !dict.has('Encrypt') &&
            dict.set('Encrypt', prevDict.get('Encrypt')?.clone())
        !dict.has('ID') && dict.set('ID', prevDict.get('ID')?.clone())
        !dict.has('Prev') && dict.set('Prev', new PdfNumber(xref.offset))

        const prev = dict.get('Prev')
        if (prev) {
            prev.isByteOffset = true
        }
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
     * Creates xref lookups from an array of PDF objects.
     * Parses both xref tables and xref streams, linking them via the Prev chain.
     *
     * @param objects - Array of PDF objects to parse
     * @returns The most recent xref lookup with linked previous lookups
     */
    static fromObjects(objects: PdfObject[]): PdfXrefLookup {
        const lookups: PdfXrefLookup[] = []

        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i]
            if (obj instanceof PdfXRefTable) {
                const trailer = objects[i + 1]
                if (!(trailer instanceof PdfTrailer)) {
                    throw new Error(
                        'Expected PdfTrailer after PdfXRefTable in objects',
                    )
                }
                lookups.push(PdfXrefLookup.fromXrefTable(obj, trailer, objects))
            } else if (
                obj instanceof PdfIndirectObject &&
                obj.content instanceof PdfStream &&
                obj.content.isType('XRef')
            ) {
                lookups.push(PdfXrefLookup.fromXrefStream(obj))
            }
        }

        if (!lookups.length) {
            return new PdfXrefLookup()
        }

        const startXref = objects.findLast((x) => x instanceof PdfStartXRef)
        if (!startXref) {
            throw new Error('No PdfStartXRef found in provided objects')
        }

        let lookup = lookups.find((x) => x.offset.equals(startXref.offset.ref))
        if (!lookup) {
            return lookups[0]
        }

        const initialLookup = lookup
        while (lookup) {
            lookup.prev = lookups.find((x) =>
                x.offset.equals(lookup?.trailerDict.get('Prev')?.value),
            )

            lookup = lookup.prev
        }

        return initialLookup
    }

    /**
     * Creates an xref lookup from a traditional xref table and trailer.
     * Handles hybrid xref documents with both table and stream entries.
     *
     * @param xrefTable - The xref table object
     * @param trailer - The trailer object
     * @param objects - Optional array of objects for resolving hybrid xref streams
     * @returns A new PdfXrefLookup instance
     */
    static fromXrefTable(
        xrefTable: PdfXRefTable,
        trailer: PdfTrailer,
        objects?: PdfObject[],
    ): PdfXrefLookup {
        const lookup = new PdfXrefLookup({ object: xrefTable })

        lookup.trailerDict = trailer.dict

        xrefTable.entries.forEach((entry) => {
            lookup.entries.set(entry.objectNumber.value, entry)
        })

        // Handle hybrid xref: check for XRefStm in trailer
        const xrefStmOffset = trailer.dict.get('XRefStm')
        if (xrefStmOffset instanceof PdfNumber && objects) {
            // Find the xref stream object at this offset
            const xrefStreamObj = objects.find(
                (obj) =>
                    obj instanceof PdfIndirectObject &&
                    obj.content instanceof PdfStream &&
                    obj.content.isType('XRef') &&
                    obj.offset.equals(xrefStmOffset.value),
            ) as PdfIndirectObject<PdfStream> | undefined

            if (xrefStreamObj) {
                const stream = xrefStreamObj.content.parseAs(PdfXRefStream)
                // Add entries from the xref stream (these are typically compressed objects)
                for (const entry of stream.getEntryStream()) {
                    // Only add if not already present in the table
                    if (!lookup.entries.has(entry.objectNumber.value)) {
                        lookup.entries.set(entry.objectNumber.value, entry)
                    }
                }
            }
        }

        return lookup
    }

    /**
     * Creates an xref lookup from an xref stream object.
     *
     * @param streamObject - The indirect object containing the xref stream
     * @returns A new PdfXrefLookup instance
     */
    static fromXrefStream(
        streamObject: PdfIndirectObject<PdfStream>,
    ): PdfXrefLookup {
        const stream = streamObject.content.parseAs(PdfXRefStream)
        const lookup = new PdfXrefLookup({ object: streamObject })

        for (const entry of stream.getEntryStream()) {
            lookup.entries.set(entry.objectNumber.value, entry)
        }

        lookup.trailerDict = stream.header as PdfDictionary<PdfTrailerEntries>
        return lookup
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
     * Links xref entries to their corresponding indirect objects.
     * Updates byte offset references to point to actual object offsets.
     *
     * @param objects - Array of indirect objects to link
     */
    linkIndirectObjects(objects: PdfIndirectObject[]): void {
        for (const entry of this.entriesValues) {
            if (entry instanceof PdfXRefStreamCompressedEntry) {
                continue
            }

            if (!entry.inUse) {
                continue
            }

            const [matchedObject] = objects.filter((obj) =>
                obj.offset.equals(entry.byteOffset.value),
            )

            if (
                !matchedObject ||
                matchedObject.objectNumber !== entry.objectNumber.value
            ) {
                continue
            }

            entry.byteOffset.ref.update(matchedObject.offset)
        }
    }

    /**
     * Links this xref to a previous xref lookup based on the Prev trailer entry.
     *
     * @param objects - Array of xref lookups to search for the previous one
     */
    linkPrev(objects: PdfXrefLookup[]): void {
        const prevOffset = this.trailerDict.get('Prev')?.value
        if (prevOffset === undefined) {
            return
        }

        const prevLookup = objects.filter((obj) =>
            obj.offset.equals(prevOffset),
        )

        if (prevLookup.length === 0) {
            return
        } else if (prevLookup.length > 1) {
            return
        }

        if (prevLookup[0].offset.equals(0)) return

        this.setPrev(prevLookup[0])
    }

    /**
     * Updates the xref object with current entries.
     * Handles both table and stream formats, including hybrid documents.
     *
     * @returns The updated xref object
     */
    update(): PdfIndirectObject<PdfXRefStream> | PdfXRefTable {
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
    removeObject(object: PdfIndirectObject): void {
        this.entries.delete(object.objectNumber)

        const trailerValues = this.trailerDict.values
        for (const entry of Object.keys(
            trailerValues,
        ) as (keyof PdfTrailerEntries)[]) {
            const value = trailerValues[entry]
            if (
                value instanceof PdfObjectReference &&
                value.equals(object.reference)
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
        if (!this.entries.has(objectNumber) && this.prev) {
            return this.prev.getObject(objectNumber)
        }

        return this.entries.get(objectNumber)
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
