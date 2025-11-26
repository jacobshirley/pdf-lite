import { assert } from '../utils/assert.js'
import { bytesToString } from '../utils/bytesToString.js'
import { IncrementalParser } from './incremental-parser.js'
import { PdfObject } from './objects/pdf-object.js'
import { PdfToken } from './tokens/token.js'
import { PdfBooleanToken } from './tokens/boolean-token.js'
import { PdfCommentToken } from './tokens/comment-token.js'
import { PdfEndArrayToken } from './tokens/end-array-token.js'
import { PdfEndDictionaryToken } from './tokens/end-dictionary-token.js'
import { PdfEndObjectToken } from './tokens/end-object-token.js'
import { PdfEndStreamToken } from './tokens/end-stream-token.js'
import { PdfHexadecimalToken } from './tokens/hexadecimal-token.js'
import { PdfNameToken } from './tokens/name-token.js'
import { PdfNullToken } from './tokens/null-token.js'
import { PdfNumberToken } from './tokens/number-token.js'
import { PdfObjectReferenceToken } from './tokens/object-reference-token.js'
import { PdfStartArrayToken } from './tokens/start-array-token.js'
import { PdfStartDictionaryToken } from './tokens/start-dictionary-token.js'
import { PdfStartObjectToken } from './tokens/start-object-token.js'
import { PdfStartStreamToken } from './tokens/start-stream-token.js'
import { PdfStartXRefToken } from './tokens/start-xref-token.js'
import { PdfStreamChunkToken } from './tokens/stream-chunk-token.js'
import { PdfStringToken } from './tokens/string-token.js'
import { PdfTrailerToken } from './tokens/trailer-token.js'
import { PdfWhitespaceToken } from './tokens/whitespace-token.js'
import { PdfXRefTableEntryToken } from './tokens/xref-table-entry-token.js'
import { PdfXRefTableSectionStartToken } from './tokens/xref-table-section-start-token.js'
import { PdfXRefTableStartToken } from './tokens/xref-table-start-token.js'
import { Parser } from './parser.js'
import { concatUint8Arrays } from '../utils/concatUint8Arrays.js'
import { stringToBytes } from '../utils/stringToBytes.js'
import { ByteArray } from '../types.js'

/**
 * Type alias for a parser that converts bytes to PDF tokens.
 */
export type PdfTokeniser = Parser<number, PdfToken>

const ByteMap = {
    LEFT_PARENTHESIS: 0x28, // (
    RIGHT_PARENTHESIS: 0x29, // )
    LEFT_SQUARE_BRACKET: 0x5b, // [
    RIGHT_SQUARE_BRACKET: 0x5d, // ]
    LEFT_ANGLE_BRACKET: 0x3c, // <
    RIGHT_ANGLE_BRACKET: 0x3e, // >
    SLASH: 0x2f, // /
    PERCENT: 0x25, // %
    s: 0x73, // s
    R: 0x52, // R
    o: 0x6f, // o
    e: 0x65, // e
    t: 0x74, // t
    f: 0x66, // f
    n: 0x6e, // n
    d: 0x64, // d
    r: 0x72, // r
    u: 0x75, // u
    l: 0x6c, // l
    a: 0x61, // a
    x: 0x78, // x
    b: 0x62, // b
    j: 0x6a, // j
    m: 0x6d, // m
    i: 0x69, // i
    NEW_LINE: 0x0a, // \n
    LINE_FEED: 0x0a, // \n
    MINUS: 0x2d, // -
    BACKSLASH: 0x5c, // \
    SPACE: 0x20, // Space
    TAB: 0x09, // Tab
    DOT: 0x2e, // .
}

/**
 * Tokenizes a byte stream into PDF tokens.
 * Handles all PDF syntax including objects, streams, and xref tables.
 */
export class PdfByteStreamTokeniser extends IncrementalParser<
    number,
    PdfToken
