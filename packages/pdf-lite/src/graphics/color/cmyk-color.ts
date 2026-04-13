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

    toHexString(): string {
        const r = Math.round(255 * (1 - this.c) * (1 - this.k))
        const g = Math.round(255 * (1 - this.m) * (1 - this.k))
        const b = Math.round(255 * (1 - this.y) * (1 - this.k))
        const rHex = r.toString(16).padStart(2, '0')
        const gHex = g.toString(16).padStart(2, '0')
        const bHex = b.toString(16).padStart(2, '0')
        return `#${rHex}${gHex}${bHex}`
    }
}
