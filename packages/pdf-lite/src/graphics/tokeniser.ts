import { IncrementalParser } from '../core/parser/incremental-parser'
import { NoMoreTokensError } from '../errors'
import { ContentOp } from './ops/base'

const SPACE = 0x20
const TAB = 0x09
const LF = 0x0a
const CR = 0x0d
const FF = 0x0c
const NUL = 0x00

const LEFT_PAREN = 0x28 // (
const RIGHT_PAREN = 0x29 // )
const LEFT_ANGLE = 0x3c // <
const RIGHT_ANGLE = 0x3e // >
const LEFT_BRACKET = 0x5b // [
const RIGHT_BRACKET = 0x5d // ]
const SLASH = 0x2f // /
const BACKSLASH = 0x5c // \
const MINUS = 0x2d // -
const DOT = 0x2e // .
const ASTERISK = 0x2a // *
const SINGLE_QUOTE = 0x27 // '
const DOUBLE_QUOTE = 0x22 // "

/**
 * Incremental tokeniser for PDF content streams.
 *
 * Emits one `ContentOp` per operator in the stream. Each emitted op owns
 * the exact bytes of its operator *plus any leading whitespace bytes*
 * between it and the previous op. This means concatenating the bytes of
 * every emitted op reconstructs the original input stream byte-for-byte
 * (the only thing not captured is any trailing whitespace after the final
 * operator, which belongs to no op).
 */
export class PdfContentStreamTokeniser extends IncrementalParser<
    number,
    ContentOp
