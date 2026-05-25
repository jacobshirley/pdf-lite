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
    PdfObjStream,
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
import { Ref } from '../core/ref'
import { ByteArray } from '../types'
import { bytesToString, concatUint8Arrays } from '../utils'
import { PdfLazyObject } from './pdf-lazy-indirect-object'
import { PdfXrefLookup } from './pdf-xref-lookup'
import { PdfToken } from '../core/tokens/token'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token'

export class PdfObjectManager implements IPdfObjectResolver {
    private _securityHandler?: PdfSecurityHandler
    xrefType: 'table' | 'stream' = 'stream'

    private documentBytes: ByteArray
    private offset: number
    private toAdd: PdfObject[] = []
    private toDelete: PdfObject[] = []
    protected xrefObject?: PdfXrefLookup
    protected objectCache: Map<string, PdfObject> = new Map()
    private _xrefEntriesCache?: Map<number, PdfXRefStreamEntry>

    constructor(documentBytes?: ByteArray, offset?: number) {
        if (!documentBytes || documentBytes.length === 0) {
            this.documentBytes = new Uint8Array()
            this.offset = 0
            this.xrefObject = new PdfXrefLookup({
                type: this.xrefType,
            })
            this.xrefObject.resolver = this
        } else {
            this.documentBytes = documentBytes
            this.offset = offset ?? this.getStartXRef()
        }
    }

    get insertOffset(): number {
        return this.xrefObject?.offset.resolve() ?? this.documentBytes.length
    }

    get staticBytes(): Uint8Array {
        return this.documentBytes.subarray(0, this.insertOffset)
    }

    get trailerDict(): PdfDictionary<PdfTrailerEntries> {
        return this.getXrefObject().trailerDict
    }

    set securityHandler(security: PdfSecurityHandler | undefined) {
        this._securityHandler = security

        if (!this._securityHandler) {
            return
        }

        this._securityHandler.write()

        const encryptionDictObject = new PdfIndirectObject({
            content: this._securityHandler.dict,
            encryptable: false,
        })

        this.append(encryptionDictObject)

        const xref = this.getXrefObject()
        xref.trailerDict.set('Encrypt', encryptionDictObject.reference)
        if (!xref.trailerDict.get('ID')) {
            xref.trailerDict.set('ID', this._securityHandler.getDocumentId())
        }
    }

