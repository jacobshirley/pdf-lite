import { PdfFont } from '../..'
import { PdfHexadecimal, PdfNumber, PdfString } from '../../core'
import { ByteArray } from '../../types'
import { Matrix } from '../geom/matrix'
import { ContentOp, ContentOpOperand } from './base'

export class TextOp extends ContentOp {}

// String/number operands are parsed by `PdfContentStreamTokeniser` into
// `this.operands` as typed `PdfString` / `PdfHexadecimal` / `PdfNumber`
// values — accessors below read from there directly rather than
// re-parsing the raw op bytes.

/** Escape a string for inclusion inside a PDF literal `(...)` operand. */
function escapeLiteral(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
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
        return this.nameOperand(0)
    }

    get fontSize(): number {
        if (!this.raw) return 0
        return this.numberOperand(1)
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
        return this.numberOperand(0)
    }
    get b(): number {
        return this.numberOperand(1)
    }
    get c(): number {
        return this.numberOperand(2)
    }
    get d(): number {
        return this.numberOperand(3)
    }
    get e(): number {
        return this.numberOperand(4)
    }
    get f(): number {
        return this.numberOperand(5)
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
        return this.numberOperand(0)
    }
    get y(): number {
        return this.numberOperand(1)
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
        return this.numberOperand(0)
    }
    get y(): number {
        return this.numberOperand(1)
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
        let operand: PdfString | PdfHexadecimal
        let raw: string
        if (typeof text === 'string') {
            operand = new PdfString(text)
            raw = `(${escapeLiteral(text)}) Tj`
        } else if (text instanceof PdfHexadecimal) {
            operand = text
            raw = `<${text.hexString}> Tj`
        } else if (text instanceof PdfString) {
            operand = text
            raw = `(${escapeLiteral(text.value)}) Tj`
        } else {
            throw new Error('Invalid text type for Tj operator')
        }
        const op = new ShowTextOp(raw)
        op.operands = [operand]
        return op
    }

    get text(): string {
        const op = this.stringOperand
        if (!op) return ''
        return op instanceof PdfString ? op.value : op.hexString
    }

    set text(value: string) {
        this.raw = `(${escapeLiteral(value)}) Tj`
        this.operands = [new PdfString(value)]
    }

    /**
     * Return the operand as a typed PdfString or PdfHexadecimal. Preserves
     * the original encoding so callers can measure glyph codes.
     */
    get stringOperand(): PdfString | PdfHexadecimal | null {
        return this.stringOperandAt(0)
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

export type ShowTextSegment = PdfString | PdfHexadecimal | PdfNumber

/**
 * `TJ` operator — an array of string/number entries used for text showing
 * with per-glyph positioning adjustments.
 */
export class ShowTextArrayOp extends TextOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(segments: (ShowTextSegment | number)[]): ShowTextArrayOp {
        const normalised = segments.map((s) =>
            typeof s === 'number' ? new PdfNumber(s) : s,
        )
        const op = new ShowTextArrayOp(
            `[${normalised.map(ShowTextArrayOp.encodeSegment).join(' ')}] TJ`,
        )
        op.operands = [normalised as ContentOpOperand[]]
        return op
    }

    private static encodeSegment(segment: ShowTextSegment): string {
        if (segment instanceof PdfNumber) return segment.value.toString()
        if (segment instanceof PdfHexadecimal) return `<${segment.hexString}>`
        if (segment instanceof PdfString) return `(${segment.value})`
        throw new Error('Invalid segment type for ShowTextArrayOp')
    }

    /**
     * The `[...]` array operand as a sequence of typed segments
     * (PdfString, PdfHexadecimal, PdfNumber). Populated by the
     * content-stream tokeniser; literal strings are unescaped
     * byte-safely so binary CID data is preserved.
     */
    get segments(): ShowTextSegment[] {
        const arr = this.operands[0]
        if (!Array.isArray(arr)) return []
        return arr.filter(
            (s): s is ShowTextSegment =>
                s instanceof PdfString ||
                s instanceof PdfHexadecimal ||
                s instanceof PdfNumber,
        )
    }

    set segments(value: ShowTextSegment[]) {
        this.raw = `[${value.map(ShowTextArrayOp.encodeSegment).join(' ')}] TJ`
        this.operands = [value as ContentOpOperand[]]
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
        return this.numberOperand(0)
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
        return this.numberOperand(0)
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
        const op = new ShowTextNextLineOp(`(${escapeLiteral(text)}) '`)
        op.operands = [new PdfString(text)]
        return op
    }

    get text(): string {
        const op = this.stringOperand
        if (!op) return ''
        return op instanceof PdfString ? op.value : op.hexString
    }

    set text(value: string) {
        this.raw = `(${escapeLiteral(value)}) '`
        this.operands = [new PdfString(value)]
    }

    decode(font: PdfFont): string {
        const op = this.stringOperand
        return op ? font.decode(op) : ''
    }

    get stringOperand(): PdfString | PdfHexadecimal | null {
        return this.stringOperandAt(0)
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
        const op = new ShowTextNextLineSpacingOp(
            `${wordSpace} ${charSpace} (${escapeLiteral(text)}) "`,
        )
        op.operands = [
            new PdfNumber(wordSpace),
            new PdfNumber(charSpace),
            new PdfString(text),
        ]
        return op
    }

    get wordSpace(): number {
        return this.numberOperand(0)
    }
    get charSpace(): number {
        return this.numberOperand(1)
    }

    get extraLeading(): number {
        return this.numberOperand(2)
    }

    get text(): string {
        const op = this.stringOperand
        if (!op) return ''
        return op instanceof PdfString ? op.value : op.hexString
    }

    get stringOperand(): PdfString | PdfHexadecimal | null {
        return this.stringOperandAt(2)
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
        return this.numberOperand(0)
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
        return this.numberOperand(0)
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
        return this.numberOperand(0)
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
        return this.numberOperand(0)
    }
    set rise(v: number) {
        this.raw = `${v} Ts`
    }
}
