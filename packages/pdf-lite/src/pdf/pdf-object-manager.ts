import {
    IPdfObjectResolver,
    PdfArray,
    PdfByteStreamTokeniser,
    PdfComment,
    PdfDecoder,
    PdfDictionary,
    PdfIndirectObject,
    PdfObject,
    PdfObjectReference,
    PdfObjectSerializer,
    PdfStartXRef,
    PdfStream,
    PdfTrailer,
    PdfTrailerEntries,
    PdfXRefStreamCompressedEntry,
    PdfXRefStreamEntry,
    PdfXRefTable,
    PdfXRefTableEntry,
} from '../core'
import { PdfSecurityHandler } from '../security'
import { ByteArray } from '../types'
import { bytesToString, concatUint8Arrays } from '../utils'
import { PdfLazyObject } from './pdf-lazy-indirect-object'
import { PdfXrefLookup } from './pdf-xref-lookup'

export abstract class PdfObjectManager implements IPdfObjectResolver {
    securityHandler?: PdfSecurityHandler

    constructor() {}

    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.getXrefObject().trailerDict
    }

    getObject(
        objectNumber: number,
        generationNumber: number,
    ): PdfIndirectObject {
        const obj = this.getObjectByReference({
            objectNumber,
            generationNumber,
        })
        if (!obj) {
            throw new Error(
                `Object ${objectNumber} ${generationNumber} not found`,
            )
        }
        return obj
    }

    abstract toBytes(mode?: 'append' | 'rewrite'): ByteArray
    abstract add(...objects: PdfObject[]): void
    abstract delete(...objects: PdfObject[]): void
    abstract getObjectAtOffset(offset: number): PdfObject
    abstract getObjects(): PdfIndirectObject[]
    abstract getObjectByReference(ref: {
        objectNumber: number
        generationNumber?: number
    }): PdfIndirectObject | undefined

    protected abstract getXrefObject(): PdfXrefLookup

    [Symbol.iterator]() {
        return this.getObjects()[Symbol.iterator]()
    }
}

export class PdfLazyObjectManager extends PdfObjectManager {
    private documentBytes: ByteArray
    private offset: number
    protected xrefObject?: PdfXrefLookup
    protected objectCache: Map<string, PdfObject> = new Map()
    protected bodyObjects: PdfObject[] = []

    constructor(documentBytes?: ByteArray, offset?: number) {
        super()
        if (!documentBytes) {
            this.documentBytes = new Uint8Array()
            this.offset = 0
            this.xrefObject = new PdfXrefLookup({
                type: 'table',
            })
            this.xrefObject.resolver = this
        } else {
            this.documentBytes = documentBytes
            this.offset = offset ?? this.getStartXRef()
        }
    }

    get xrefOffset(): number {
        return this.getXrefObject().offset.resolve()
    }

    startNewRevision() {
        const newXref = new PdfXrefLookup({
            type: 'table',
            prev: this.getXrefObject(),
        })
        newXref.resolver = this
        this.xrefObject = newXref

        const serializer = new PdfObjectSerializer()
        serializer.offset = this.documentBytes.length
        for (const obj of newXref.toTrailerSection()) {
            serializer.feed(obj)
        }
        this.documentBytes = concatUint8Arrays([
            this.documentBytes,
            serializer.toBytes(),
        ])
    }

    add(...objects: PdfObject[]): void {
        const xrefObject = this.getXrefObject()
        const part1 = this.documentBytes.slice(0, this.xrefOffset)
        const serializer = new PdfObjectSerializer()
        serializer.offset = part1.length
        for (const obj of objects) {
            if (obj instanceof PdfIndirectObject) {
                xrefObject.addObject(obj)
                this.objectCache.set(
                    `${obj.objectNumber} ${obj.generationNumber}`,
                    obj,
                )
            } else if (
                !(
                    obj instanceof PdfComment &&
                    obj.asString().startsWith('PDF-')
                )
            ) {
                // Exclude version comments (%PDF-x.x) — handled separately as the file header
                this.bodyObjects.push(obj)
            }

            serializer.feed(obj)
        }
        serializer.feed(...xrefObject.toTrailerSection())
        this.documentBytes = concatUint8Arrays([part1, serializer.toBytes()])

        for (const obj of objects) {
            obj.setModified(false)
        }
    }

    toBytes(mode: 'append' | 'rewrite' = 'append'): ByteArray {
        const modifiedObjects = this.getObjects().filter((obj) =>
            obj.isModified(),
        )
        if (modifiedObjects.length === 0) return this.documentBytes
        return mode === 'rewrite' ? this.toBytesRewrite() : this.toBytesAppend()
    }

