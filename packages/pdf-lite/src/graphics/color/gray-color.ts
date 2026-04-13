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
}
