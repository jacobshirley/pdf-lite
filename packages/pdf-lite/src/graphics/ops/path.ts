import { ByteArray } from '../../types'
import { ContentOp } from './base'

export class PathOp extends ContentOp {}

export class MoveToOp extends PathOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(x: number, y: number): MoveToOp {
        return new MoveToOp(`${x} ${y} m`)
    }

    get x(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y(): number {
        return parseFloat(this.parts().operands[1])
    }

    set x(v: number) {
        this.raw = `${v} ${this.y} m`
    }
    set y(v: number) {
        this.raw = `${this.x} ${v} m`
    }
}

export class LineToOp extends PathOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(x: number, y: number): LineToOp {
        return new LineToOp(`${x} ${y} l`)
    }

    get x(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y(): number {
        return parseFloat(this.parts().operands[1])
    }

    set x(v: number) {
        this.raw = `${v} ${this.y} l`
    }
    set y(v: number) {
        this.raw = `${this.x} ${v} l`
    }
}

export class CurveToOp extends PathOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): CurveToOp {
        return new CurveToOp(`${x1} ${y1} ${x2} ${y2} ${x3} ${y3} c`)
    }

    get x1(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y1(): number {
        return parseFloat(this.parts().operands[1])
    }
    get x2(): number {
        return parseFloat(this.parts().operands[2])
    }
    get y2(): number {
        return parseFloat(this.parts().operands[3])
    }
    get x3(): number {
        return parseFloat(this.parts().operands[4])
    }
    get y3(): number {
        return parseFloat(this.parts().operands[5])
    }

    set x1(v: number) {
        this.raw = `${v} ${this.y1} ${this.x2} ${this.y2} ${this.x3} ${this.y3} c`
    }
    set y1(v: number) {
        this.raw = `${this.x1} ${v} ${this.x2} ${this.y2} ${this.x3} ${this.y3} c`
    }
    set x2(v: number) {
        this.raw = `${this.x1} ${this.y1} ${v} ${this.y2} ${this.x3} ${this.y3} c`
    }
    set y2(v: number) {
        this.raw = `${this.x1} ${this.y1} ${this.x2} ${v} ${this.x3} ${this.y3} c`
    }
    set x3(v: number) {
        this.raw = `${this.x1} ${this.y1} ${this.x2} ${this.y2} ${v} ${this.y3} c`
    }
    set y3(v: number) {
        this.raw = `${this.x1} ${this.y1} ${this.x2} ${this.y2} ${this.x3} ${v} c`
    }
}

export class RectangleOp extends PathOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(
        x: number,
        y: number,
        width: number,
        height: number,
    ): RectangleOp {
        return new RectangleOp(`${x} ${y} ${width} ${height} re`)
    }

    get x(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y(): number {
        return parseFloat(this.parts().operands[1])
    }
    get width(): number {
        return parseFloat(this.parts().operands[2])
    }
    get height(): number {
        return parseFloat(this.parts().operands[3])
    }

    set x(v: number) {
        this.raw = `${v} ${this.y} ${this.width} ${this.height} re`
    }
    set y(v: number) {
        this.raw = `${this.x} ${v} ${this.width} ${this.height} re`
    }
    set width(v: number) {
        this.raw = `${this.x} ${this.y} ${v} ${this.height} re`
    }
    set height(v: number) {
        this.raw = `${this.x} ${this.y} ${this.width} ${v} re`
    }
}

export class CurveToV extends PathOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(x2: number, y2: number, x3: number, y3: number): CurveToV {
        return new CurveToV(`${x2} ${y2} ${x3} ${y3} v`)
    }

    get x2(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y2(): number {
        return parseFloat(this.parts().operands[1])
    }
    get x3(): number {
        return parseFloat(this.parts().operands[2])
    }
    get y3(): number {
        return parseFloat(this.parts().operands[3])
    }

    set x2(v: number) {
        this.raw = `${v} ${this.y2} ${this.x3} ${this.y3} v`
    }
    set y2(v: number) {
        this.raw = `${this.x2} ${v} ${this.x3} ${this.y3} v`
    }
    set x3(v: number) {
        this.raw = `${this.x2} ${this.y2} ${v} ${this.y3} v`
    }
    set y3(v: number) {
        this.raw = `${this.x2} ${this.y2} ${this.x3} ${v} v`
    }
}

export class CurveToY extends PathOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(x1: number, y1: number, x3: number, y3: number): CurveToY {
        return new CurveToY(`${x1} ${y1} ${x3} ${y3} y`)
    }

    get x1(): number {
        return parseFloat(this.parts().operands[0])
    }
    get y1(): number {
        return parseFloat(this.parts().operands[1])
    }
    get x3(): number {
        return parseFloat(this.parts().operands[2])
    }
    get y3(): number {
        return parseFloat(this.parts().operands[3])
    }

    set x1(v: number) {
        this.raw = `${v} ${this.y1} ${this.x3} ${this.y3} y`
    }
    set y1(v: number) {
        this.raw = `${this.x1} ${v} ${this.x3} ${this.y3} y`
    }
    set x3(v: number) {
        this.raw = `${this.x1} ${this.y1} ${v} ${this.y3} y`
    }
    set y3(v: number) {
        this.raw = `${this.x1} ${this.y1} ${this.x3} ${v} y`
    }
}

export class ClosePathOp extends PathOp {
    constructor(input: string | ByteArray = 'h') {
        super(input)
    }
}