    private toBytesAppend(): ByteArray {
        const xrefObject = this.getXrefObject()
        const modifiedObjects = this.getObjects().filter((obj) =>
            obj.isModified(),
        )
        const part1 = this.documentBytes.slice(0, this.xrefOffset)
        const serializer = new PdfObjectSerializer()
        serializer.offset = part1.length

        for (const obj of modifiedObjects) {
            xrefObject.addObject(obj)
            serializer.feed(obj)
            obj.setModified(false)
        }

        serializer.feed(...xrefObject.toTrailerSection())
        this.documentBytes = concatUint8Arrays([part1, serializer.toBytes()])
        return this.documentBytes
    }

    private getPdfHeaderBytes(): ByteArray {
        // Extract the %PDF-x.x version header line from the start of documentBytes, if present
        const b = this.documentBytes
        if (
            b.length >= 5 &&
            b[0] === 0x25 &&
            b[1] === 0x50 &&
            b[2] === 0x44 &&
            b[3] === 0x46
        ) {
            let end = 0
            while (end < b.length && b[end] !== 0x0a && b[end] !== 0x0d) end++
            if (end < b.length) end++ // include newline
            return b.slice(0, end)
        }
        return new Uint8Array()
    }

    private toBytesRewrite(): ByteArray {
        const allObjects = this.getObjects()
        const headerBytes = this.getPdfHeaderBytes()

        // Copy trailer entries (Root, Info, etc.) into a fresh dict, dropping Prev and Size
        const existingTrailerDict = this.getXrefObject().trailerDict
        const freshTrailerDict = new PdfDictionary<PdfTrailerEntries>()
        for (const key of Object.keys(
            existingTrailerDict.values,
        ) as (keyof PdfTrailerEntries)[]) {
            if (key !== 'Prev' && key !== 'Size') {
                const value = existingTrailerDict.get(key)
                if (value) freshTrailerDict.set(key, value)
            }
        }

        const freshXref = new PdfXrefLookup({
            type: 'table',
            trailerDict: freshTrailerDict,
        })
        freshXref.resolver = this

        const serializer = new PdfObjectSerializer()
        serializer.offset = headerBytes.length

        for (const obj of allObjects) {
            freshXref.addObject(obj)
            serializer.feed(obj)
            obj.setModified(false)
        }

        // Re-emit non-indirect body objects (comments, etc.) before the xref
        for (const obj of this.bodyObjects) {
            serializer.feed(obj)
        }

        serializer.feed(...freshXref.toTrailerSection())
        this.documentBytes = concatUint8Arrays([
            headerBytes,
            serializer.toBytes(),
        ])
        this.xrefObject = freshXref
        this.objectCache.clear()

        return this.documentBytes
    }

    toString(): string {
        return bytesToString(this.toBytes())
    }

    parseObject(offset: number = this.offset): PdfObject | undefined {
        const tokeniser = new PdfByteStreamTokeniser()
        const decoder = new PdfDecoder()
        let object: PdfObject | undefined

        for (let i = offset; i < this.documentBytes.length; i++) {
            tokeniser.feed(this.documentBytes[i])

            for (const token of tokeniser.nextItems()) {
                decoder.feed(token)
            }

            for (const obj of decoder.nextItems()) {
                this.offset = i
                object = this.attachResolver(obj)

                if (object instanceof PdfIndirectObject) {
                    this.securityHandler?.decryptObject(object)
                }

                return object
            }
        }

        return undefined
    }

    getObjectAtOffset(offset: number): PdfObject {
        const obj = this.parseObject(offset)
        if (!obj) {
            throw new Error(`No object found at offset ${offset}`)
        }
        return obj
    }

    private getIndirectObject(
        offset: number = this.offset,
        objectNumber: number,
        generationNumber: number,
    ): PdfLazyObject {
        if (this.objectCache.has(`${objectNumber} ${generationNumber}`)) {
            return this.objectCache.get(
                `${objectNumber} ${generationNumber}`,
            ) as PdfLazyObject
        }

        const lazyObject = new PdfLazyObject(this, {
            objectNumber: objectNumber,
            generationNumber: generationNumber,
            offset: offset,
        })
        this.objectCache.set(`${objectNumber} ${generationNumber}`, lazyObject)
        return lazyObject
    }

