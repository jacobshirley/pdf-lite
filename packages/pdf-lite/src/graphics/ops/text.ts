import { PdfFont } from '../..'
import { PdfHexadecimal, PdfString } from '../../core'
import { ByteArray } from '../../types'
import { Matrix } from '../geom/matrix'
import { ContentOp } from './base'

export class TextOp extends ContentOp {}

// -- Byte-level PDF string extraction ----------------------------------------
// These functions operate directly on the raw ContentOp bytes so that binary
// string content (e.g. CID-encoded literal strings) is never corrupted by
// string-level regex unescaping.

const LPAREN = 0x28 // (
const RPAREN = 0x29 // )
const LANGLE = 0x3c // <
const RANGLE = 0x3e // >
const BACKSLASH = 0x5c // \
const LBRACKET = 0x5b // [
const RBRACKET = 0x5d // ]

/**
 * Unescape a PDF literal-string at the byte level starting at `offset`
 * (the byte *after* the opening parenthesis).  Handles all PDF escape
 * sequences: \\, \(, \), \n, \r, \t, \b, \f, \ddd (octal), and line
 * continuations (\<newline>).  Also normalises bare end-of-line markers
 * inside the string as required by PDF spec 7.3.4.2.
 *
 * Returns the unescaped content bytes (excluding the outer parentheses).
 */
function unescapeLiteralBytes(bytes: ByteArray, offset: number): ByteArray {
    const out: number[] = []
    let i = offset
    let depth = 1

    while (i < bytes.length && depth > 0) {
        const b = bytes[i]

        if (b === BACKSLASH) {
            i++
            if (i >= bytes.length) break
            const next = bytes[i]
            switch (next) {
                case 0x6e:
                    out.push(0x0a)
                    i++
                    break // \n → LF
                case 0x72:
                    out.push(0x0d)
                    i++
                    break // \r → CR
                case 0x74:
                    out.push(0x09)
                    i++
                    break // \t → TAB
                case 0x62:
                    out.push(0x08)
                    i++
                    break // \b → BS
                case 0x66:
                    out.push(0x0c)
                    i++
                    break // \f → FF
                case LPAREN:
                    out.push(LPAREN)
                    i++
                    break // \( → (
                case RPAREN:
                    out.push(RPAREN)
                    i++
                    break // \) → )
                case BACKSLASH:
                    out.push(BACKSLASH)
                    i++
                    break // \\ → \
                case 0x0a: // \LF → line continuation
                    i++
                    break
                case 0x0d: // \CR or \CR+LF
                    i++
                    if (i < bytes.length && bytes[i] === 0x0a) i++
                    break
                default:
                    if (next >= 0x30 && next <= 0x37) {
                        // Octal \ddd
                        let oct = next - 0x30
                        i++
                        if (
                            i < bytes.length &&
                            bytes[i] >= 0x30 &&
                            bytes[i] <= 0x37
                        ) {
                            oct = oct * 8 + (bytes[i] - 0x30)
                            i++
                            if (
                                i < bytes.length &&
                                bytes[i] >= 0x30 &&
                                bytes[i] <= 0x37
                            ) {
                                oct = oct * 8 + (bytes[i] - 0x30)
                                i++
                            }
                        }
                        out.push(oct & 0xff)
                    } else {
                        // Per PDF spec: unknown escape → backslash is ignored
                        out.push(next)
                        i++
                    }
                    break
            }
        } else if (b === LPAREN) {
            depth++
            out.push(b)
            i++
        } else if (b === RPAREN) {
            depth--
            if (depth > 0) out.push(b)
            i++
        } else if (b === 0x0d) {
            // Bare CR or CR+LF → LF (PDF spec 7.3.4.2)
            out.push(0x0a)
            i++
            if (i < bytes.length && bytes[i] === 0x0a) i++
        } else {
            out.push(b)
            i++
        }
    }
    return new Uint8Array(out) as ByteArray
}

