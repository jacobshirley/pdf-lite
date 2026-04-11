import { PdfFont } from '../..'
import { PdfHexadecimal, PdfString } from '../../core'
import { ByteArray } from '../../types'
import { Matrix } from '../geom/matrix'
import { ContentOp } from './base'

export class TextOp extends ContentOp {}

/**
 * Extract the first literal `(…)` or hex `<…>` string operand from raw
 * op bytes using PDF-aware parsing (respects balanced parens and
 * backslash escapes).  Returns `{ kind, body }` where `body` is the
 * content between the delimiters, or `null` if no string is found.
 */
function extractStringOperand(
    raw: string,
): { kind: 'literal' | 'hex'; body: string } | null {
    const trimmed = raw.trim()

    // Hex string
    const hexStart = trimmed.indexOf('<')
    const litStart = trimmed.indexOf('(')

    // Pick whichever delimiter comes first (ignoring -1)
    const useHex =
        hexStart !== -1 &&
        (litStart === -1 || hexStart < litStart) &&
        // Make sure it's not a dictionary `<<`
        trimmed[hexStart + 1] !== '<'

    if (useHex) {
        const end = trimmed.indexOf('>', hexStart + 1)
        if (end === -1) return null
        return { kind: 'hex', body: trimmed.slice(hexStart + 1, end) }
    }

    if (litStart === -1) return null

    // Literal string — walk with balanced parens + backslash escapes
    let depth = 1
    let j = litStart + 1
    while (j < trimmed.length && depth > 0) {
        const c = trimmed[j]
        if (c === '\\') {
            j += 2 // skip escaped char
            continue
        }
        if (c === '(') depth++
        else if (c === ')') depth--
        if (depth === 0) break
        j++
    }
    return { kind: 'literal', body: trimmed.slice(litStart + 1, j) }
}

/**
 * Unescape a PDF literal-string body (the content between the outer `(…)`).
 */
function unescapePdfLiteral(body: string): string {
    return body
        .replace(/\\\\/g, '\x00') // \\ → temp marker
        .replace(/\\\(/g, '(') // \( → (
        .replace(/\\\)/g, ')') // \) → )
        .replace(/\\([0-7]{1,3})/g, (_m, oct: string) =>
            String.fromCharCode(parseInt(oct, 8)),
        ) // \ddd → octal char
        .replace(/\\n/g, '\n') // \n → newline
        .replace(/\\r/g, '\r') // \r → CR
        .replace(/\\t/g, '\t') // \t → tab
        .replace(/\\b/g, '\b') // \b → backspace
        .replace(/\\f/g, '\f') // \f → form feed
        .replace(/\x00/g, '\\') // restore \
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
     */
    get stringOperand(): PdfString | PdfHexadecimal | null {
        if (!this.raw) return null
        const s = extractStringOperand(this.raw)
        if (!s) return null
        if (s.kind === 'hex') return new PdfHexadecimal(s.body)
        return new PdfString(unescapePdfLiteral(s.body))
    }

    /**
     * Decode the text using the provided font.
     * Handles both literal strings (parentheses) and hex strings (angle brackets).
     */
    decodeWithFont(font: PdfFont): string {
        if (!this.raw) return ''
        const s = extractStringOperand(this.raw)
        if (!s) return ''
        if (s.kind === 'hex') {
            return font.decode(new PdfHexadecimal(s.body))
        }
        return unescapePdfLiteral(s.body)
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
     * typed segments (PdfString, PdfHexadecimal, number). Whitespace inside
     * the array is ignored; literal strings honour balanced parens and
     * backslash escapes.
     */
    get segments(): ShowTextSegment[] {
        const raw = this.raw
        const start = raw.indexOf('[')
        const end = raw.lastIndexOf(']')
        if (start === -1 || end === -1 || end <= start) return []

        const body = raw.slice(start + 1, end)
        const result: ShowTextSegment[] = []
        let i = 0

        while (i < body.length) {
            const ch = body[i]

            // Skip whitespace
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
                i++
                continue
            }

            if (ch === '(') {
                // Literal string — honour balanced parens and backslash escapes.
                let depth = 1
                let j = i + 1
                while (j < body.length && depth > 0) {
                    const c = body[j]
                    if (c === '\\') {
                        j += 2
                        continue
                    }
                    if (c === '(') depth++
                    else if (c === ')') depth--
                    if (depth === 0) break
                    j++
                }
                // Unescape PDF escape sequences before creating PdfString
                const escaped = body.slice(i + 1, j)
                const unescaped = escaped
                    .replace(/\\\\/g, '\x00') // \\ -> temporary marker
                    .replace(/\\\(/g, '(') // \( -> (
                    .replace(/\\\)/g, ')') // \) -> )
                    .replace(/\x00/g, '\\') // restore \
                result.push(new PdfString(unescaped))
                i = j + 1
                continue
            }

            if (ch === '<') {
                const j = body.indexOf('>', i + 1)
                if (j === -1) break
                result.push(new PdfHexadecimal(body.slice(i + 1, j)))
                i = j + 1
                continue
            }

            // Number — read until next whitespace / delimiter.
            let j = i
            while (
                j < body.length &&
                body[j] !== ' ' &&
                body[j] !== '\t' &&
                body[j] !== '\n' &&
                body[j] !== '\r' &&
                body[j] !== '(' &&
                body[j] !== '<'
            ) {
                j++
            }
            const numStr = body.slice(i, j)
            if (numStr.length > 0) {
                const n = parseFloat(numStr)
                if (!Number.isNaN(n)) result.push(n)
            }
            i = j
        }

        return result
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
        return font.decode(new PdfString(this.text))
    }

    /**
     * Decode the text using the provided font.
     */
    decodeWithFont(font: PdfFont): string {
        if (!this.raw) return ''
        const s = extractStringOperand(this.raw)
        if (!s) return ''
        if (s.kind === 'hex') {
            return font.decode(new PdfHexadecimal(s.body))
        }
        return unescapePdfLiteral(s.body)
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

    /**
     * Decode the text using the provided font.
     */
    decodeWithFont(font: PdfFont): string {
        if (!this.raw) return ''
        const s = extractStringOperand(this.raw)
        if (!s) return ''
        if (s.kind === 'hex') {
            return font.decode(new PdfHexadecimal(s.body))
        }
        return unescapePdfLiteral(s.body)
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