    private attachResolver(obj: PdfObject): PdfObject {
        const seen = new Set<PdfObject>()
        const walk = (obj: PdfObject) => {
            if (seen.has(obj)) return
            seen.add(obj)

            if (
                obj instanceof PdfObjectReference &&
                !(obj instanceof PdfIndirectObject)
            ) {
                obj.resolver = this
            } else if (obj instanceof PdfStream) {
                walk(obj.header)
            } else if (obj instanceof PdfDictionary) {
                for (const [, value] of obj.entries()) {
                    if (value) walk(value)
                }
            } else if (obj instanceof PdfArray) {
                for (const item of obj.items) {
                    walk(item)
                }
            } else if (obj instanceof PdfIndirectObject) {
                walk(obj.content)
            }
        }

        walk(obj)
        return obj
    }

    getStartXRef(): number {
        console.log(bytesToString(this.documentBytes))
        const sByte = 0x73 // 's'
        const tByte = 0x74 // 't'
        const aByte = 0x61 // 'a'

        this.offset = this.documentBytes.length - 1

        while (this.offset >= 0) {
            if (
                this.documentBytes[this.offset] === sByte &&
                this.documentBytes[this.offset + 1] === tByte &&
                this.documentBytes[this.offset + 2] === aByte
            ) {
                const obj = this.parseObject()
                if (obj instanceof PdfStartXRef) {
                    return obj.offset.value
                }
            }
            this.offset--
        }

        throw new Error('StartXRef not found')
    }

    getXrefObject(): PdfXrefLookup {
        if (this.xrefObject) {
            return this.xrefObject
        }

        const obj = this.parseObject()
        if (!obj) {
            throw new Error('No object found at startXRef offset')
        }

        if (obj instanceof PdfIndirectObject) {
            if (!(obj.content instanceof PdfStream)) {
                throw new Error(
                    'Expected xref stream object, got ' +
                        obj.content.objectType,
                )
            }

            this.xrefObject = new PdfXrefLookup({
                type: 'stream',
                object: obj,
                trailerDict: obj.content.header,
            })
        } else if (obj instanceof PdfXRefTable) {
            const trailer = this.parseObject()
            if (!(trailer instanceof PdfTrailer)) {
                throw new Error('Expected trailer, got ' + trailer?.objectType)
            }
            this.xrefObject = new PdfXrefLookup({
                type: 'table',
                object: obj,
                trailerDict: trailer.dict,
            })
        } else {
            throw new Error(
                'Expected xref table or stream object, got ' + obj?.objectType,
            )
        }

        return this.xrefObject!
    }

    getXrefEntries(): Map<number, PdfXRefStreamEntry> {
        // Walk the full prev chain, collecting each xref from newest to oldest
        const chain: PdfXrefLookup[] = []
        const seenOffsets = new Set<number>()
        let xref: PdfXrefLookup | undefined = this.getXrefObject()
        while (xref) {
            const off = xref.offset.resolve()
            if (seenOffsets.has(off)) break
            seenOffsets.add(off)
            chain.push(xref)
            xref = xref.prev
        }

        // Process oldest-first so newer revisions override older ones
        const entries = new Map<number, PdfXRefStreamEntry>()
        for (const x of chain.reverse()) {
            for (const entry of x.entriesValues) {
                entries.set(entry.objectNumber.value, entry)
            }
        }
        return entries
    }

    getObjects(): PdfIndirectObject[] {
        const results: PdfIndirectObject[] = []
        for (const entry of this.getXrefEntries().values()) {
            if (entry instanceof PdfXRefStreamCompressedEntry) {
                console.log('TODO: handle compressed xref stream entries')
                continue
            }
            if (entry instanceof PdfXRefTableEntry && !entry.inUse) continue
            results.push(
                this.getIndirectObject(
                    entry.byteOffset.value,
                    entry.objectNumber.value,
                    entry.generationNumber.value,
                ),
            )
        }
        return results
    }

    getObjectByReference(ref: {
        objectNumber: number
        generationNumber: number
    }): PdfIndirectObject | undefined {
        const xref = this.getXrefObject()
        const entry = xref.getObject(ref.objectNumber)
        if (!entry) {
            return undefined
        }

        if (entry instanceof PdfXRefTableEntry) {
            const offset = entry.byteOffset.value
            return this.getIndirectObject(
                offset,
                ref.objectNumber,
                ref.generationNumber,
            )
        } else {
            console.log(entry)
            throw new Error('TODO: handle compressed xref stream entries')
        }
    }
}