/**
 * Skip the content of a literal string in the byte buffer, starting at
 * `offset` (the byte of the opening `(`).  Returns the index of the byte
 * just past the closing `)`.  Handles backslash escapes and nested parens.
 */
function skipLiteralString(bytes: Uint8Array, offset: number): number {
    let i = offset + 1
    let depth = 1
    while (i < bytes.length && depth > 0) {
        const b = bytes[i]
        if (b === BACKSLASH) {
            i += 2
            continue
        }
        if (b === LPAREN) depth++
        else if (b === RPAREN) depth--
        if (depth === 0) break
        i++
    }
    return i + 1 // past ')'
}

/**
 * Find the first literal `(…)` or hex `<…>` string operand in a raw op
 * byte buffer and return its properly-unescaped content.  For literal
 * strings the PDF escape sequences are processed at the byte level so
 * binary content is never corrupted.
 */
function extractStringOperandBytes(
    bytes: ByteArray,
): StringOperandResult | null {
    for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === LPAREN) {
            return {
                kind: 'literal',
                rawBytes: unescapeLiteralBytes(bytes, i + 1),
            }
        }
        if (
            bytes[i] === LANGLE &&
            (i + 1 >= bytes.length || bytes[i + 1] !== LANGLE)
        ) {
            const end = bytes.indexOf(RANGLE, i + 1)
            if (end === -1) return null
            let hex = ''
            for (let j = i + 1; j < end; j++)
                hex += String.fromCharCode(bytes[j])
            return { kind: 'hex', rawBytes: new Uint8Array(0), hex }
        }
    }
    return null
}

type StringOperandResult =
    | { kind: 'literal'; rawBytes: ByteArray; hex?: undefined }
    | { kind: 'hex'; rawBytes: ByteArray; hex: string }

/**
 * Parse a TJ `[…]` array operand directly from the op byte buffer.
 * Literal strings are unescaped at the byte level; hex strings and numbers
 * are handled normally.
 */
function extractArraySegmentsFromBytes(
    bytes: ByteArray,
): (PdfString | PdfHexadecimal | number)[] {
    let start = bytes.indexOf(LBRACKET)
    if (start === -1) return []
    let end = bytes.length - 1
    while (end > start && bytes[end] !== RBRACKET) end--
    if (end <= start) return []

    const result: (PdfString | PdfHexadecimal | number)[] = []
    let i = start + 1

    while (i < end) {
        const b = bytes[i]

        // Skip whitespace
        if (
            b === 0x20 ||
            b === 0x09 ||
            b === 0x0a ||
            b === 0x0d ||
            b === 0x0c ||
            b === 0x00
        ) {
            i++
            continue
        }

        if (b === LPAREN) {
            result.push(new PdfString(unescapeLiteralBytes(bytes, i + 1)))
            i = skipLiteralString(bytes, i)
            continue
        }

        if (b === LANGLE) {
            const j = bytes.indexOf(RANGLE, i + 1)
            if (j === -1) break
            let hex = ''
            for (let k = i + 1; k < j; k++) hex += String.fromCharCode(bytes[k])
            result.push(new PdfHexadecimal(hex))
            i = j + 1
            continue
        }

        // Number — read until next delimiter or whitespace
        let j = i
        while (
            j < end &&
            bytes[j] !== 0x20 &&
            bytes[j] !== 0x09 &&
            bytes[j] !== 0x0a &&
            bytes[j] !== 0x0d &&
            bytes[j] !== LPAREN &&
            bytes[j] !== LANGLE
        ) {
            j++
        }
        let numStr = ''
        for (let k = i; k < j; k++) numStr += String.fromCharCode(bytes[k])
        if (numStr.length > 0) {
            const n = parseFloat(numStr)
            if (!Number.isNaN(n)) result.push(n)
        }
        i = j
    }
    return result
}

// -- Legacy string-based helpers (kept for informal text getters) -----------