> {
    private inStream: boolean = false
    private inXrefTable: boolean = false
    private xrefEntryCount: number = 0
    private lastSectionStartObjectNumber: number = 0
    private streamChunkSizeBytes: number

    /**
     * Creates a new byte stream tokenizer.
     *
     * @param options - Configuration options
     * @param options.streamChunkSizeBytes - Size of stream chunks (default: 1024)
     */
    constructor(options?: { streamChunkSizeBytes?: number }) {
        super()
        this.streamChunkSizeBytes = options?.streamChunkSizeBytes ?? 1024
    }

    /**
     * Feeds a byte array into the tokenizer.
     *
     * @param bytes - The bytes to process
     */
    feedBytes(bytes: ByteArray) {
        for (const byte of bytes) {
            this.feed(byte)
        }
    }

    private readValue(): ByteArray {
        const valueBytes: number[] = []
        let byte = this.peek()
        while (
            byte !== null &&
            !PdfByteStreamTokeniser.isNewLine(byte) &&
            !PdfByteStreamTokeniser.isNameEnd(byte)
        ) {
            valueBytes.push(byte)
            this.next() // Consume the byte
            byte = this.peek()
        }
        return new Uint8Array(valueBytes)
    }

    private nextCommentToken(): PdfCommentToken {
        this.expect(ByteMap.PERCENT) // Consume the '%'
        const commentBytes = this.readValue()
        return new PdfCommentToken(commentBytes)
    }

    private nextWhitespaceToken(): PdfWhitespaceToken {
        const byte = this.next()
        return new PdfWhitespaceToken(byte)
    }

    private nextStartDictionaryToken(): PdfStartDictionaryToken {
        this.expect(ByteMap.LEFT_ANGLE_BRACKET)
        this.expect(ByteMap.LEFT_ANGLE_BRACKET)
        return new PdfStartDictionaryToken()
    }

    private nextNameToken(): PdfNameToken {
        this.expect(ByteMap.SLASH)
        const nameBytes: number[] = []
        let byte = this.peek()
        while (
            byte !== null &&
            !PdfByteStreamTokeniser.isNameEnd(byte) &&
            !PdfByteStreamTokeniser.isWhitespace(byte)
        ) {
            nameBytes.push(this.next()!)
            byte = this.peek()
        }

        return new PdfNameToken(bytesToString(new Uint8Array(nameBytes)))
    }

    private nextDictionaryEndToken(): PdfEndDictionaryToken {
        this.expect(ByteMap.RIGHT_ANGLE_BRACKET)
        this.expect(ByteMap.RIGHT_ANGLE_BRACKET)
        return new PdfEndDictionaryToken()
    }

    private nextHexadecimalToken(): PdfHexadecimalToken {
        this.expect(ByteMap.LEFT_ANGLE_BRACKET)

        const hexBytes: number[] = []
        let byte = this.peek()

        while (
            byte !== null &&
            byte !== ByteMap.RIGHT_ANGLE_BRACKET &&
            !PdfByteStreamTokeniser.isWhitespace(byte)
        ) {
            hexBytes.push(this.next())
            byte = this.peek()
        }

        this.expect(ByteMap.RIGHT_ANGLE_BRACKET)

        return new PdfHexadecimalToken(new Uint8Array(hexBytes))
    }

    private nextNumberToken(): PdfNumberToken {
        const numberBytes: number[] = []
        let byte = this.peek()

        while (PdfByteStreamTokeniser.isDigit(byte)) {
            numberBytes.push(this.next())
            byte = this.peek()
        }

        return new PdfNumberToken({
            value: new Uint8Array(numberBytes),
        })
    }

    private nextObjectReferenceToken(): PdfObjectReferenceToken {
        const objectNumberToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        const generationNumberToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        this.expect(ByteMap.R)

        return new PdfObjectReferenceToken(
            objectNumberToken.value,
            generationNumberToken.value,
        )
    }

    private nextStartObjectToken(): PdfStartObjectToken {
        const offset = this.inputOffset
        const objectNumberToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        const generationNumberToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        this.expect(ByteMap.o)
        this.expect(ByteMap.b)
        this.expect(ByteMap.j)

        return new PdfStartObjectToken(
            objectNumberToken.value,
            generationNumberToken.value,
            offset,
        )
    }

    private nextStartArrayToken(): PdfStartArrayToken {
        this.expect(ByteMap.LEFT_SQUARE_BRACKET)
        return new PdfStartArrayToken()
    }

    private nextEndArrayToken(): PdfEndArrayToken {
        this.expect(ByteMap.RIGHT_SQUARE_BRACKET)
        return new PdfEndArrayToken()
    }

    private nextStringToken(): PdfStringToken {
        this.expect(ByteMap.LEFT_PARENTHESIS)

        const stringBytes: number[] = []
        let nesting = 1
        let inEscape = false

        while (inEscape || nesting > 0) {
            const byte = this.next()

            if (byte === null) {
                throw new Error('Unexpected end of input in string token')
            }

            if (byte === ByteMap.LEFT_PARENTHESIS) {
                nesting++
            } else if (byte === ByteMap.RIGHT_PARENTHESIS) {
                nesting--
                if (nesting === 0) {
                    break
                }
            } else if (byte === ByteMap.BACKSLASH || inEscape) {
                inEscape = true
                const next = this.next()

                if (next === null) {
                    throw new Error('Unexpected end of input in string token')
                }

                switch (next) {
                    case ByteMap.n:
                        stringBytes.push(0x0a)
                        break // \n
                    case ByteMap.r:
                        stringBytes.push(0x0d)
                        break // \r
                    case ByteMap.t:
                        stringBytes.push(0x09)
                        break // \t
                    case ByteMap.b:
                        stringBytes.push(0x08)
                        break // \b
                    case ByteMap.f:
                        stringBytes.push(0x0c)
                        break // \f
                    case ByteMap.LEFT_PARENTHESIS:
                        stringBytes.push(ByteMap.LEFT_PARENTHESIS)
                        break // \(
                    case ByteMap.RIGHT_PARENTHESIS:
                        stringBytes.push(ByteMap.RIGHT_PARENTHESIS)
                        break // \)
                    case ByteMap.BACKSLASH:
                        stringBytes.push(ByteMap.BACKSLASH)
                        break // \\
                    case 0x0a:
                    case 0x0d:
                        // Ignore line breaks in the string after a backslash
                        break
                    default:
                        if (PdfByteStreamTokeniser.isOctet(next)) {
                            let octal = String.fromCharCode(next)
                            // Octal: up to 3 digits
                            const next2 = this.peek()
                            if (next2 === null) {
                                throw new Error(
                                    'Unexpected end of input in string token',
                                )
                            }

                            if (PdfByteStreamTokeniser.isOctet(next2)) {
                                octal += String.fromCharCode(this.next()!)
                            }

                            const next3 = this.peek()
                            if (next3 === null) {
                                throw new Error(
                                    'Unexpected end of input in string token',
                                )
                            }

                            if (PdfByteStreamTokeniser.isOctet(next3)) {
                                octal += String.fromCharCode(this.next()!)
                            }

                            stringBytes.push(parseInt(octal, 8))
                        } else {
                            // If it's not a valid escape sequence, just add the next byte
                            stringBytes.push(next)
                        }
                        break
                }

                inEscape = false
                continue
            }

            stringBytes.push(byte)
        }

        return new PdfStringToken(new Uint8Array(stringBytes))
    }

    private nextEndObjectToken(): PdfEndObjectToken {
        this.expect(ByteMap.e)
        this.expect(ByteMap.n)
        this.expect(ByteMap.d)
        this.expect(ByteMap.o)
        this.expect(ByteMap.b)
        this.expect(ByteMap.j)

        return new PdfEndObjectToken()
    }

    private nextTrueToken(): PdfBooleanToken {
        this.expect(ByteMap.t)
        this.expect(ByteMap.r)
        this.expect(ByteMap.u)
        this.expect(ByteMap.e)

        return new PdfBooleanToken(true)
    }

    private nextFalseToken(): PdfBooleanToken {
        this.expect(ByteMap.f)
        this.expect(ByteMap.a)
        this.expect(ByteMap.l)
        this.expect(ByteMap.s)
        this.expect(ByteMap.e)

        return new PdfBooleanToken(false)
    }

    private nextNullToken(): PdfNullToken {
        this.expect(ByteMap.n)
        this.expect(ByteMap.u)
        this.expect(ByteMap.l)
        this.expect(ByteMap.l)

        return new PdfNullToken()
    }

    private nextStartStreamToken(): PdfStartStreamToken {
        this.expect(ByteMap.s)
        this.expect(ByteMap.t)
        this.expect(ByteMap.r)
        this.expect(ByteMap.e)
        this.expect(ByteMap.a)
        this.expect(ByteMap.m)

        const whitespaceBytes: number[] = []
        while (PdfByteStreamTokeniser.isWhitespace(this.peek())) {
            whitespaceBytes.push(this.next())
        }

        this.inStream = true

        return new PdfStartStreamToken(
            concatUint8Arrays(
                stringToBytes('stream'),
                new Uint8Array(whitespaceBytes),
            ),
        )
    }

    private nextStreamChunkToken(): PdfStreamChunkToken {
        if (!this.inStream) {
            throw new Error('Not currently in a stream')
        }

        const chunkBytes: number[] = []

        const isEnd = () => {
            return (
                this.peek() === ByteMap.e &&
                this.peek(1) === ByteMap.n &&
                this.peek(2) === ByteMap.d &&
                this.peek(3) === ByteMap.s &&
                this.peek(4) === ByteMap.t &&
                this.peek(5) === ByteMap.r &&
                this.peek(6) === ByteMap.e &&
                this.peek(7) === ByteMap.a &&
                this.peek(8) === ByteMap.m
            )
        }

        if (isEnd()) {
            return this.nextEndStreamToken()
        }

        while (!isEnd() && chunkBytes.length < this.streamChunkSizeBytes) {
            const nexted = this.next()
            chunkBytes.push(nexted)
        }

        return new PdfStreamChunkToken(new Uint8Array(chunkBytes))
    }

    private nextEndStreamToken(): PdfEndStreamToken {
        this.expect(ByteMap.e)
        this.expect(ByteMap.n)
        this.expect(ByteMap.d)
        this.expect(ByteMap.s)
        this.expect(ByteMap.t)
        this.expect(ByteMap.r)
        this.expect(ByteMap.e)
        this.expect(ByteMap.a)
        this.expect(ByteMap.m)

        this.inStream = false

        return new PdfEndStreamToken()
    }

    private nextStartXRefToken(): PdfStartXRefToken {
        this.expect(ByteMap.s)
        this.expect(ByteMap.t)
        this.expect(ByteMap.a)
        this.expect(ByteMap.r)
        this.expect(ByteMap.t)
        this.expect(ByteMap.x)
        this.expect(ByteMap.r)
        this.expect(ByteMap.e)
        this.expect(ByteMap.f)

        return new PdfStartXRefToken()
    }

    private nextTrailerToken(): PdfTrailerToken {
        const offset = this.inputOffset

        this.expect(ByteMap.t)
        this.expect(ByteMap.r)
        this.expect(ByteMap.a)
        this.expect(ByteMap.i)
        this.expect(ByteMap.l)
        this.expect(ByteMap.e)
        this.expect(ByteMap.r)

        this.inXrefTable = false

        return new PdfTrailerToken(offset)
    }

    private nextXRefTableStartToken(): PdfXRefTableStartToken {
        const offset = this.inputOffset

        this.expect(ByteMap.x)
        this.expect(ByteMap.r)
        this.expect(ByteMap.e)
        this.expect(ByteMap.f)

        this.inXrefTable = true
        this.xrefEntryCount = 0
        this.lastSectionStartObjectNumber = 0

        return new PdfXRefTableStartToken(offset)
    }

    private nextXRefTableSectionStartToken(): PdfXRefTableSectionStartToken {
        const firstObjectNumberToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        const entryCountToken = this.nextNumberToken()

        this.lastSectionStartObjectNumber = firstObjectNumberToken.value
        this.xrefEntryCount = 0

        return new PdfXRefTableSectionStartToken(
            firstObjectNumberToken,
            entryCountToken,
        )
    }

    private nextXRefTableEntryToken(): PdfXRefTableEntryToken {
        const byteOffsetToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        const generationNumberToken = this.nextNumberToken()
        this.expect(ByteMap.SPACE)
        const inUseByte = this.next()

        if (inUseByte === null) {
            throw new Error('Unexpected end of input in xref entry token')
        }

        assert(inUseByte === ByteMap.n || inUseByte === ByteMap.f)

        const inUse = inUseByte === ByteMap.n

        return new PdfXRefTableEntryToken(
            byteOffsetToken,
            generationNumberToken,
            this.lastSectionStartObjectNumber + this.xrefEntryCount++, // Increment and use the current count
            inUse,
        )
    }

    private nextToken(root: boolean = false): PdfToken {
        const byte = this.peek()

        if (this.inStream) {
            return this.nextStreamChunkToken()
        } else if (byte === ByteMap.PERCENT) {
            return this.nextCommentToken()
        } else if (PdfByteStreamTokeniser.isWhitespace(byte)) {
            return this.nextWhitespaceToken()
        } else if (byte === ByteMap.LEFT_ANGLE_BRACKET) {
            return this.oneOf(
                this.nextStartDictionaryToken,
                this.nextHexadecimalToken,
            )
        } else if (byte === ByteMap.SLASH) {
            return this.nextNameToken()
        } else if (byte === ByteMap.RIGHT_ANGLE_BRACKET) {
            return this.nextDictionaryEndToken()
        } else if (PdfByteStreamTokeniser.isDigit(byte)) {
            if (this.inXrefTable) {
                return this.oneOf(
                    this.nextXRefTableEntryToken,
                    this.nextXRefTableSectionStartToken,
                )
            }

            return this.oneOf(
                this.nextStartObjectToken,
                this.nextObjectReferenceToken,
                this.nextNumberToken,
            )
        } else if (byte === ByteMap.LEFT_SQUARE_BRACKET) {
            return this.nextStartArrayToken()
        } else if (byte === ByteMap.RIGHT_SQUARE_BRACKET) {
            return this.nextEndArrayToken()
        } else if (byte === ByteMap.LEFT_PARENTHESIS) {
            return this.nextStringToken()
        } else if (byte === ByteMap.e) {
            return this.oneOf(this.nextEndObjectToken, this.nextEndStreamToken)
        } else if (byte === ByteMap.t) {
            return this.oneOf(this.nextTrueToken, this.nextTrailerToken)
        } else if (byte === ByteMap.f) {
            return this.nextFalseToken()
        } else if (byte === ByteMap.n) {
            return this.nextNullToken()
        } else if (byte === ByteMap.s) {
            return this.oneOf(
                this.nextStartStreamToken,
                this.nextStartXRefToken,
            )
        } else if (byte === ByteMap.x) {
            return this.nextXRefTableStartToken()
        } else {
            throw new Error(
                `Unrecognised token starting with byte: ${byte} (root: ${root}) (char: ${String.fromCharCode(byte ?? 0)})`,
            )
        }
    }

    protected parse() {
        return this.nextToken(true)
    }

    private static isWhitespace(byte: number | null): boolean {
        return PdfWhitespaceToken.isWhitespaceByte(byte)
    }

    private static isNewLine(byte: number | null): boolean {
        return byte === ByteMap.NEW_LINE || byte === 0x0d || byte === 0x0c // \r or \f
    }

    private static isDigit(byte: number | null): boolean {
        return (
            byte !== null &&
            ((byte >= 0x30 && byte <= 0x39) ||
                byte === ByteMap.MINUS ||
                byte === ByteMap.DOT)
        ) // 0-9 or 0x2d (minus) or 0x2E (.)
    }

    private static isNameEnd(byte: number | null): boolean {
        if (byte === null) {
            return false
        }
        return (
            byte === ByteMap.SLASH ||
            byte === ByteMap.LEFT_ANGLE_BRACKET ||
            byte === ByteMap.RIGHT_ANGLE_BRACKET ||
            byte === ByteMap.RIGHT_PARENTHESIS ||
            byte === ByteMap.LEFT_PARENTHESIS ||
            byte === ByteMap.LEFT_SQUARE_BRACKET ||
            byte === ByteMap.RIGHT_SQUARE_BRACKET
        )
    }

    private static isOctet(byte: number | null): boolean {
        if (byte === null) {
            return false
        }
        return (
            byte >= 0x30 && byte <= 0x37 // 0-7
        )
    }
}

