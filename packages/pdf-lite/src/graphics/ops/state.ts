import { ByteArray } from '../../types'
import { Matrix } from '../geom/matrix'
import { ContentOp } from './base'

export class StateOp extends ContentOp {}

export class SaveStateOp extends StateOp {
    constructor(input: string | ByteArray = 'q') {
        super(input)
    }
}

export class RestoreStateOp extends StateOp {
    constructor(input: string | ByteArray = 'Q') {
        super(input)
    }
}

export class SetMatrixOp extends StateOp {
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
    ): SetMatrixOp {
        return new SetMatrixOp(`${a} ${b} ${c} ${d} ${e} ${f} cm`)
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
        this.raw = `${v} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f} cm`
    }
    set b(v: number) {
        this.raw = `${this.a} ${v} ${this.c} ${this.d} ${this.e} ${this.f} cm`
    }
    set c(v: number) {
        this.raw = `${this.a} ${this.b} ${v} ${this.d} ${this.e} ${this.f} cm`
    }
    set d(v: number) {
        this.raw = `${this.a} ${this.b} ${this.c} ${v} ${this.e} ${this.f} cm`
    }
    set e(v: number) {
        this.raw = `${this.a} ${this.b} ${this.c} ${this.d} ${v} ${this.f} cm`
    }
    set f(v: number) {
        this.raw = `${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${v} cm`
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

export class SetLineWidthOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(lineWidth: number): SetLineWidthOp {
        return new SetLineWidthOp(`${lineWidth} w`)
    }

    get lineWidth(): number {
        return parseFloat(this.parts().operands[0])
    }
    set lineWidth(v: number) {
        this.raw = `${v} w`
    }
}

export class SetGraphicsStateOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(name: string): SetGraphicsStateOp {
        return new SetGraphicsStateOp(`/${name} gs`)
    }

    get name(): string {
        if (!this.raw) return ''
        return this.parts().operands[0].slice(1)
    }

    set name(v: string) {
        this.raw = `/${v} gs`
    }
}

export class SetLineCapOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(cap: number): SetLineCapOp {
        return new SetLineCapOp(`${cap} J`)
    }

    get cap(): number {
        return parseFloat(this.parts().operands[0])
    }
    set cap(v: number) {
        this.raw = `${v} J`
    }
}

export class SetLineJoinOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(join: number): SetLineJoinOp {
        return new SetLineJoinOp(`${join} j`)
    }

    get join(): number {
        return parseFloat(this.parts().operands[0])
    }
    set join(v: number) {
        this.raw = `${v} j`
    }
}

export class SetMiterLimitOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(limit: number): SetMiterLimitOp {
        return new SetMiterLimitOp(`${limit} M`)
    }

    get limit(): number {
        return parseFloat(this.parts().operands[0])
    }
    set limit(v: number) {
        this.raw = `${v} M`
    }
}

export class SetDashPatternOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(array: string, phase: number): SetDashPatternOp {
        return new SetDashPatternOp(`${array} ${phase} d`)
    }
}

export class SetRenderingIntentOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(intent: string): SetRenderingIntentOp {
        return new SetRenderingIntentOp(`/${intent} ri`)
    }

    get intent(): string {
        return this.parts().operands[0]?.slice(1) ?? ''
    }
    set intent(v: string) {
        this.raw = `/${v} ri`
    }
}

export class SetFlatnessOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(flatness: number): SetFlatnessOp {
        return new SetFlatnessOp(`${flatness} i`)
    }

    get flatness(): number {
        return parseFloat(this.parts().operands[0])
    }
    set flatness(v: number) {
        this.raw = `${v} i`
    }
}

export class InvokeXObjectOp extends StateOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(name: string): InvokeXObjectOp {
        return new InvokeXObjectOp(`/${name} Do`)
    }

    get name(): string {
        if (!this.raw) return ''
        return this.parts().operands[0].slice(1)
    }

    set name(v: string) {
        this.raw = `/${v} Do`
    }
}