/**
 * Extract the first literal `(…)` or hex `<…>` string operand from the
 * Latin-1 string form of op bytes.  Kept for the `text` getter which
 * only needs an approximate display string, not exact binary bytes.
 */
function extractStringOperand(
    raw: string,
): { kind: 'literal' | 'hex'; body: string } | null {
    const trimmed = raw.trim()

    const hexStart = trimmed.indexOf('<')
    const litStart = trimmed.indexOf('(')

    const useHex =
        hexStart !== -1 &&
        (litStart === -1 || hexStart < litStart) &&
        trimmed[hexStart + 1] !== '<'

    if (useHex) {
        const end = trimmed.indexOf('>', hexStart + 1)
        if (end === -1) return null
        return { kind: 'hex', body: trimmed.slice(hexStart + 1, end) }
    }

    if (litStart === -1) return null

    let depth = 1
    let j = litStart + 1
    while (j < trimmed.length && depth > 0) {
        const c = trimmed[j]
        if (c === '\\') {
            j += 2
            continue
        }
        if (c === '(') depth++
        else if (c === ')') depth--
        if (depth === 0) break
        j++
    }
    return { kind: 'literal', body: trimmed.slice(litStart + 1, j) }
}

export class SetFontOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(fontName: string, fontSize: number): SetFontOp {
        return new SetFontOp(`/${fontName} ${fontSize} Tf`)
    }

    get fontName(): string {
        if (!this.raw) return ''
        return this.parts().operands[0].slice(1) // remove leading '/'
    }

    get fontSize(): number {
        if (!this.raw) return 0
        return parseFloat(this.parts().operands[1])
    }

    set fontName(name: string) {
        const size = this.fontSize
        this.raw = `/${name} ${size} Tf`
    }

    set fontSize(size: number) {
        const name = this.fontName
        this.raw = `/${name} ${size} Tf`
    }
}

export class SetTextMatrixOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number,
    ): SetTextMatrixOp {
        return new SetTextMatrixOp(`${a} ${b} ${c} ${d} ${e} ${f} Tm`)
    }

    get a(): number {
        return parseFloat(this.parts().operands[0])
    }
    get b(): number {
        return parseFloat(this.parts().operands[1])
    }
    get c(): number {
        return parseFloat(this.parts().operands[2])
    }
    get d(): number {
        return parseFloat(this.parts().operands[3])
    }
    get e(): number {
        return parseFloat(this.parts().operands[4])
    }
    get f(): number {
        return parseFloat(this.parts().operands[5])
    }

    set a(v: number) {
        this.raw = `${v} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f} Tm`
    }
    set b(v: number) {
        this.raw = `${this.a} ${v} ${this.c} ${this.d} ${this.e} ${this.f} Tm`
    }
    set c(v: number) {
        this.raw = `${this.a} ${this.b} ${v} ${this.d} ${this.e} ${this.f} Tm`
    }
    set d(v: number) {
        this.raw = `${this.a} ${this.b} ${this.c} ${v} ${this.e} ${this.f} Tm`
    }
    set e(v: number) {
        this.raw = `${this.a} ${this.b} ${this.c} ${this.d} ${v} ${this.f} Tm`
    }
    set f(v: number) {
        this.raw = `${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${v} Tm`
    }

    get matrix(): Matrix {
        return new Matrix({
            a: this.a,
            b: this.b,
            c: this.c,
            d: this.d,
            e: this.e,
            f: this.f,
        })
    }

    set matrix(m: Matrix) {
        this.raw = `${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f} cm`
    }
}

export class MoveTextOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(x: number, y: number): MoveTextOp {
        return new MoveTextOp(`${x} ${y} Td`)
    }

    get x(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y(): number {
        return parseFloat(this.parts().operands[1])
    }

    set x(v: number) {
        this.raw = `${v} ${this.y} Td`
    }
    set y(v: number) {
        this.raw = `${this.x} ${v} Td`
    }
}

