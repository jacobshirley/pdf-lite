import { ContentOp } from './ops/base'
import {
    SetFillColorCMYKOp,
    SetFillColorGrayOp,
    SetFillColorRGBOp,
} from './ops/color'

export abstract class Color {
    abstract toOp(): ContentOp
}

export class RGBColor extends Color {
    r: number
    g: number
    b: number

    constructor(r: number, g: number, b: number) {
        super()
        this.r = r
        this.g = g
        this.b = b
    }

    toOp(): ContentOp {
        return SetFillColorRGBOp.create(this.r, this.g, this.b)
    }
}

export class GrayColor extends Color {
    gray: number

    constructor(gray: number) {
        super()
        this.gray = gray
    }

    toOp(): ContentOp {
        return SetFillColorGrayOp.create(this.gray)
    }
}

export class CMYKColor extends Color {
    c: number
    m: number
    y: number
    k: number

    constructor(c: number, m: number, y: number, k: number) {
        super()
        this.c = c
        this.m = m
        this.y = y
        this.k = k
    }

    toOp(): ContentOp {
        return SetFillColorCMYKOp.create(this.c, this.m, this.y, this.k)
    }
}
