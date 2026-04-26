import { ContentOp } from '../ops/base'

export abstract class Color {
    abstract toFillOp(): ContentOp
    abstract toStrokeOp(): ContentOp
    abstract toHexString(): string

    /** @deprecated Use toFillOp() instead */
    toOp(): ContentOp {
        return this.toFillOp()
    }
}