export class MoveTextLeadingOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(x: number, y: number): MoveTextLeadingOp {
        return new MoveTextLeadingOp(`${x} ${y} TD`)
    }

    get x(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y(): number {
        return parseFloat(this.parts().operands[1])
    }

    set x(v: number) {
        this.raw = `${v} ${this.y} TD`
    }
    set y(v: number) {
        this.raw = `${this.x} ${v} TD`
    }
}

export class NextLineOp extends TextOp {
    constructor(input: string | ByteArray = 'T*') {
        super(input)
    }
}

export class ShowTextOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(text: PdfString | PdfHexadecimal | string): ShowTextOp {
        if (typeof text === 'string') {
            return new ShowTextOp(`(${text}) Tj`)
        } else if (text instanceof PdfHexadecimal) {
            return new ShowTextOp(`<${text.hexString}> Tj`)
        } else if (text instanceof PdfString) {
            return new ShowTextOp(`(${text.value}) Tj`)
        }
        throw new Error('Invalid text type for Tj operator')
    }

    get text(): string {
        if (!this.raw) return ''
        const s = extractStringOperand(this.raw)
        if (!s) return ''
        return s.body
    }

    set text(value: string) {
        this.raw = `(${value}) Tj`
    }

    /**
     * Return the operand as a typed PdfString or PdfHexadecimal.
     * This preserves the original encoding so callers can measure glyph codes.
     * Literal strings are unescaped at the byte level to avoid corrupting
     * binary CID-encoded data.
     */
    get stringOperand(): PdfString | PdfHexadecimal | null {
        const result = extractStringOperandBytes(this.bytes)
        if (!result) return null
        if (result.kind === 'hex') return new PdfHexadecimal(result.hex!)
        return new PdfString(result.rawBytes)
    }

    /**
     * Decode the text using the provided font.
     * Handles both literal strings (parentheses) and hex strings (angle brackets).
     */
    decodeWithFont(font: PdfFont): string {
        const op = this.stringOperand
        return op ? font.decode(op) : ''
    }
}

export type ShowTextSegment = PdfString | PdfHexadecimal | number

/**
 * `TJ` operator — an array of string/number entries used for text showing
 * with per-glyph positioning adjustments.
 */
export class ShowTextArrayOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(segments: ShowTextSegment[]): ShowTextArrayOp {
        return new ShowTextArrayOp(
            `[${segments.map(ShowTextArrayOp.encodeSegment).join(' ')}] TJ`,
        )
    }

    private static encodeSegment(segment: ShowTextSegment): string {
        if (typeof segment === 'number') return segment.toString()
        if (segment instanceof PdfHexadecimal) return `<${segment.hexString}>`
        if (segment instanceof PdfString) return `(${segment.value})`
        throw new Error('Invalid segment type for ShowTextArrayOp')
    }

    /**
     * Parse the `[...]` array operand from the raw bytes into a sequence of
     * typed segments (PdfString, PdfHexadecimal, number).  Literal strings
     * are unescaped at the byte level so binary CID data is preserved.
     */
    get segments(): ShowTextSegment[] {
        return extractArraySegmentsFromBytes(this.bytes)
    }

    set segments(value: ShowTextSegment[]) {
        this.raw = `[${value.map(ShowTextArrayOp.encodeSegment).join(' ')}] TJ`
    }

    get text(): string {
        return this.segments
            .filter((s): s is PdfString => s instanceof PdfString)
            .map((s) => s.value)
            .join('')
    }

    /**
     * Decode all text segments using the provided font.
     */
    decodeWithFont(font: PdfFont): string {
        return this.segments
            .filter(
                (s): s is PdfString | PdfHexadecimal =>
                    s instanceof PdfString || s instanceof PdfHexadecimal,
            )
            .map((s) => font.decode(s))
            .join('')
    }
}

export class SetCharSpacingOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(charSpace: number): SetCharSpacingOp {
        return new SetCharSpacingOp(`${charSpace} Tc`)
    }

    get charSpace(): number {
        return parseFloat(this.parts().operands[0])
    }
    set charSpace(v: number) {
        this.raw = `${v} Tc`
    }
}

