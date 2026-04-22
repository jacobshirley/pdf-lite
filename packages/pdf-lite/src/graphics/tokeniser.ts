import { PdfHexadecimal, PdfName, PdfNumber, PdfString } from '../core'
import { IncrementalParser } from '../core/parser/incremental-parser'
import { EofReachedError, NoMoreTokensError } from '../errors'
import { ByteArray } from '../types'
import { stringToBytes } from '../utils/stringToBytes'
import { unescapeString } from '../utils/unescapeString'
import { ContentOp, ContentOpOperand } from './ops/base'
import {
    SetFillColorCMYKOp,
    SetFillColorExtOp,
    SetFillColorGrayOp,
    SetFillColorOp,
    SetFillColorRGBOp,
    SetFillColorSpaceOp,
    SetStrokeColorCMYKOp,
    SetStrokeColorExtOp,
    SetStrokeColorGrayOp,
    SetStrokeColorOp,
    SetStrokeColorRGBOp,
    SetStrokeColorSpaceOp,
} from './ops/color'
import {
    CloseAndStrokeOp,
    CloseFillAndStrokeEvenOddOp,
    CloseFillAndStrokeOp,
    ClipEvenOddOp,
    ClipOp,
    EndPathOp,
    FillAlternateOp,
    FillAndStrokeEvenOddOp,
    FillAndStrokeOp,
    FillEvenOddOp,
    FillOp,
    StrokeOp,
} from './ops/paint'
import {
    ClosePathOp,
    CurveToOp,
    CurveToV,
    CurveToY,
    LineToOp,
    MoveToOp,
    RectangleOp,
} from './ops/path'
import {
    InvokeXObjectOp,
    RestoreStateOp,
    SaveStateOp,
    SetDashPatternOp,
    SetFlatnessOp,
    SetGraphicsStateOp,
    SetLineCapOp,
    SetLineJoinOp,
    SetLineWidthOp,
    SetMatrixOp,
    SetMiterLimitOp,
    SetRenderingIntentOp,
} from './ops/state'
import {
    BeginTextOp,
    EndTextOp,
    MoveTextLeadingOp,
    MoveTextOp,
    NextLineOp,
    SetCharSpacingOp,
    SetFontOp,
    SetHorizontalScalingOp,
    SetTextLeadingOp,
    SetTextMatrixOp,
    SetTextRenderingModeOp,
    SetTextRiseOp,
    SetWordSpacingOp,
    ShowTextArrayOp,
    ShowTextNextLineOp,
    ShowTextNextLineSpacingOp,
    ShowTextOp,
} from './ops/text'
import {
    BeginMarkedContentOp,
    BeginMarkedContentPropsOp,
    EndMarkedContentOp,
    MarkedPointOp,
    MarkedPointPropsOp,
} from './ops/marked-content'

/**
 * Map of operator keyword → subclass constructor. Each constructor accepts
 * a raw `ByteArray` so the original byte span (including surrounding
 * whitespace) is preserved verbatim.
 */
