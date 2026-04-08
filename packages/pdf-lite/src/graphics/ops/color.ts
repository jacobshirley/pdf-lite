import { ContentOp } from './base'

export class SetFillColorRGBOp extends ContentOp {
    constructor(r: number, g: number, b: number) {
        super(`${r} ${g} ${b} rg`)
    }

    get r(): number {
        return parseFloat(this.parts().operands[0])
    }
    get g(): number {
        return parseFloat(this.parts().operands[1])
    }
    get b(): number {
        return parseFloat(this.parts().operands[2])
    }

    set r(v: number) {
        this.raw = `${v} ${this.g} ${this.b} rg`
    }
    set g(v: number) {
        this.raw = `${this.r} ${v} ${this.b} rg`
    }
    set b(v: number) {
        this.raw = `${this.r} ${this.g} ${v} rg`
    }
}

export class SetStrokeColorRGBOp extends ContentOp {
    constructor(r: number, g: number, b: number) {
        super(`${r} ${g} ${b} RG`)
    }

    get r(): number {
        return parseFloat(this.parts().operands[0])
    }
    get g(): number {
        return parseFloat(this.parts().operands[1])
    }
    get b(): number {
        return parseFloat(this.parts().operands[2])
    }

    set r(v: number) {
        this.raw = `${v} ${this.g} ${this.b} RG`
    }
    set g(v: number) {
        this.raw = `${this.r} ${v} ${this.b} RG`
    }
    set b(v: number) {
        this.raw = `${this.r} ${this.g} ${v} RG`
    }
}

export class SetFillColorGrayOp extends ContentOp {
    constructor(gray: number) {
        super(`${gray} g`)
    }

    get gray(): number {
        return parseFloat(this.parts().operands[0])
    }
    set gray(v: number) {
        this.raw = `${v} g`
    }
}

export class SetStrokeColorGrayOp extends ContentOp {
    constructor(gray: number) {
        super(`${gray} G`)
    }

    get gray(): number {
        return parseFloat(this.parts().operands[0])
    }
    set gray(v: number) {
        this.raw = `${v} G`
    }
}

export class SetFillColorCMYKOp extends ContentOp {
    constructor(c: number, m: number, y: number, k: number) {
        super(`${c} ${m} ${y} ${k} k`)
    }

    get c(): number {
        return parseFloat(this.parts().operands[0])
    }
    get m(): number {
        return parseFloat(this.parts().operands[1])
    }
    get y(): number {
        return parseFloat(this.parts().operands[2])
    }
    get k(): number {
        return parseFloat(this.parts().operands[3])
    }

    set c(v: number) {
        this.raw = `${v} ${this.m} ${this.y} ${this.k} k`
    }
    set m(v: number) {
        this.raw = `${this.c} ${v} ${this.y} ${this.k} k`
    }
    set y(v: number) {
        this.raw = `${this.c} ${this.m} ${v} ${this.k} k`
    }
    set k(v: number) {
        this.raw = `${this.c} ${this.m} ${this.y} ${v} k`
    }
}

export class SetStrokeColorCMYKOp extends ContentOp {
    constructor(c: number, m: number, y: number, k: number) {
        super(`${c} ${m} ${y} ${k} K`)
    }

    get c(): number {
        return parseFloat(this.parts().operands[0])
    }
    get m(): number {
        return parseFloat(this.parts().operands[1])
    }
    get y(): number {
        return parseFloat(this.parts().operands[2])
    }
    get k(): number {
        return parseFloat(this.parts().operands[3])
    }

    set c(v: number) {
        this.raw = `${v} ${this.m} ${this.y} ${this.k} K`
    }
    set m(v: number) {
        this.raw = `${this.c} ${v} ${this.y} ${this.k} K`
    }
    set y(v: number) {
        this.raw = `${this.c} ${this.m} ${v} ${this.k} K`
    }
    set k(v: number) {
        this.raw = `${this.c} ${this.m} ${this.y} ${v} K`
    }
}

export class SetFillColorSpaceOp extends ContentOp {
    constructor(name: string) {
        super(`/${name} cs`)
    }

    get name(): string {
        return this.parts().operands[0]?.slice(1) ?? ''
    }
    set name(v: string) {
        this.raw = `/${v} cs`
    }
}

export class SetStrokeColorSpaceOp extends ContentOp {
    constructor(name: string) {
        super(`/${name} CS`)
    }

    get name(): string {
        return this.parts().operands[0]?.slice(1) ?? ''
    }
    set name(v: string) {
        this.raw = `/${v} CS`
    }
}

export class SetFillColorOp extends ContentOp {
    constructor(...components: number[]) {
        super(`${components.join(' ')} sc`)
    }
}

export class SetStrokeColorOp extends ContentOp {
    constructor(...components: number[]) {
        super(`${components.join(' ')} SC`)
    }
}

export class SetFillColorExtOp extends ContentOp {
    constructor(...components: (number | string)[]) {
        super(`${components.join(' ')} scn`)
    }
}

export class SetStrokeColorExtOp extends ContentOp {
    constructor(...components: (number | string)[]) {
        super(`${components.join(' ')} SCN`)
    }
}
