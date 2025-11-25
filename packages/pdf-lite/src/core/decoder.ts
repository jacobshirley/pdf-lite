import { PdfStartObjectToken } from './tokens/start-object-token.js'
import { PdfObject } from './objects/pdf-object.js'
import { PdfIndirectObject } from './objects/pdf-indirect-object.js'
import { PdfDictionary } from './objects/pdf-dictionary.js'
import { PdfEndObjectToken } from './tokens/end-object-token.js'
import { PdfStartDictionaryToken } from './tokens/start-dictionary-token.js'
import { PdfArray } from './objects/pdf-array.js'
import { PdfEndDictionaryToken } from './tokens/end-dictionary-token.js'
import { PdfNumber } from './objects/pdf-number.js'
import { PdfObjectReference } from './objects/pdf-object-reference.js'
import { PdfTrailer } from './objects/pdf-trailer.js'
import { PdfHexadecimal } from './objects/pdf-hexadecimal.js'
import { PdfStartArrayToken } from './tokens/start-array-token.js'
import { PdfEndArrayToken } from './tokens/end-array-token.js'
import { PdfNameToken } from './tokens/name-token.js'
import { PdfName } from './objects/pdf-name.js'
import { PdfBoolean } from './objects/pdf-boolean.js'
import { PdfNull } from './objects/pdf-null.js'
import { PdfString } from './objects/pdf-string.js'
import { PdfNumberToken } from './tokens/number-token.js'
import { PdfBooleanToken } from './tokens/boolean-token.js'
import { PdfHexadecimalToken } from './tokens/hexadecimal-token.js'
import { PdfNullToken } from './tokens/null-token.js'
import { PdfObjectReferenceToken } from './tokens/object-reference-token.js'
import { PdfStringToken } from './tokens/string-token.js'
import { PdfStartStreamToken } from './tokens/start-stream-token.js'
import { PdfStream } from './objects/pdf-stream.js'
import { PdfEndStreamToken } from './tokens/end-stream-token.js'
import { PdfStreamChunkToken } from './tokens/stream-chunk-token.js'
import { PdfXRefTableStartToken } from './tokens/xref-table-start-token.js'
import {
    PdfXRefTable,
    PdfXRefTableEntry,
    PdfXRefTableSectionHeader,
} from './objects/pdf-xref-table.js'
import { PdfXRefTableSectionStartToken } from './tokens/xref-table-section-start-token.js'
import { PdfXRefTableEntryToken } from './tokens/xref-table-entry-token.js'
import { PdfTrailerToken } from './tokens/trailer-token.js'
import { PdfCommentToken } from './tokens/comment-token.js'
import { PdfComment } from './objects/pdf-comment.js'
import { PdfStartXRefToken } from './tokens/start-xref-token.js'
import { PdfStartXRef } from './objects/pdf-start-xref.js'
import { PdfWhitespaceToken } from './tokens/whitespace-token.js'
import { PdfToken } from './tokens/token.js'
import { IncrementalParser } from './incremental-parser.js'
import { concatUint8Arrays } from '../utils/concatUint8Arrays.js'
import { ByteArray } from '../types.js'

const DEFAULT_MAX_BUFFER_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Decodes PDF tokens into PDF objects.
 * Handles parsing of all PDF object types including dictionaries, arrays, streams, and xref tables.
 */
export class PdfDecoder extends IncrementalParser<PdfToken, PdfObject> {
    private ignoreWhitespace: boolean = false
    private maxBufferSizeBytes: number = DEFAULT_MAX_BUFFER_SIZE_BYTES

    /**
     * Creates a new PDF decoder.
     *
     * @param options - Configuration options
     * @param options.ignoreWhitespace - If true, whitespace tokens are ignored
     * @param options.maxBufferSizeBytes - Maximum buffer size before compaction (default: 10MB)
     */
    constructor(options?: {
        ignoreWhitespace?: boolean
        maxBufferSizeBytes?: number
    }) {
        super()
        this.ignoreWhitespace = options?.ignoreWhitespace ?? false
        this.maxBufferSizeBytes =
            options?.maxBufferSizeBytes ?? DEFAULT_MAX_BUFFER_SIZE_BYTES
    }

    private nextName(): PdfName {
        const preTokens = this.nextExtraTokens()
        const token = this.expect(PdfNameToken)
        const postTokens = this.nextExtraTokens()

        const name = new PdfName(token.name)
        name.preTokens = preTokens
        name.postTokens = postTokens

        return name
    }

