import { PdfToken } from '../tokens/token.js'
import { PdfEndStreamToken } from '../tokens/end-stream-token.js'
import { PdfStartStreamToken } from '../tokens/start-stream-token.js'
import { PdfStreamChunkToken } from '../tokens/stream-chunk-token.js'
import { PdfDictionary } from './pdf-dictionary.js'
import { PdfObject } from './pdf-object.js'
import { PdfName } from './pdf-name.js'
import { PdfArray } from './pdf-array.js'
import { flate } from '../../filters/flate.js'
import { asciiHex } from '../../filters/asciihex.js'
import { ascii85 } from '../../filters/ascii85.js'
import { lzw } from '../../filters/lzw.js'
import { runLength } from '../../filters/runlength.js'
import { passthroughFilter } from '../../filters/pass-through.js'
import { ByteArray } from '../../types.js'
import { PdfNumber } from './pdf-number.js'
import { Predictor } from '../../utils/predictors.js'
import { bytesToPdfObjects } from '../generators.js'
import { PdfIndirectObject } from './pdf-indirect-object.js'
import { PdfXRefTableEntry } from './pdf-xref-table.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfFilter, PdfStreamFilterType } from '../../filters/types.js'
import { bytesToString } from '../../utils/bytesToString.js'

export class PdfStream<
    T extends PdfDictionary = PdfDictionary,
