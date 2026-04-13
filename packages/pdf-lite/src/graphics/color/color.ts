import { ContentOp } from '../ops/base'

export abstract class Color {
    abstract toOp(): ContentOp
    abstract toHexString(): string
}