    private nextIndirectObject(): PdfIndirectObject {
        const preTokens = this.nextExtraTokens()
        const startToken = this.expect(PdfStartObjectToken)

        const contentPreTokens = this.nextExtraTokens()
        const content = this.nextValue()
        content.preTokens = contentPreTokens
        this.expect(PdfEndObjectToken)

        const postTokens = this.nextExtraTokens()

        const obj = new PdfIndirectObject({
            objectNumber: startToken.objectNumber,
            generationNumber: startToken.generationNumber,
            content,
            offset: startToken.byteOffset,
        })

        obj.preTokens = preTokens
        obj.postTokens = postTokens

        return obj
    }

    private nextValue(): PdfObject {
        return this.nextObject()
    }

    private nextDictionary(): PdfDictionary | PdfStream {
        const preTokens = this.nextExtraTokens()
        this.expect(PdfStartDictionaryToken)
        const dictionary = new PdfDictionary()
        dictionary.innerTokens = this.nextExtraTokens()

        while (true) {
            let next = this.peek()

            if (!next || next instanceof PdfEndDictionaryToken) {
                this.next() // consume end token
                break
            }

            const name = this.nextName()
            const value = this.nextValue()
            dictionary.set(name, value)
        }

        const postTokens = this.nextExtraTokens()

        dictionary.preTokens = preTokens
        dictionary.postTokens = postTokens

        if (this.peek() instanceof PdfStartStreamToken) {
            const stream = this.nextStream(dictionary)

            return stream
        }

        return dictionary
    }

    private nextArray(): PdfArray {
        const preTokens = this.nextExtraTokens()
        this.expect(PdfStartArrayToken)
        const array = new PdfArray()
        const innerTokens = this.nextExtraTokens()
        array.innerTokens = innerTokens

        while (true) {
            const next = this.peek()
            if (!next || next instanceof PdfEndArrayToken) {
                this.next() // consume end token
                break
            }

            array.push(this.nextValue())
        }

        const postTokens = this.nextExtraTokens()

        array.preTokens = preTokens
        array.postTokens = postTokens

        return array
    }

    private nextStream(header: PdfDictionary): PdfStream {
        const preTokens = this.nextExtraTokens()
        const startStreamToken = this.expect(PdfStartStreamToken)

        const chunks: ByteArray[] = []
        const preStreamTokens = startStreamToken.getTrailingWhitespaceTokens()

        while (this.peek() instanceof PdfStreamChunkToken) {
            const chunk = this.expect(PdfStreamChunkToken)

            chunks.push(chunk.toBytes())
        }
        const postStreamDataTokens = this.nextExtraTokens()

        this.expect(PdfEndStreamToken)
        const postTokens = this.nextExtraTokens()

        const stream = new PdfStream({
            header,
            original: concatUint8Arrays(...chunks),
        })

        stream.preStreamDataTokens = preStreamTokens
        stream.postStreamDataTokens = postStreamDataTokens
        stream.preTokens = preTokens
        stream.postTokens = postTokens

        return stream
    }

    private nextComment(): PdfComment {
        const token = this.expect(PdfCommentToken)

        const comment = new PdfComment(token.comment)

        return comment
    }

    private nextPrimitive(): PdfObject {
        const preTokens = this.nextExtraTokens()
        const token = this.next() // consume the primitive token
        if (!token) {
            throw new Error('Expected primitive token but got EOF')
        }

        const postTokens = this.nextExtraTokens()

        let out: PdfObject
        if (token instanceof PdfNumberToken) {
            out = new PdfNumber({
                value: token.value,
                padTo: token.padTo,
                decimalPlaces: token.decimalPlaces,
            })
        } else if (token instanceof PdfBooleanToken) {
            out = new PdfBoolean(token.value)
        } else if (token instanceof PdfHexadecimalToken) {
            out = new PdfHexadecimal(token.raw, 'hex')
        } else if (token instanceof PdfNullToken) {
            out = new PdfNull()
        } else if (token instanceof PdfObjectReferenceToken) {
            out = new PdfObjectReference(
                token.objectNumber,
                token.generationNumber,
            )
        } else if (token instanceof PdfStringToken) {
            out = new PdfString(token.value)
        } else {
            throw new Error(`Unknown primitive token type: ${token.type}`)
        }

        out.preTokens = preTokens
        out.postTokens = postTokens

        return out
    }

    private nextExtraTokens(root: boolean = false): PdfToken[] {
        const tokens: PdfToken[] = []
        while (true) {
            if (this.atEof()) {
                break
            }

            const token = this.peek()
            if (!token) {
                break
            }

            if (this.ignoreWhitespace && token instanceof PdfWhitespaceToken) {
                this.next() // consume whitespace
                continue
            }

            if (root && token instanceof PdfCommentToken) {
                break
            }

            if (
                !(
                    token instanceof PdfWhitespaceToken ||
                    token instanceof PdfCommentToken
                )
            ) {
                break
            }

            tokens.push(this.next()!)
        }

        return tokens
    }