/**
 * Converts a PDF object to its token representation.
 *
 * @param object - The PDF object to tokenize
 * @returns A generator yielding the object's tokens
 */
export function* objectToTokens(object: PdfObject): Generator<PdfToken> {
    return object.toTokens()
}

/**
 * Creates a function that converts a stream of PDF objects to tokens.
 *
 * @returns A generator function that yields tokens from PDF objects
 */
export function pdfObjectStreamTokeniser() {
    return function* (objects: Iterable<PdfObject>): Generator<PdfToken> {
        for (const object of objects) {
            yield* objectToTokens(object)
        }
    }
}

/**
 * Tokenizes PDF objects into a stream of PDF tokens.
 */
export class PdfObjectTokeniser extends Parser<PdfObject, PdfToken> {
    private buffer: PdfObject[] = []

    /**
     * Feeds PDF objects into the tokenizer buffer.
     *
     * @param input - PDF objects to tokenize
     */
    feed(...input: PdfObject[]): void {
        this.buffer.push(...input)
    }

    /**
     * Generates tokens from the buffered PDF objects.
     *
     * @returns A generator yielding PDF tokens
     */
    *nextItems(): Generator<PdfToken> {
        while (this.buffer.length) {
            const obj = this.buffer.shift()!
            yield* obj.toTokens()
        }
    }
}