> extends PdfObject {
    header: T
    original: ByteArray
    preStreamDataTokens?: PdfToken[]
    postStreamDataTokens?: PdfToken[]

    constructor(
        options:
            | { header: T; original: ByteArray | string; isModified?: boolean }
            | ByteArray
            | string,
    ) {
        super()

        if (typeof options === 'string' || options instanceof Uint8Array) {
            options = { header: new PdfDictionary() as T, original: options }
        }

        this.header = options.header
        this.modified = options.isModified ?? true
        this.original =
            typeof options.original === 'string'
                ? stringToBytes(options.original)
                : options.original
        if (!this.header.get('Length')) {
            this.header.set('Length', new PdfNumber(this.original.length))
        }
    }

    get raw(): ByteArray {
        const length = this.header.get('Length')?.as(PdfNumber)?.value
        if (length === undefined) return this.original
        return this.original.slice(0, length)
    }

    set raw(data: ByteArray) {
        this.setModified()
        this.original = data
        this.header.set('Length', new PdfNumber(data.length))
    }

    get originalAsString(): string {
        return bytesToString(this.original)
    }

    get rawAsString(): string {
        return bytesToString(this.raw)
    }

    set rawAsString(str: string) {
        this.raw = stringToBytes(str)
    }

    get decodedAsString(): string {
        return bytesToString(this.decode())
    }

    set decodedAsString(str: string) {
        const filters = this.getFilters()
        const predictorParams = Predictor.getDecodeParms(
            this.header.get('DecodeParms')?.as(PdfDictionary),
        )
        this.removeAllFilters()
        this.header.delete('DecodeParms')
        this.rawAsString = str
        if (predictorParams) {
            this.setPredictor(predictorParams)
        }
        for (const filter of filters) {
            this.addFilter(filter)
        }
    }

    getFilters(): PdfStreamFilterType[] {
        const filters = this.header.get('Filter') as
            | PdfArray<PdfName<PdfStreamFilterType>>
            | PdfName<PdfStreamFilterType>
            | undefined
        if (!filters) {
            return []
        }

        if (filters instanceof PdfName) {
            return [filters.value]
        } else if (filters instanceof PdfArray) {
            return filters.items.map((item) => item.value)
        } else {
            throw new Error('Invalid Filter entry in PDF stream')
        }
    }

    addFilter(filterName: PdfStreamFilterType) {
        const filters = this.header.get('Filter')

        if (!filters) {
            this.header.set('Filter', new PdfName(filterName))
        } else if (filters instanceof PdfName) {
            this.header.set(
                'Filter',
                new PdfArray([new PdfName(filterName), filters]),
            )
        } else if (filters instanceof PdfArray) {
            filters.items.unshift(new PdfName(filterName))
        } else {
            throw new Error('Invalid Filter entry in PDF stream')
        }

        const filter = PdfStream.getFilter(filterName)
        this.raw = filter.encode(this.raw)
        return this
    }

    setPredictor(predictorParams: {
        Predictor?: number
        Columns?: number
        Colors?: number
        BitsPerComponent?: number
    }) {
        let decodeParms = this.header.get('DecodeParms')?.as(PdfDictionary)

        if (!decodeParms) {
            decodeParms = new PdfDictionary()
            this.header.set('DecodeParms', decodeParms)
        } else if (decodeParms instanceof PdfDictionary) {
            // already a dictionary
        } else {
            throw new Error('Invalid DecodeParms entry in PDF stream')
        }

        for (const [key, value] of Object.entries(predictorParams)) {
            decodeParms.set(key, new PdfNumber(value))
        }

        this.raw = Predictor.encode(this.raw, predictorParams)

        return this
    }

    removeFilter(filterName: PdfStreamFilterType) {
        let filters = this.header.get('Filter')
        if (!filters) {
            return this
        }

        const decoded = this.decode()

        if (filters instanceof PdfName) {
            if (filters.value === filterName) {
                this.header.delete('Filter')
            }
        } else if (filters instanceof PdfArray) {
            filters.items = filters.items.filter(
                (item) => item.value !== filterName,
            )
            if (filters.items.length === 0) {
                this.header.delete('Filter')
            } else if (filters.items.length === 1) {
                this.header.set('Filter', filters.items[0])
            }
        } else {
            throw new Error('Invalid Filter entry in PDF stream')
        }

        const finalFilters = this.getFilters()
        const encoded = PdfStream.applyFilters(decoded, finalFilters)
        this.raw = encoded
        return this
    }

    removePredictor() {
        const decoded = this.decode()
        this.header.delete('DecodeParms')
        this.raw = decoded
        return this
    }

    removeAllFilters() {
        const decoded = this.decode()
        this.raw = decoded
        this.header.delete('Filter')
        return this
    }

    decode(): ByteArray {
        let data: ByteArray = this.raw
        const filters = this.getFilters()

        for (const filterName of filters) {
            const filter = PdfStream.getFilter(filterName)
            data = filter.decode(data)
        }

        const predictorParams = Predictor.getDecodeParms(
            this.header.get('DecodeParms')?.as(PdfDictionary),
        )

        if (predictorParams) {
            data = Predictor.decode(data, predictorParams)
        }

        return data
    }

    parseAs<T extends PdfStream>(
        Class: new (options: {
            header: PdfDictionary
            original: ByteArray
            isModified?: boolean
        }) => T,
    ): T {
        const instance = new Class({
            header: this.header,
            original: this.original,
            isModified: this.isModified(),
        })
        instance.preTokens = this.preTokens
        instance.postTokens = this.postTokens
        instance.preStreamDataTokens = this.preStreamDataTokens
        instance.postStreamDataTokens = this.postStreamDataTokens

        return instance
    }

    protected tokenize() {
        return [
            ...this.header.toTokens(),
            PdfStartStreamToken.withTrailingWhitespace(
                this.preStreamDataTokens,
            ),
            new PdfStreamChunkToken(this.original),
            new PdfEndStreamToken(),
        ]
    }

    isType(name: string): boolean {
        const type = this.header.get('Type')
        return type instanceof PdfName && type.value === name
    }

    static getFilter(name: PdfStreamFilterType): PdfFilter {
        const allFilters = PdfStream.getAllFilters()
        if (!allFilters[name]) {
            throw new Error(`Unsupported filter: ${name}`)
        }

        return allFilters[name]
    }

    static getAllFilters() {
        return {
            FlateDecode: flate(),
            Fl: flate(),
            ASCIIHexDecode: asciiHex(),
            ASCII85Decode: ascii85(),
            LZWDecode: lzw(),
            RunLengthDecode: runLength(),
            CCITTFaxDecode: passthroughFilter(),
            DCTDecode: passthroughFilter(),
            JPXDecode: passthroughFilter(),
            Crypt: passthroughFilter(),
        } as const satisfies {
            [key in PdfStreamFilterType]: PdfFilter
        }
    }

    static applyFilters(
        data: ByteArray,
        filters: PdfStreamFilterType[],
    ): ByteArray {
        let result = data
        for (const filterName of filters) {
            const filter = PdfStream.getFilter(filterName)
            if (!filter) {
                throw new Error(`Unsupported filter: ${filterName}`)
            }
            result = filter.encode(result)
        }
        return result
    }

    cloneImpl(): this {
        return new PdfStream({
            header: this.header.clone(),
            original: new Uint8Array(this.original),
        }) as this
    }

    static fromString(data: string): PdfStream {
        return new PdfStream({
            original: stringToBytes(data),
            header: new PdfDictionary(),
        })
    }
}

