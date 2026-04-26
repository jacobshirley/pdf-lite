import { ContentOp } from '../ops/base'
import { SetFillColorRGBOp, SetStrokeColorRGBOp } from '../ops/color'
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

    toFillOp(): ContentOp {
        return SetFillColorRGBOp.create(this.r, this.g, this.b)
    }

    toStrokeOp(): ContentOp {
        return SetStrokeColorRGBOp.create(this.r, this.g, this.b)
    }

    toHexString(): string {
        const rHex = Math.round(this.r * 255)
            .toString(16)
            .padStart(2, '0')
        const gHex = Math.round(this.g * 255)
            .toString(16)
            .padStart(2, '0')
        const bHex = Math.round(this.b * 255)
            .toString(16)
            .padStart(2, '0')
        return `#${rHex}${gHex}${bHex}`
    }
}