export class SetWordSpacingOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(wordSpace: number): SetWordSpacingOp {
        return new SetWordSpacingOp(`${wordSpace} Tw`)
    }

    get wordSpace(): number {
        return parseFloat(this.parts().operands[0])
    }
    set wordSpace(v: number) {
        this.raw = `${v} Tw`
    }
}

export class BeginTextOp extends TextOp {
    constructor(input: string | ByteArray = 'BT') {
        super(input)
    }
}

export class EndTextOp extends TextOp {
    constructor(input: string | ByteArray = 'ET') {
        super(input)
    }
}

export class ShowTextNextLineOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(text: string): ShowTextNextLineOp {
        return new ShowTextNextLineOp(`(${text}) '`)
    }

    get text(): string {
        if (!this.raw) return ''
        const s = extractStringOperand(this.raw)
        if (!s) return ''
        return s.body
    }

    set text(value: string) {
        this.raw = `(${value}) '`
    }

    decode(font: PdfFont): string {
        const op = this.stringOperand
        return op ? font.decode(op) : ''
    }

    get stringOperand(): PdfString | PdfHexadecimal | null {
        const result = extractStringOperandBytes(this.bytes)
        if (!result) return null
        if (result.kind === 'hex') return new PdfHexadecimal(result.hex!)
        return new PdfString(result.rawBytes)
    }

    /**
     * Decode the text using the provided font.
     */
    decodeWithFont(font: PdfFont): string {
        const op = this.stringOperand
        return op ? font.decode(op) : ''
    }
}

export class ShowTextNextLineSpacingOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(
        wordSpace: number,
        charSpace: number,
        text: string,
    ): ShowTextNextLineSpacingOp {
        return new ShowTextNextLineSpacingOp(
            `${wordSpace} ${charSpace} (${text}) "`,
        )
    }

    get wordSpace(): number {
        return parseFloat(this.parts().operands[0])
    }
    get charSpace(): number {
        return parseFloat(this.parts().operands[1])
    }

    get extraLeading(): number {
        return parseFloat(this.parts().operands[2])
    }

    get text(): string {
        if (!this.raw) return ''
        const s = extractStringOperand(this.raw)
        if (!s) return ''
        return s.body
    }

    get stringOperand(): PdfString | PdfHexadecimal | null {
        const result = extractStringOperandBytes(this.bytes)
        if (!result) return null
        if (result.kind === 'hex') return new PdfHexadecimal(result.hex!)
        return new PdfString(result.rawBytes)
    }

    /**
     * Decode the text using the provided font.
     */
    decodeWithFont(font: PdfFont): string {
        const op = this.stringOperand
        return op ? font.decode(op) : ''
    }
}

export class SetHorizontalScalingOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(scale: number): SetHorizontalScalingOp {
        return new SetHorizontalScalingOp(`${scale} Tz`)
    }

    get scale(): number {
        return parseFloat(this.parts().operands[0])
    }
    set scale(v: number) {
        this.raw = `${v} Tz`
    }
}

export class SetTextLeadingOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(leading: number): SetTextLeadingOp {
        return new SetTextLeadingOp(`${leading} TL`)
    }

    get leading(): number {
        return parseFloat(this.parts().operands[0])
    }
    set leading(v: number) {
        this.raw = `${v} TL`
    }
}

export class SetTextRenderingModeOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(mode: number): SetTextRenderingModeOp {
        return new SetTextRenderingModeOp(`${mode} Tr`)
    }

    get mode(): number {
        return parseFloat(this.parts().operands[0])
    }
    set mode(v: number) {
        this.raw = `${v} Tr`
    }
}

export class SetTextRiseOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(rise: number): SetTextRiseOp {
        return new SetTextRiseOp(`${rise} Ts`)
    }

    get rise(): number {
        return parseFloat(this.parts().operands[0])
    }
    set rise(v: number) {
        this.raw = `${v} Ts`
    }
}