type ContentOpCtor = new (bytes: ByteArray) => ContentOp
const OPERATOR_CLASSES: Record<string, ContentOpCtor> = {
    // --- text object ---
    BT: BeginTextOp,
    ET: EndTextOp,
    // --- text state ---
    Tc: SetCharSpacingOp,
    Tw: SetWordSpacingOp,
    Tz: SetHorizontalScalingOp,
    TL: SetTextLeadingOp,
    Tf: SetFontOp,
    Tr: SetTextRenderingModeOp,
    Ts: SetTextRiseOp,
    // --- text positioning ---
    Td: MoveTextOp,
    TD: MoveTextLeadingOp,
    Tm: SetTextMatrixOp,
    'T*': NextLineOp,
    // --- text showing ---
    Tj: ShowTextOp,
    TJ: ShowTextArrayOp,
    "'": ShowTextNextLineOp,
    '"': ShowTextNextLineSpacingOp,
    // --- path construction ---
    m: MoveToOp,
    l: LineToOp,
    c: CurveToOp,
    v: CurveToV,
    y: CurveToY,
    re: RectangleOp,
    h: ClosePathOp,
    // --- path painting ---
    S: StrokeOp,
    s: CloseAndStrokeOp,
    f: FillOp,
    F: FillAlternateOp,
    'f*': FillEvenOddOp,
    B: FillAndStrokeOp,
    b: CloseFillAndStrokeOp,
    'B*': FillAndStrokeEvenOddOp,
    'b*': CloseFillAndStrokeEvenOddOp,
    n: EndPathOp,
    // --- clipping paths ---
    W: ClipOp,
    'W*': ClipEvenOddOp,
    // --- colour ---
    rg: SetFillColorRGBOp,
    RG: SetStrokeColorRGBOp,
    g: SetFillColorGrayOp,
    G: SetStrokeColorGrayOp,
    k: SetFillColorCMYKOp,
    K: SetStrokeColorCMYKOp,
    cs: SetFillColorSpaceOp,
    CS: SetStrokeColorSpaceOp,
    sc: SetFillColorOp,
    SC: SetStrokeColorOp,
    scn: SetFillColorExtOp,
    SCN: SetStrokeColorExtOp,
    // --- graphics state ---
    q: SaveStateOp,
    Q: RestoreStateOp,
    cm: SetMatrixOp,
    w: SetLineWidthOp,
    J: SetLineCapOp,
    j: SetLineJoinOp,
    M: SetMiterLimitOp,
    d: SetDashPatternOp,
    ri: SetRenderingIntentOp,
    i: SetFlatnessOp,
    gs: SetGraphicsStateOp,
    // --- xobject ---
    Do: InvokeXObjectOp,
    // --- marked content ---
    BMC: BeginMarkedContentOp,
    BDC: BeginMarkedContentPropsOp,
    EMC: EndMarkedContentOp,
    MP: MarkedPointOp,
    DP: MarkedPointPropsOp,
}

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

    private sliceBytes(start: number, end: number): ByteArray {
        const out = new Uint8Array(end - start)
        for (let i = 0; i < out.length; i++) {
            out[i] = this.buffer[start + i] as number
        }
        return out
    }

    private sliceAscii(start: number, end: number): string {
        let out = ''
        for (let i = start; i < end; i++) {
            out += String.fromCharCode(this.buffer[i] as number)
        }
        return out
    }

    private readString(target: ContentOpOperand[]): void {
        this.next() // consume '('
        const bodyStart = this.bufferIndex
        let nesting = 1

        while (nesting > 0) {
            let byte: number
            try {
                byte = this.next()
            } catch (e) {
                if (e instanceof EofReachedError) {
                    // EOF while string unclosed - treat as end of string
                    break
                }
                throw e
            }

            if (byte === BACKSLASH) {
                // Handle escape sequences according to PDF spec
                // If backslash is followed by newline (LF, CR, or CR+LF),
                // it's a line continuation - consume the newline
                const nextByte = this.peek()
                if (nextByte === null) {
                    // EOF while parsing escape sequence - break
                    break
                }
                if (nextByte === LF) {
                    // \LF - consume the LF
                    this.next()
                } else if (nextByte === CR) {
                    // \CR or \CR+LF - consume the CR
                    this.next()
                    // Check if followed by LF (common Windows line ending)
                    const afterCR = this.peek()
                    if (afterCR === LF) {
                        this.next()
                    }
                } else {
                    // Other escape sequences (\n, \r, \t, \(, \), \\, or octal)
                    // For octal sequences (\ddd), we consume 1-3 octal digits
                    // For now, just consume one byte to handle \(, \), \\, etc.
                    this.next()
                }
            } else if (byte === LEFT_PAREN) {
                nesting++
            } else if (byte === RIGHT_PAREN) {
                nesting--
            }
        }

        // `bufferIndex` is now just past the closing `)`. Slice the inner
        // bytes (including the trailing `)`) and let `unescapeString`
        // process PDF escape sequences byte-safely.
        const bodyEnd = this.bufferIndex
        const inner = this.sliceBytes(bodyStart, bodyEnd)
        target.push(new PdfString(unescapeString(inner)))
    }

    private readHexString(target: ContentOpOperand[]): void {
        this.next() // consume '<'
        const bodyStart = this.bufferIndex
        while (this.peek() !== RIGHT_ANGLE) {
            this.next()
        }
        const bodyEnd = this.bufferIndex
        this.next() // consume '>'
        target.push(new PdfHexadecimal(this.sliceAscii(bodyStart, bodyEnd)))
    }

    private readArray(target: ContentOpOperand[]): void {
        this.next() // consume '['
        const inner: ContentOpOperand[] = []
        let depth = 1

        while (depth > 0) {
            const byte = this.peek()
            if (byte === null) {
                // EOF while array unclosed - break
                break
            }

            if (PdfContentStreamTokeniser.isWhitespace(byte)) {
                this.next()
                continue
            }

            if (byte === LEFT_BRACKET) {
                depth++
                this.next()
            } else if (byte === RIGHT_BRACKET) {
                depth--
                this.next()
            } else if (byte === LEFT_PAREN) {
                this.readString(inner)
            } else if (byte === LEFT_ANGLE) {
                this.readHexString(inner)
            } else if (PdfContentStreamTokeniser.isNumericStart(byte)) {
                this.readNumber(inner)
            } else {
                this.next()
            }
        }

        target.push(inner)
    }

    private readDictionary(): void {
        this.next() // consume first '<'
        this.next() // consume second '<'
        while (true) {
            const byte1 = this.peek()
            const byte2 = this.peek(1)
            if (byte1 === null || byte2 === null) {
                // EOF - break
                break
            }
            if (byte1 === RIGHT_ANGLE && byte2 === RIGHT_ANGLE) {
                break
            }
            this.next()
        }
        this.next() // consume first '>'
        this.next() // consume second '>'
    }

    private readName(target: ContentOpOperand[]): void {
        this.next() // consume '/'
        const start = this.bufferIndex
        while (
            !PdfContentStreamTokeniser.isWhitespace(this.peek()) &&
            !PdfContentStreamTokeniser.isDelimiter(this.peek()) &&
            this.peek() !== null
        ) {
            this.next()
        }
        target.push(new PdfName(this.sliceAscii(start, this.bufferIndex)))
    }

    private readNumber(target: ContentOpOperand[]): void {
        const start = this.bufferIndex
        while (
            PdfContentStreamTokeniser.isDigit(this.peek()) ||
            this.peek() === MINUS ||
            this.peek() === DOT
        ) {
            this.next()
        }
        const numStr = this.sliceAscii(start, this.bufferIndex)
        const n = parseFloat(numStr)
        if (!Number.isNaN(n)) target.push(new PdfNumber(n))
    }

    /**
     * Consume an operator keyword (alpha chars, optionally followed by a
     * `*` suffix like `f*`, `B*`, `W*`) and return it as a string.
     */
    private readKeyword(): string {
        let keyword = ''
        while (PdfContentStreamTokeniser.isAlpha(this.peek())) {
            keyword += String.fromCharCode(this.next() as number)
        }
        if (this.peek() === ASTERISK) {
            this.next()
            keyword += '*'
        }
        return keyword
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
     * a standalone ByteArray and instantiate the correct typed ContentOp
     * subclass for `operator`. Unknown operators (or `''` for the
     * whitespace-only final op at EOF) fall back to the base `ContentOp`.
     */
    private emitOp(
        startIndex: number,
        operator: string,
        operands: ContentOpOperand[],
    ): ContentOp {
        const len = this.bufferIndex - startIndex
        const bytes = new Uint8Array(len) as ByteArray
        for (let i = 0; i < len; i++) {
            bytes[i] = this.buffer[startIndex + i] as number
        }
        const SubClass = OPERATOR_CLASSES[operator]
        const op = SubClass ? new SubClass(bytes) : new ContentOp(bytes)
        op.operands = operands
        return op
    }

    protected parse(): ContentOp {
        // Record where this op starts in the buffer. Any NoMoreTokensError
        // thrown mid-parse causes the base class to restore bufferIndex, so
        // on retry we'll re-scan from the same startIndex.
        const startIndex = this.bufferIndex
        const operands: ContentOpOperand[] = []

        while (true) {
            const byte = this.peek()

            if (byte === null) {
                // EOF. If we consumed any bytes (even just whitespace),
                // emit them as a final op so that trailing whitespace
                // after the last operator is preserved byte-for-byte.
                // This final op has an empty operator. If nothing was
                // consumed at all, signal no-more-tokens so the
                // generator loop exits.
                if (this.bufferIndex > startIndex) {
                    return this.emitOp(startIndex, '', operands)
                }
                throw new NoMoreTokensError('End of content stream')
            }

            if (PdfContentStreamTokeniser.isWhitespace(byte)) {
                this.next()
                continue
            }

            if (byte === LEFT_PAREN) {
                this.readString(operands)
            } else if (byte === LEFT_ANGLE) {
                if (this.peek(1) === LEFT_ANGLE) {
                    // dictionary << >> — treat as an opaque operand
                    this.readDictionary()
                } else {
                    this.readHexString(operands)
                }
            } else if (byte === LEFT_BRACKET) {
                this.readArray(operands)
            } else if (byte === SLASH) {
                this.readName(operands)
            } else if (PdfContentStreamTokeniser.isNumericStart(byte)) {
                this.readNumber(operands)
            } else if (PdfContentStreamTokeniser.isAlpha(byte)) {
                // Operator keyword — terminates the op.
                const keyword = this.readKeyword()
                this.consumeTrailingWhitespace()
                return this.emitOp(startIndex, keyword, operands)
            } else if (byte === SINGLE_QUOTE || byte === DOUBLE_QUOTE) {
                // ' and " are single-char operators that terminate the op.
                const keyword = String.fromCharCode(this.next() as number)
                this.consumeTrailingWhitespace()
                return this.emitOp(startIndex, keyword, operands)
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

    /**
     * Tokenise a full content stream in one shot and return the list of
     * typed ContentOps. Accepts either a raw `ByteArray` (preferred —
     * byte-exact) or a string (encoded latin-1 so binary bytes inside
     * literal/hex strings round-trip cleanly).
     */
    static tokenise(input: string | ByteArray): ContentOp[] {
        const bytes = typeof input === 'string' ? stringToBytes(input) : input
        const tokeniser = new PdfContentStreamTokeniser()
        tokeniser.feedBytes(bytes)
        tokeniser.eof = true
        const ops: ContentOp[] = []
        for (const op of tokeniser.nextItems()) {
            ops.push(op)
        }
        return ops
    }
}