> {
    feedBytes(bytes: Uint8Array) {
        for (const byte of bytes) {
            this.feed(byte)
        }
    }

    /**
     * Hook for subclasses to specialise raw bytes into typed ContentOp
     * subclasses. Default implementation wraps the bytes verbatim.
     */
    protected parseContentOp(bytes: Uint8Array): ContentOp {
        return new ContentOp(bytes)
    }

    private static isWhitespace(byte: number | null): boolean {
        return (
            byte === SPACE ||
            byte === TAB ||
            byte === LF ||
            byte === CR ||
            byte === FF ||
            byte === NUL
        )
    }

    private static isDigit(byte: number | null): boolean {
        return byte !== null && byte >= 0x30 && byte <= 0x39
    }

    private static isNumericStart(byte: number | null): boolean {
        return (
            PdfContentStreamTokeniser.isDigit(byte) ||
            byte === MINUS ||
            byte === DOT
        )
    }

    private static isAlpha(byte: number | null): boolean {
        return (
            byte !== null &&
            ((byte >= 0x41 && byte <= 0x5a) || // A-Z
                (byte >= 0x61 && byte <= 0x7a)) // a-z
        )
    }

    private static isDelimiter(byte: number | null): boolean {
        return (
            byte === LEFT_PAREN ||
            byte === RIGHT_PAREN ||
            byte === LEFT_ANGLE ||
            byte === RIGHT_ANGLE ||
            byte === LEFT_BRACKET ||
            byte === RIGHT_BRACKET ||
            byte === SLASH
        )
    }

    private readString(): void {
        this.next() // consume '('
        let nesting = 1

        while (nesting > 0) {
            const byte = this.next()

            if (byte === BACKSLASH) {
                // escaped char — consume next byte too
                this.next()
            } else if (byte === LEFT_PAREN) {
                nesting++
            } else if (byte === RIGHT_PAREN) {
                nesting--
            }
        }
    }

    private readHexString(): void {
        this.next() // consume '<'
        while (this.peek() !== RIGHT_ANGLE) {
            this.next()
        }
        this.next() // consume '>'
    }

    private readArray(): void {
        this.next() // consume '['
        let depth = 1

        while (depth > 0) {
            const byte = this.peek()

            if (byte === LEFT_BRACKET) {
                depth++
                this.next()
            } else if (byte === RIGHT_BRACKET) {
                depth--
                this.next()
            } else if (byte === LEFT_PAREN) {
                // nested string — consume whole thing
                this.readString()
            } else {
                this.next()
            }
        }
    }

    private readDictionary(): void {
        this.next() // consume first '<'
        this.next() // consume second '<'
        while (!(this.peek() === RIGHT_ANGLE && this.peek(1) === RIGHT_ANGLE)) {
            this.next()
        }
        this.next() // consume first '>'
        this.next() // consume second '>'
    }

    private readName(): void {
        this.next() // consume '/'
        while (
            !PdfContentStreamTokeniser.isWhitespace(this.peek()) &&
            !PdfContentStreamTokeniser.isDelimiter(this.peek()) &&
            this.peek() !== null
        ) {
            this.next()
        }
    }

    private readNumber(): void {
        while (
            PdfContentStreamTokeniser.isDigit(this.peek()) ||
            this.peek() === MINUS ||
            this.peek() === DOT
        ) {
            this.next()
        }
    }

    private readKeyword(): void {
        while (PdfContentStreamTokeniser.isAlpha(this.peek())) {
            this.next()
        }
    }

    /**
     * After a terminating operator has been consumed, eat any trailing
     * whitespace so it becomes part of this op's byte span rather than
     * leading whitespace of the next op.
     */
    private consumeTrailingWhitespace(): void {
        while (PdfContentStreamTokeniser.isWhitespace(this.peek())) {
            this.next()
        }
    }

    /**
     * Slice the byte span [startIndex, bufferIndex) out of the buffer into
     * a standalone Uint8Array and hand it to `parseContentOp`.
     */
    private emitOp(startIndex: number): ContentOp {
        const len = this.bufferIndex - startIndex
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
            bytes[i] = this.buffer[startIndex + i] as number
        }
        return this.parseContentOp(bytes)
    }

    protected parse(): ContentOp {
        // Record where this op starts in the buffer. Any NoMoreTokensError
        // thrown mid-parse causes the base class to restore bufferIndex, so
        // on retry we'll re-scan from the same startIndex.
        const startIndex = this.bufferIndex

        while (true) {
            const byte = this.peek()

            if (byte === null) {
                // EOF. If we consumed any bytes (even just whitespace),
                // emit them as a final op so that trailing whitespace
                // after the last operator is preserved byte-for-byte.
                // This final op has an empty operator (`parts().operator
                // === ''`). If nothing was consumed at all, signal
                // no-more-tokens so the generator loop exits.
                if (this.bufferIndex > startIndex) {
                    return this.emitOp(startIndex)
                }
                throw new NoMoreTokensError('End of content stream')
            }

            if (PdfContentStreamTokeniser.isWhitespace(byte)) {
                this.next()
                continue
            }

            if (byte === LEFT_PAREN) {
                this.readString()
            } else if (byte === LEFT_ANGLE) {
                if (this.peek(1) === LEFT_ANGLE) {
                    // dictionary << >> — treat as an opaque operand
                    this.readDictionary()
                } else {
                    this.readHexString()
                }
            } else if (byte === LEFT_BRACKET) {
                this.readArray()
            } else if (byte === SLASH) {
                this.readName()
            } else if (PdfContentStreamTokeniser.isNumericStart(byte)) {
                this.readNumber()
            } else if (PdfContentStreamTokeniser.isAlpha(byte)) {
                // Operator keyword — terminates the op.
                this.readKeyword()
                // Handle '*' suffix operators (f*, b*, B*, W*)
                if (this.peek() === ASTERISK) {
                    this.next()
                }
                this.consumeTrailingWhitespace()
                return this.emitOp(startIndex)
            } else if (byte === SINGLE_QUOTE || byte === DOUBLE_QUOTE) {
                // ' and " are single-char operators that terminate the op.
                this.next()
                this.consumeTrailingWhitespace()
                return this.emitOp(startIndex)
            } else if (byte === ASTERISK) {
                // Standalone '*' — shouldn't occur in valid PDF; advance
                // and keep scanning so we don't get stuck.
                this.next()
            } else {
                // Unknown byte — skip.
                this.next()
            }
        }
    }
}