export class PdfObjStream extends PdfStream {
    constructor(options: {
        header: PdfDictionary
        original: ByteArray | string
        isModified?: boolean
    }) {
        super(options)

        if (!this.isType('ObjStm')) {
            throw new Error('PDF Object Stream must be of type ObjStm')
        }
    }

    static fromObjects(objects: Iterable<PdfIndirectObject>): PdfObjStream {
        const objByteChunks: ByteArray[] = []
        const headerParts: string[] = []
        let offset = 0
        let objectCount = 0

        for (const obj of objects) {
            // Use toBytes() to preserve binary content (e.g. UTF-16BE strings)
            // instead of toString() which is Latin-1 and would be re-encoded as UTF-8
            headerParts.push(`${obj.objectNumber} ${offset}`)
            const bytes = obj.content.toBytes()
            objByteChunks.push(bytes, new Uint8Array([0x0a])) // object + newline
            offset += bytes.length + 1
            objectCount++
        }

        const headerStr = headerParts.join(' ')
        // First = byte offset of first compressed object from stream start
        const first = objectCount > 0 ? headerStr.length + 1 : 0

        const headerDict = new PdfDictionary()
        headerDict.set('Type', new PdfName('ObjStm'))
        headerDict.set('N', new PdfNumber(objectCount))
        headerDict.set('First', new PdfNumber(first))

        if (objectCount === 0) {
            return new PdfObjStream({
                header: headerDict,
                original: new Uint8Array(),
            })
        }

        // Build stream bytes: headerStr + '\n' + obj1bytes + obj2bytes + ...
        // Drop trailing newline after the last object
        objByteChunks.pop()
        const headerBytes = stringToBytes(headerStr + '\n')
        const totalLength = objByteChunks.reduce(
            (sum, chunk) => sum + chunk.length,
            headerBytes.length,
        )
        const streamBytes = new Uint8Array(totalLength)
        let pos = 0
        streamBytes.set(headerBytes, pos)
        pos += headerBytes.length
        for (const chunk of objByteChunks) {
            streamBytes.set(chunk, pos)
            pos += chunk.length
        }

        return new PdfObjStream({
            header: headerDict,
            original: streamBytes,
        })
    }

    *getObjectStream(): Generator<PdfIndirectObject> {
        const decodedData = this.decode()
        const reader = bytesToPdfObjects([decodedData])
        const numbers: PdfNumber[] = []
        let i = 0
        const n = this.header.get('N') as PdfNumber
        const totalObjects = n ? n.value : 0

        while (true) {
            const { value: obj, done } = reader.next()
            if (done) break

            if (obj instanceof PdfNumber) {
                // Collect object numbers and byte offsets
                numbers.push(obj)
            } else {
                // This is an actual PDF object (can be Dictionary, Array, String, Name, etc.)
                // The first N*2 numbers are: obj_num1 offset1 obj_num2 offset2 ...
                // After that come the actual objects
                const objectNumber = numbers[i * 2].value
                const generationNumber = 0

                const decompressedObject = new PdfIndirectObject({
                    objectNumber,
                    generationNumber,
                    content: obj,
                    compressed: true,
                }).clone()
                decompressedObject.setModified(false)
                yield decompressedObject

                i++

                // Stop after we've read N objects
                if (totalObjects > 0 && i >= totalObjects) {
                    break
                }
            }
        }
    }

    getObject(options: {
        objectNumber: number
    }): PdfIndirectObject | undefined {
        for (const obj of this.getObjectStream()) {
            if (obj.objectNumber === options.objectNumber) {
                return obj
            }
        }
        return undefined
    }

    getObjects(): PdfIndirectObject[] {
        return Array.from(this.getObjectStream())
    }

    cloneImpl(): this {
        return new PdfObjStream({
            header: this.header.clone(),
            original: new Uint8Array(this.original),
        }) as this
    }
}

export class PdfXRefStreamCompressedEntry {
    objectNumber: PdfNumber
    objectStreamNumber: PdfNumber
    index: PdfNumber

