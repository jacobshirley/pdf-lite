import { ContentOp } from '../ops/base'
import { SetFillColorRGBOp } from '../ops/color'
import { Color } from './color'

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
