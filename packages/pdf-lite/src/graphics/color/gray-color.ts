import { ContentOp } from '../ops/base'
import { SetFillColorGrayOp } from '../ops/color'
import { Color } from './color'

export class GrayColor extends Color {
    gray: number

    constructor(gray: number) {
        super()
        this.gray = gray
    }

    toOp(): ContentOp {
        return SetFillColorGrayOp.create(this.gray)
    }

    toHexString(): string {
        const grayValue = Math.round(this.gray * 255)
        const hex = grayValue.toString(16).padStart(2, '0')
        return `#${hex}${hex}${hex}`
    }
}