    constructor(options: {
        objectNumber: number | PdfNumber
        objectStreamNumber: number | PdfNumber
        index: number | PdfNumber
    }) {
        this.objectNumber =
            options.objectNumber instanceof PdfNumber
                ? options.objectNumber
                : new PdfNumber(options.objectNumber)
        this.objectStreamNumber =
            options.objectStreamNumber instanceof PdfNumber
                ? options.objectStreamNumber
                : new PdfNumber(options.objectStreamNumber)
        this.index =
            options.index instanceof PdfNumber
                ? options.index
                : new PdfNumber(options.index)
    }
}

export type PdfXRefStreamStandardEntry = PdfXRefTableEntry
export const PdfXRefStreamStandardEntry = PdfXRefTableEntry

export type PdfXRefStreamEntry =
    | PdfXRefStreamStandardEntry
    | PdfXRefStreamCompressedEntry

export class PdfXRefStream extends PdfStream {
    constructor(options?: {
        header?: PdfDictionary
        original?: ByteArray | string
        isModified?: boolean
    }) {
        super({
            header: options?.header ?? PdfXRefStream.createNewHeader(),
            original: options?.original ?? new Uint8Array(),
            isModified: options?.isModified,
        })

        if (!this.isType('XRef')) {
            throw new Error('PDF XRef Stream must be of type XRef')
        }
    }

    static createNewHeader(): PdfDictionary {
        const headerDict = new PdfDictionary()
        headerDict.set('Type', new PdfName('XRef'))
        headerDict.set(
            'W',
            new PdfArray([
                new PdfNumber(1),
                new PdfNumber(4),
                new PdfNumber(2),
            ]),
        )
        headerDict.set('Size', new PdfNumber(0))

        return headerDict
    }

    static fromEntries(
        entries: PdfXRefStreamEntry[],
        headerDict: PdfDictionary = new PdfDictionary(),
    ): PdfXRefStream {
        headerDict.delete('DecodeParms')
        headerDict.delete('Filter')
        headerDict.set('Type', new PdfName('XRef'))
        entries.sort((a, b) => a.objectNumber.value - b.objectNumber.value)

        const W = this.calculateW(entries)
        headerDict.set('W', new PdfArray(W.map((w) => new PdfNumber(w))))

        // Build Index array - pairs of [start, count] for each contiguous range
        const indexArray: number[] = []
        if (entries.length > 0) {
            let rangeStart = entries[0].objectNumber.value
            let rangeCount = 1

            for (let i = 1; i < entries.length; i++) {
                const currentNum = entries[i].objectNumber.value
                const prevNum = entries[i - 1].objectNumber.value

                if (currentNum === prevNum + 1) {
                    // Contiguous - extend current range
                    rangeCount++
                } else {
                    // Gap found - save current range and start new one
                    indexArray.push(rangeStart, rangeCount)
                    rangeStart = currentNum
                    rangeCount = 1
                }
            }

            // Add final range
            indexArray.push(rangeStart, rangeCount)
        }

        headerDict.set(
            'Index',
            new PdfArray(indexArray.map((num) => new PdfNumber(num))),
        )

        const size =
            entries.length === 0
                ? 0
                : Math.max(
                      ...entries.map((entry) => entry.objectNumber.value),
                  ) + 1
        headerDict.set('Size', new PdfNumber(size))

        // Encode entries to bytes
        const entrySize = W.reduce((a, b) => a + b, 0)
        const streamBytes = new Uint8Array(entries.length * entrySize)
        let offset = 0

        for (const entry of entries) {
            const typeByte =
                entry instanceof PdfXRefTableEntry ? (entry.inUse ? 1 : 0) : 2

            let field1 = typeByte
            let field2 = 0
            let field3 = 0

            if (entry instanceof PdfXRefTableEntry) {
                field2 = entry.byteOffset.value
                field3 = entry.generationNumber.value
            } else if (entry instanceof PdfXRefStreamCompressedEntry) {
                field2 = entry.objectStreamNumber.value
                field3 = entry.index.value
            }

            for (let i = 0; i < W[0]; i++) {
                streamBytes[offset++] = (field1 >> (8 * (W[0] - 1 - i))) & 0xff
            }
            for (let i = 0; i < W[1]; i++) {
                streamBytes[offset++] = (field2 >> (8 * (W[1] - 1 - i))) & 0xff
            }
            for (let i = 0; i < W[2]; i++) {
                streamBytes[offset++] = (field3 >> (8 * (W[2] - 1 - i))) & 0xff
            }
        }

        const rawData = new Uint8Array(streamBytes)
        headerDict.set('Length', new PdfNumber(rawData.length))

        return new PdfXRefStream({
            header: headerDict,
            original: rawData,
        })
    }

