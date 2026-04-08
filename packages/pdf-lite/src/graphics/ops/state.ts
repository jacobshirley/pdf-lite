import { ContentOp } from './base'

export class SaveStateOp extends ContentOp {
    constructor() {
        super('q')
    }
}

export class RestoreStateOp extends ContentOp {
    constructor() {
        super('Q')
    }
}

export class SetMatrixOp extends ContentOp {
    constructor(
        a: number,
        b: number,
        c: number,
        d: number,
        e: number,
        f: number,
    ) {
        super(`${a} ${b} ${c} ${d} ${e} ${f} cm`)
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
}

export class SetLineWidthOp extends ContentOp {
    constructor(lineWidth: number) {
        super(`${lineWidth} w`)
    }

    get lineWidth(): number {
        return parseFloat(this.parts().operands[0])
    }
    set lineWidth(v: number) {
        this.raw = `${v} w`
    }
}

export class SetGraphicsStateOp extends ContentOp {
    constructor(name: string) {
        super(`/${name} gs`)
    }

    get name(): string {
        if (!this.raw) return ''
        return this.parts().operands[0].slice(1)
    }

    set name(v: string) {
        this.raw = `/${v} gs`
    }
}

export class SetLineCapOp extends ContentOp {
    constructor(cap: number) {
        super(`${cap} J`)
    }

    get cap(): number {
        return parseFloat(this.parts().operands[0])
    }
    set cap(v: number) {
        this.raw = `${v} J`
    }
}

export class SetLineJoinOp extends ContentOp {
    constructor(join: number) {
        super(`${join} j`)
    }

    get join(): number {
        return parseFloat(this.parts().operands[0])
    }
    set join(v: number) {
        this.raw = `${v} j`
    }
}

export class SetMiterLimitOp extends ContentOp {
    constructor(limit: number) {
        super(`${limit} M`)
    }

    get limit(): number {
        return parseFloat(this.parts().operands[0])
    }
    set limit(v: number) {
        this.raw = `${v} M`
    }
}

export class SetDashPatternOp extends ContentOp {
    constructor(array: string, phase: number) {
        super(`${array} ${phase} d`)
    }
}

export class SetRenderingIntentOp extends ContentOp {
    constructor(intent: string) {
        super(`/${intent} ri`)
    }

    get intent(): string {
        return this.parts().operands[0]?.slice(1) ?? ''
    }
    set intent(v: string) {
        this.raw = `/${v} ri`
    }
}

export class SetFlatnessOp extends ContentOp {
    constructor(flatness: number) {
        super(`${flatness} i`)
    }

    get flatness(): number {
        return parseFloat(this.parts().operands[0])
    }
    set flatness(v: number) {
        this.raw = `${v} i`
    }
}

export class InvokeXObjectOp extends ContentOp {
    constructor(name: string) {
        super(`/${name} Do`)
    }

    get name(): string {
        if (!this.raw) return ''
        return this.parts().operands[0].slice(1)
    }

    set name(v: string) {
        this.raw = `/${v} Do`
    }
}