    get securityHandler(): PdfSecurityHandler | undefined {
        return this._securityHandler
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

    get xrefOffset(): number {
        return this.getXrefObject().offset.resolve()
    }

    private newRevision() {
        const prev = this.getXrefObject()
        const newXref = new PdfXrefLookup({
            type: this.xrefType,
            prev,
        })
        newXref.resolver = this
        for (const [key, val] of prev.trailerDict.entries()) {
            if (key !== 'Prev' && key !== 'Size' && val) {
                newXref.trailerDict.set(
                    key as keyof PdfTrailerEntries,
                    val as never,
                )
            }
        }
        return newXref
    }

    private collectMissingReferences(
        ...objects: PdfObject[]
    ): PdfIndirectObject[] {
        const seen = new Set<PdfObject>()
        const missing: PdfIndirectObject[] = []
        const queue: PdfObject[] = [...objects]
        while (queue.length > 0) {
            const obj = queue.pop()!
            if (seen.has(obj)) continue
            seen.add(obj)

            if (
                obj instanceof PdfObjectReference &&
                !(obj instanceof PdfIndirectObject)
            ) {
                if (obj.resolver) {
                    try {
                        const resolved = obj.resolve()
                        if (
                            resolved instanceof PdfIndirectObject &&
                            !resolved.inPdf()
                        ) {
                            missing.push(resolved)
                            queue.push(resolved)
                        }
                    } catch {
                        // Skip unresolvable references
                    }
                }
            } else if (obj instanceof PdfStream) {
                queue.push(obj.header)
            } else if (obj instanceof PdfDictionary) {
                for (const [, value] of obj.entries()) {
                    if (value) queue.push(value)
                }
            } else if (obj instanceof PdfArray) {
                for (const item of obj.items) queue.push(item)
            } else if (obj instanceof PdfIndirectObject) {
                queue.push(obj.content)
            }
        }
        return missing
    }

    private getBytes():
        | {
              newBytes: Uint8Array<ArrayBuffer>
              newXref: PdfXrefLookup
          }
        | undefined {
        const added: PdfObject[] = [...this.toAdd]
        const edited: PdfObject[] = []
        const deleted: PdfObject[] = [...this.toDelete]

        for (const [_, obj] of this.objectCache.entries()) {
            if (obj.isModified() && !added.includes(obj)) {
                edited.push(obj)
            }
        }

        // Nothing happened, so just return the document bytes
        if (!added.length && !edited.length && !deleted.length) {
            return
        }

        const newXref = this.newRevision()

        for (const deleteable of deleted) {
            if (deleteable instanceof PdfIndirectObject) {
                newXref.removeObject(deleteable)
            }
        }

        const baseOffset = this.documentBytes.length

        // Phase 1: serialize all objects and collect their bytes (sets byteOffset Refs)
        const objSerializer = new PdfObjectSerializer(
            baseOffset,
            this.securityHandler,
        )
        for (const newObject of [...added, ...edited]) {
            if (newObject instanceof PdfIndirectObject) {
                newXref.addObject(newObject)
            }
            objSerializer.feed(newObject)
        }
        const objectBytes = objSerializer.toBytes()

        // Phase 2: rebuild xref with now-correct offsets, then serialize trailer
        newXref.update()
        const trailerSerializer = new PdfObjectSerializer(
            baseOffset + objectBytes.length,
            this.securityHandler,
        )
        trailerSerializer.feed(...newXref.toTrailerSection())
        const trailerBytes = trailerSerializer.toBytes()

        const newBytes = concatUint8Arrays([objectBytes, trailerBytes])

        return {
            newBytes: concatUint8Arrays([this.documentBytes, newBytes]),
            newXref: newXref,
        }
    }

    write(): void {
        const bytes = this.getBytes()
        if (!bytes) {
            return
        }

        this.objectCache.values().forEach((x) => x.setModified(false))
        this.toAdd = []
        this.toDelete = []
        this.documentBytes = bytes.newBytes
        this.xrefObject = bytes.newXref
        this._xrefEntriesCache = undefined
    }

    prepend(...objects: PdfObject[]): void {
        if (objects.length === 0) return

        objects.forEach((object) => {
            if (object instanceof PdfIndirectObject) {
                if (
                    object.inPdf() &&
                    this.objectCache.has(object.reference.key)
                ) {
                    return
                }

                this.objectCache.set(object.reference.key, object)
            }

            this.toAdd.unshift(object)
        })

        const missing = this.collectMissingReferences(...objects)
        this.prepend(...missing)
    }

    append(...objects: PdfObject[]): void {
        if (objects.length === 0) return

        objects.forEach((object) => {
            if (object instanceof PdfIndirectObject) {
                if (
                    object.inPdf() &&
                    this.objectCache.has(object.reference.key)
                ) {
                    return
                }

                this.objectCache.set(object.reference.key, object)
            }

            this.toAdd.push(object)
        })

        const missing = this.collectMissingReferences(...objects)
        this.append(...missing)
    }

    delete(...objects: PdfObject[]): void {
        this.toDelete.push(...objects)
    }

    toBytes(mode: 'append' | 'rewrite' = 'append'): ByteArray {
        if (mode === 'rewrite') {
            throw new Error('Rewrite not implemented yet')
        }
        return this.getBytes()?.newBytes ?? this.documentBytes
    }

    updateHeader(comment: { asString(): string }): void {
        //TODO
    }

    toString(): string {
        return bytesToString(this.toBytes())
    }

    tokensWithObjects(): {
        token: PdfToken
        object: PdfObject | undefined
    }[] {
        return this.getObjects().flatMap((obj) => {
            const tokens = obj.toTokens()
            if (
                tokens.length > 0 &&
                !(tokens[tokens.length - 1] instanceof PdfWhitespaceToken)
            ) {
                tokens.push(PdfWhitespaceToken.NEWLINE)
            }
            return tokens.map((token) => ({ token, object: obj }))
        })
    }

    parseObject(
        offset: number = this.offset,
        expectedObject?: new (...args: any[]) => PdfIndirectObject,
    ): PdfObject | undefined {
        const tokeniser = new PdfByteStreamTokeniser()
        const decoder = new PdfDecoder()
        let object: PdfObject | undefined

        for (let i = offset; i < this.documentBytes.length; i++) {
            tokeniser.feed(this.documentBytes[i])

            for (const token of tokeniser.nextItems()) {
                decoder.feed(token)
            }

            for (const obj of decoder.nextItems()) {
                if (expectedObject && !(obj instanceof expectedObject)) {
                    continue
                }
                this.offset = i + 1
                object = this.attachResolver(obj)

                if (object instanceof PdfIndirectObject) {
                    this.securityHandler?.decryptObject(object)
                }

                return object
            }
        }

        return undefined
    }

    private findKeywordBefore(keyword: number[], beforeOffset: number): number {
        const b = this.documentBytes
        const start = Math.max(0, beforeOffset - keyword.length)
        for (let i = start; i >= 0; i--) {
            let match = true
            for (let j = 0; j < keyword.length; j++) {
                if (b[i + j] !== keyword[j]) {
                    match = false
                    break
                }
            }
            if (match) return i
        }
        return -1
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
        const key = `${objectNumber} ${generationNumber}`
        if (this.objectCache.has(key)) {
            return this.objectCache.get(key) as PdfLazyObject
        }

        const lazyObject = new PdfLazyObject(this, {
            objectNumber: objectNumber,
            generationNumber: generationNumber,
            offset: offset,
        })
        this.objectCache.set(key, lazyObject)

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

        // Capture absolute offset before parseObject changes this.offset
        const absoluteOffset = this.offset
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
            // After parsing xref table, this.offset points just past the last consumed byte.
            // Scan forward to find the 'trailer' keyword so the fresh decoder sees it.
            const trailerKeyword = [0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72] // 'trailer'
            const trailerOff = this.findKeywordBefore(
                trailerKeyword,
                this.offset,
            )
            const trailer =
                trailerOff !== -1 ? this.parseObject(trailerOff) : undefined
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

        // The tokenizer produces relative byte offsets; correct the xref object's
        // offset to the absolute byte position within documentBytes.
        this.xrefObject.offset = new Ref(absoluteOffset)
        this.xrefObject.resolver = this
        this.attachResolverToDict(this.xrefObject.trailerDict)

        return this.xrefObject!
    }

    private attachResolverToDict(dict: PdfDictionary<any>): void {
        for (const [, value] of dict.entries()) {
            if (
                value instanceof PdfObjectReference &&
                !(value instanceof PdfIndirectObject)
            ) {
                value.resolver = this
            }
        }
    }

    private parseXrefAt(offset: number): PdfXrefLookup {
        const obj = this.parseObject(offset)
        if (!obj) throw new Error(`No xref object at offset ${offset}`)

        let xref: PdfXrefLookup
        if (obj instanceof PdfIndirectObject) {
            if (!(obj.content instanceof PdfStream)) {
                throw new Error(
                    'Expected xref stream, got ' + obj.content.objectType,
                )
            }
            xref = new PdfXrefLookup({
                type: 'stream',
                object: obj,
                trailerDict: obj.content.header,
            })
        } else if (obj instanceof PdfXRefTable) {
            const trailerKeyword = [0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72]
            const trailerOff = this.findKeywordBefore(
                trailerKeyword,
                this.offset,
            )
            const trailer =
                trailerOff !== -1 ? this.parseObject(trailerOff) : undefined
            xref = new PdfXrefLookup({
                type: 'table',
                object: obj,
                trailerDict:
                    trailer instanceof PdfTrailer ? trailer.dict : undefined,
            })
        } else {
            throw new Error(
                'Expected xref table or stream, got ' + obj.objectType,
            )
        }
        // Fix tokenizer-relative offset to absolute document position
        xref.offset = new Ref(offset)
        xref.resolver = this
        return xref
    }

    getXrefEntries(): Map<number, PdfXRefStreamEntry> {
        if (this._xrefEntriesCache) return this._xrefEntriesCache

        // Walk the full prev chain, collecting each xref from newest to oldest
        const chain: PdfXrefLookup[] = []
        const seenOffsets = new Set<number>()
        let xref: PdfXrefLookup | undefined = this.getXrefObject()
        while (xref) {
            const off = xref.offset.resolve()
            if (seenOffsets.has(off)) break
            seenOffsets.add(off)
            chain.push(xref)

            const prevOffset = xref.trailerDict.get('Prev')?.value
            if (!prevOffset || seenOffsets.has(prevOffset)) break
            try {
                xref = this.parseXrefAt(prevOffset)
            } catch {
                break
            }
        }

        // Process newest-first with first-write-wins so newer entries take precedence
        // and current-revision objects appear first in iteration order.
        const entries = new Map<number, PdfXRefStreamEntry>()
        for (const x of chain) {
            for (const entry of x.entriesValues) {
                const num = entry.objectNumber.value
                if (!entries.has(num)) {
                    entries.set(num, entry)
                }
            }
        }
        this._xrefEntriesCache = entries
        return entries
    }

    private _startXRef?: PdfStartXRef

    getObjects(): PdfObject[] {
        const results: PdfIndirectObject[] = []
        for (const entry of this.getXrefEntries().values()) {
            if (entry instanceof PdfXRefStreamCompressedEntry) {
                const obj = this.getObjectByReference({
                    objectNumber: entry.objectNumber.value,
                    generationNumber: 0,
                })
                if (obj) results.push(obj)
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

        // Include persistent startxref so tests can find it via document.objects
        if (!this._startXRef) {
            this._startXRef = new PdfStartXRef(
                this.getXrefObject().object.offset,
            )
        }
        return [...results, this._startXRef]
    }

    getObjectByReference(ref: {
        objectNumber: number
        generationNumber?: number
    }): PdfIndirectObject | undefined {
        const entries = this.getXrefEntries()
        const entry = entries.get(ref.objectNumber)
        if (!entry) {
            return undefined
        }

        if (entry instanceof PdfXRefTableEntry) {
            if (!entry.inUse) return undefined
            const offset = entry.byteOffset.value
            // Normalize generationNumber: default to entry's gen or 0 so cache keys are consistent
            const gen = ref.generationNumber ?? entry.generationNumber.value
            return this.getIndirectObject(offset, ref.objectNumber, gen)
        } else if (entry instanceof PdfXRefStreamCompressedEntry) {
            const key = `${ref.objectNumber} 0`
            if (this.objectCache.has(key)) {
                return this.objectCache.get(key) as PdfIndirectObject
            }
            const streamObj = this.getObjectByReference({
                objectNumber: entry.objectStreamNumber.value,
                generationNumber: 0,
            })
            if (!streamObj) return undefined
            const objStream = streamObj.content
                .as(PdfStream)
                ?.parseAs(PdfObjStream)
            if (!objStream) return undefined
            // Cache all objects from the stream at once to avoid re-decompressing
            for (const obj of objStream.getObjects()) {
                const objKey = `${obj.objectNumber} 0`
                if (!this.objectCache.has(objKey)) {
                    this.attachResolver(obj)
                    this.objectCache.set(objKey, obj)
                }
            }
            return this.objectCache.get(key) as PdfIndirectObject | undefined
        }

        return undefined
    }

    [Symbol.iterator]() {
        return this.getObjects()[Symbol.iterator]()
    }
}

/** @deprecated Use PdfObjectManager */
export const PdfLazyObjectManager = PdfObjectManager