    addEntry(entry: PdfXRefStreamEntry) {
        const entries = this.getEntries()
        entries.push(entry)

        const newXRefStream = PdfXRefStream.fromEntries(entries)

        this.header = newXRefStream.header
        this.raw = newXRefStream.raw

        return this
    }

    private static calculateW(entries: PdfXRefStreamEntry[]): number[] {
        let maxGeneration = 0

        const maxOffset = Math.max(
            ...entries.map((entry) => {
                let value = 0

                if (entry instanceof PdfXRefTableEntry) {
                    value = entry.byteOffset.value
                    maxGeneration = Math.max(
                        maxGeneration,
                        entry.generationNumber.value,
                    )
                } else if (entry instanceof PdfXRefStreamCompressedEntry) {
                    value = entry.objectStreamNumber.value
                }

                return value
            }),
        )

        const W1 = 1 // Type byte
        const W2 =
            maxOffset === -1 ? 0 : Math.ceil(Math.log2(maxOffset + 1) / 8) || 1 // Offset or next free
        const W3 = Math.ceil(Math.log2(maxGeneration + 1) / 8) || 1 // Generation number or index

        return [W1, W2, W3]
    }

    get prev(): PdfNumber | undefined {
        const prev = this.header.get('Prev')
        return prev instanceof PdfNumber ? prev : undefined
    }

    *getEntryStream(): Generator<PdfXRefStreamEntry> {
        const data = this.decode()

        const header = this.header
        const W = header
            .get('W')
            ?.as(PdfArray<PdfNumber>)
            ?.items?.map((v: any) => v.value)

        if (!W) throw new Error('Missing W entry in XRef stream')

        if (W.length !== 3) {
            throw new Error(
                'Invalid W entry in XRef stream. Expected array of 3 numbers.',
            )
        }

        const entrySize = W[0] + W[1] + W[2]

        const Index = header
            .get('Index')
            ?.as(PdfArray<PdfNumber>)
            ?.items?.map((v) => v.value)

        const Size = header.get('Size')!.as(PdfNumber).value

        const objectRanges: [number, number][] = Index
            ? Array.from({ length: Index.length / 2 }, (_, i) => [
                  Index[i * 2],
                  Index[i * 2 + 1],
              ])
            : [[0, Size]]

        const expectedLength =
            objectRanges.reduce((sum, [, count]) => sum + count, 0) * entrySize
        if (data.length < expectedLength) {
            throw new Error(
                `XRef stream too short: expected ${expectedLength} bytes, got ${data.length}`,
            )
        }

        let offset = 0

        for (const [startObj, count] of objectRanges) {
            for (let i = 0; i < count; i++) {
                const objectNumber = startObj + i

                const type = this.readInt(data, offset, W[0])
                offset += W[0]
                const field2 = this.readInt(data, offset, W[1])
                offset += W[1]
                const field3 = this.readInt(data, offset, W[2])
                offset += W[2]

                let entry: PdfXRefStreamEntry
                if (type === 0) {
                    entry = new PdfXRefTableEntry({
                        objectNumber,
                        generationNumber: field3,
                        byteOffset: field2,
                        inUse: false,
                    })
                } else if (type === 1) {
                    entry = new PdfXRefTableEntry({
                        objectNumber,
                        generationNumber: field3,
                        byteOffset: field2,
                        inUse: true,
                    })
                } else if (type === 2) {
                    entry = new PdfXRefStreamCompressedEntry({
                        objectNumber,
                        objectStreamNumber: field2,
                        index: field3,
                    })
                } else {
                    throw new Error(`Unknown xref entry type: ${type}`)
                }

                yield entry
            }
        }
    }

    getEntries(): PdfXRefStreamEntry[] {
        return Array.from(this.getEntryStream())
    }

    private readInt(data: ByteArray, offset: number, length: number): number {
        let value = 0
        for (let i = 0; i < length; i++) {
            value = (value << 8) | data[offset + i]
        }
        return value
    }

    cloneImpl(): this {
        return new PdfXRefStream({
            header: this.header.clone(),
            original: new Uint8Array(this.original),
        }) as this
    }
}