    private nextXRefTable(): PdfXRefTable {
        const preTokens = this.nextExtraTokens()
        const xrefToken = this.expect(PdfXRefTableStartToken)
        const xrefTable = new PdfXRefTable()

        if (xrefToken.byteOffset === undefined) {
            throw new Error('XRef table token missing byte offset')
        }

        xrefTable.offset.update(xrefToken.byteOffset)

        while (true) {
            const preTokens = this.nextExtraTokens()
            const next = this.peek()

            if (!next) {
                break
            }

            if (next instanceof PdfXRefTableSectionStartToken) {
                const sectionToken = this.expect(PdfXRefTableSectionStartToken)
                const postTokens = this.nextExtraTokens()

                const section = new PdfXRefTableSectionHeader({
                    startObjectNumber: sectionToken.start.value,
                    entryCount: sectionToken.count.value,
                })

                section.preTokens = preTokens
                section.postTokens = postTokens

                xrefTable.sections.push(section)
            } else if (next instanceof PdfXRefTableEntryToken) {
                const entryToken = this.expect(PdfXRefTableEntryToken)
                const postTokens = this.nextExtraTokens()

                const entry = new PdfXRefTableEntry({
                    objectNumber: entryToken.objectNumber.value,
                    byteOffset: entryToken.offset.ref,
                    generationNumber: entryToken.generationNumber.value,
                    inUse: entryToken.inUse,
                })

                entry.preTokens = preTokens
                entry.postTokens = postTokens

                xrefTable.entries.push(entry)
            } else {
                break
            }
        }

        xrefTable.preTokens = preTokens
        xrefTable.postTokens = this.nextExtraTokens()
        return xrefTable
    }

    private nextTrailer(): PdfTrailer {
        const preTokens = this.nextExtraTokens()
        const trailerToken = this.expect(PdfTrailerToken)
        const dictionary = this.nextDictionary()
        const postTokens = this.nextExtraTokens()

        const trailer = new PdfTrailer(dictionary as PdfDictionary<any>)
        if (trailerToken.byteOffset === undefined) {
            throw new Error('Trailer token missing byte offset')
        }

        trailer.offset.update(trailerToken.byteOffset)

        trailer.preTokens = preTokens
        trailer.postTokens = postTokens

        return trailer
    }

    private nextStartXRef(): PdfStartXRef {
        const preTokens = this.nextExtraTokens()
        this.expect(PdfStartXRefToken)

        const preOffsetTokens = this.nextExtraTokens()
        const offsetToken = this.expect(PdfNumberToken)

        const offset = new PdfNumber(offsetToken.value)

        const startXref = new PdfStartXRef(offset)
        startXref.preTokens = preTokens
        offset.preTokens = preOffsetTokens
        return startXref
    }

    private nextObject(root: boolean = false): PdfObject {
        const preTokens = this.nextExtraTokens(root)
        const token = this.peek()

        if (!token) {
            // This should never happen as atEof should be checked before calling nextObject
            throw new Error('Expected token but did not find one')
        }

        let out: PdfObject
        if (token instanceof PdfStartDictionaryToken) {
            out = this.nextDictionary()
        } else if (token instanceof PdfStartObjectToken) {
            out = this.nextIndirectObject()
        } else if (token instanceof PdfStartArrayToken) {
            out = this.nextArray()
        } else if (token instanceof PdfNameToken) {
            out = this.nextName()
        } else if (PdfDecoder.isPrimitive(token)) {
            out = this.nextPrimitive()
        } else if (token instanceof PdfCommentToken) {
            out = this.nextComment()
        } else if (token instanceof PdfXRefTableStartToken) {
            out = this.nextXRefTable()
        } else if (token instanceof PdfTrailerToken) {
            out = this.nextTrailer()
        } else if (token instanceof PdfStartXRefToken) {
            out = this.nextStartXRef()
        } else {
            throw new Error(`Unknown token type: ${token.type}`)
        }
        const postTokens = this.nextExtraTokens(root)
        out.preTokens = [...preTokens, ...(out.preTokens ?? [])]
        out.postTokens = [...(out.postTokens ?? []), ...postTokens]

        return out
    }

    private static isPrimitive(token: PdfToken): boolean {
        return (
            token instanceof PdfNumberToken ||
            token instanceof PdfBooleanToken ||
            token instanceof PdfHexadecimalToken ||
            token instanceof PdfNullToken ||
            token instanceof PdfObjectReferenceToken ||
            token instanceof PdfStringToken
        )
    }

    protected bufferSize(): number {
        return this.buffer.reduce((acc, obj) => acc + obj.byteLength, 0)
    }

    protected canCompact(): boolean {
        return (
            this.bufferIndex > 50 && this.bufferSize() > this.maxBufferSizeBytes
        )
    }

    protected parse() {
        return this.nextObject(true)
    }
}
