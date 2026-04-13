import { ContentOp } from '../ops/base'
import { SetFillColorCMYKOp } from '../ops/color'
import { Color } from './color'

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
