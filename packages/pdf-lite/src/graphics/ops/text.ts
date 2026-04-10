import { PdfFont } from '../..'
import { PdfHexadecimal, PdfString } from '../../core'
import { ContentOp } from './base'

export class TextOp extends ContentOp {}

export class SetFontOp extends TextOp {
    constructor(fontName: string, fontSize: number) {
        super(`/${fontName} ${fontSize} Tf`)
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
    constructor(
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number,
    ) {
        super(`${a} ${b} ${c} ${d} ${e} ${f} Tm`)
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
}

export class MoveTextOp extends TextOp {
    constructor(x: number, y: number) {
        super(`${x} ${y} Td`)
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
    constructor(x: number, y: number) {
        super(`${x} ${y} TD`)
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
    constructor() {
        super('T*')
    }
}

export class ShowTextOp extends TextOp {
    constructor(text: PdfString | PdfHexadecimal | string) {
        if (typeof text === 'string') {
            super(`(${text}) Tj`)
        } else if (text instanceof PdfHexadecimal) {
            super(`<${text.hexString}> Tj`)
        } else if (text instanceof PdfString) {
            super(`(${text.value}) Tj`)
        } else {
            throw new Error('Invalid text type for Tj operator')
        }
    }

    get text(): string {
        if (!this.raw) return ''
        const operand = this.parts().operands.join(' ')
        if (operand.startsWith('(') && operand.endsWith(')')) {
            return operand.slice(1, -1)
        }
        if (operand.startsWith('<') && operand.endsWith('>')) {
            return operand.slice(1, -1)
        }
        return operand
    }

    set text(value: string) {
        this.raw = `(${value}) Tj`
    }
}

export class ShowTextArrayOp extends TextOp {
    constructor(array: string) {
        super(`${array} TJ`)
    }

    get array(): string {
        if (!this.raw) return ''
        const parts = this.parts()
        return parts.operands.join(' ')
    }

    set array(value: string) {
        this.raw = `${value} TJ`
    }

    get text(): string {
        const arr = this.array
        let result = ''
        const re = /\((?:[^()\\]|\\.)*\)|<[^>]*>/g
        let m: RegExpExecArray | null
        while ((m = re.exec(arr)) !== null) {
            const token = m[0]
            if (token.startsWith('(') && token.endsWith(')')) {
                result += token.slice(1, -1)
            } else if (token.startsWith('<') && token.endsWith('>')) {
                result += token.slice(1, -1)
            }
        }
        return result
    }
}

export class SetCharSpacingOp extends TextOp {
    constructor(charSpace: number) {
        super(`${charSpace} Tc`)
    }

    get charSpace(): number {
        return parseFloat(this.parts().operands[0])
    }
    set charSpace(v: number) {
        this.raw = `${v} Tc`
    }
}

export class SetWordSpacingOp extends TextOp {
    constructor(wordSpace: number) {
        super(`${wordSpace} Tw`)
    }

    get wordSpace(): number {
        return parseFloat(this.parts().operands[0])
    }
    set wordSpace(v: number) {
        this.raw = `${v} Tw`
    }
}

export class BeginTextOp extends TextOp {
    constructor() {
        super('BT')
    }
}

export class EndTextOp extends TextOp {
    constructor() {
        super('ET')
    }
}

export class ShowTextNextLineOp extends TextOp {
    constructor(text: string) {
        super(`(${text}) '`)
    }

    get text(): string {
        if (!this.raw) return ''
        const operand = this.parts().operands.join(' ')
        if (operand.startsWith('(') && operand.endsWith(')')) {
            return operand.slice(1, -1)
        }
        return operand
    }

    set text(value: string) {
        this.raw = `(${value}) '`
    }

    decode(font: PdfFont): string {
        return font.decode(new PdfString(this.text))
    }
}

export class ShowTextNextLineSpacingOp extends TextOp {
    constructor(wordSpace: number, charSpace: number, text: string) {
        super(`${wordSpace} ${charSpace} (${text}) "`)
    }

    get wordSpace(): number {
        return parseFloat(this.parts().operands[0])
    }
    get charSpace(): number {
        return parseFloat(this.parts().operands[1])
    }

    get text(): string {
        if (!this.raw) return ''
        const operands = this.parts().operands
        const textPart = operands.slice(2).join(' ')
        if (textPart.startsWith('(') && textPart.endsWith(')')) {
            return textPart.slice(1, -1)
        }
        return textPart
    }
}

export class SetHorizontalScalingOp extends TextOp {
    constructor(scale: number) {
        super(`${scale} Tz`)
    }

    get scale(): number {
        return parseFloat(this.parts().operands[0])
    }
    set scale(v: number) {
        this.raw = `${v} Tz`
    }
}

export class SetTextLeadingOp extends TextOp {
    constructor(leading: number) {
        super(`${leading} TL`)
    }

    get leading(): number {
        return parseFloat(this.parts().operands[0])
    }
    set leading(v: number) {
        this.raw = `${v} TL`
    }
}

export class SetTextRenderingModeOp extends TextOp {
    constructor(mode: number) {
        super(`${mode} Tr`)
    }

    get mode(): number {
        return parseFloat(this.parts().operands[0])
    }
    set mode(v: number) {
        this.raw = `${v} Tr`
    }
}

export class SetTextRiseOp extends TextOp {
    constructor(rise: number) {
        super(`${rise} Ts`)
    }

    get rise(): number {
        return parseFloat(this.parts().operands[0])
    }
    set rise(v: number) {
        this.raw = `${v} Ts`
    }
}
