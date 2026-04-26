import { ContentOp } from '../ops/base'
import { SetFillColorGrayOp, SetStrokeColorGrayOp } from '../ops/color'
import { Color } from './color'

export class GrayColor extends Color {
    gray: number

    constructor(gray: number) {
        super()
        this.gray = gray
    }

    toFillOp(): ContentOp {
        return SetFillColorGrayOp.create(this.gray)
    }

    toStrokeOp(): ContentOp {
        return SetStrokeColorGrayOp.create(this.gray)
    }

    toHexString(): string {
        const grayValue = Math.round(this.gray * 255)
        const hex = grayValue.toString(16).padStart(2, '0')
        return `#${hex}${hex}${hex}`
    }
}
