import { ByteArray } from '../../types'
import { ContentOp } from './base'

export class ColorOp extends ContentOp {}

export class SetFillColorRGBOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(r: number, g: number, b: number): SetFillColorRGBOp {
        return new SetFillColorRGBOp(`${r} ${g} ${b} rg`)
    }

    get r(): number {
        return this.numberOperand(0)
    }
    get g(): number {
        return this.numberOperand(1)
    }
    get b(): number {
        return this.numberOperand(2)
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

export class SetStrokeColorRGBOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(r: number, g: number, b: number): SetStrokeColorRGBOp {
        return new SetStrokeColorRGBOp(`${r} ${g} ${b} RG`)
    }

    get r(): number {
        return this.numberOperand(0)
    }
    get g(): number {
        return this.numberOperand(1)
    }
    get b(): number {
        return this.numberOperand(2)
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

export class SetFillColorGrayOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(gray: number): SetFillColorGrayOp {
        return new SetFillColorGrayOp(`${gray} g`)
    }

    get gray(): number {
        return this.numberOperand(0)
    }
    set gray(v: number) {
        this.raw = `${v} g`
    }
}

export class SetStrokeColorGrayOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(gray: number): SetStrokeColorGrayOp {
        return new SetStrokeColorGrayOp(`${gray} G`)
    }

    get gray(): number {
        return this.numberOperand(0)
    }
    set gray(v: number) {
        this.raw = `${v} G`
    }
}

export class SetFillColorCMYKOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(
        c: number,
        m: number,
        y: number,
        k: number,
    ): SetFillColorCMYKOp {
        return new SetFillColorCMYKOp(`${c} ${m} ${y} ${k} k`)
    }

    get c(): number {
        return this.numberOperand(0)
    }
    get m(): number {
        return this.numberOperand(1)
    }
    get y(): number {
        return this.numberOperand(2)
    }
    get k(): number {
        return this.numberOperand(3)
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

export class SetStrokeColorCMYKOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(
        c: number,
        m: number,
        y: number,
        k: number,
    ): SetStrokeColorCMYKOp {
        return new SetStrokeColorCMYKOp(`${c} ${m} ${y} ${k} K`)
    }

    get c(): number {
        return this.numberOperand(0)
    }
    get m(): number {
        return this.numberOperand(1)
    }
    get y(): number {
        return this.numberOperand(2)
    }
    get k(): number {
        return this.numberOperand(3)
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

export class SetFillColorSpaceOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(name: string): SetFillColorSpaceOp {
        return new SetFillColorSpaceOp(`/${name} cs`)
    }

    get name(): string {
        return this.nameOperand(0)
    }
    set name(v: string) {
        this.raw = `/${v} cs`
    }
}

export class SetStrokeColorSpaceOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(name: string): SetStrokeColorSpaceOp {
        return new SetStrokeColorSpaceOp(`/${name} CS`)
    }

    get name(): string {
        return this.nameOperand(0)
    }
    set name(v: string) {
        this.raw = `/${v} CS`
    }
}

export class SetFillColorOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(...components: number[]): SetFillColorOp {
        return new SetFillColorOp(`${components.join(' ')} sc`)
    }
}

export class SetStrokeColorOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(...components: number[]): SetStrokeColorOp {
        return new SetStrokeColorOp(`${components.join(' ')} SC`)
    }
}

export class SetFillColorExtOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(...components: (number | string)[]): SetFillColorExtOp {
        return new SetFillColorExtOp(`${components.join(' ')} scn`)
    }
}

export class SetStrokeColorExtOp extends ColorOp {
    constructor(input: string | ByteArray = '') {
        super(input)
    }

    static create(...components: (number | string)[]): SetStrokeColorExtOp {
        return new SetStrokeColorExtOp(`${components.join(' ')} SCN`)
    }
}
