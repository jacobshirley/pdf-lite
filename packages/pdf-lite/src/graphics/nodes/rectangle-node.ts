import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { RectangleOp } from '../ops/path'
import { FillOp, StrokeOp, FillAndStrokeOp } from '../ops/paint'
import { SetLineWidthOp } from '../ops/state'
import { Color } from '../color'
import { ContentNode } from './content-node'

export class RectangleNode extends ContentNode {
    x: number
    y: number
    width: number
    height: number
    fillColor?: Color
    strokeColor?: Color
    strokeWidth?: number

    constructor(options: {
        x: number
        y: number
        width: number
        height: number
        fillColor?: Color
        strokeColor?: Color
        strokeWidth?: number
    }) {
        super()
        this.x = options.x
        this.y = options.y
        this.width = options.width
        this.height = options.height
        this.fillColor = options.fillColor
        this.strokeColor = options.strokeColor
        this.strokeWidth = options.strokeWidth
    }

    getLocalTransform(): Matrix {
        return Matrix.identity()
    }

    getLocalBoundingBox(): Rect {
        return new Rect({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        })
    }

    moveBy(dx: number, dy: number): void {
        this.x += dx
        this.y += dy
    }

    setGeometry(x: number, y: number, width: number, height: number): void {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    override get ops() {
        const ops = []
        if (this.strokeWidth !== undefined) {
            ops.push(SetLineWidthOp.create(this.strokeWidth))
        }
        if (this.fillColor) {
            ops.push(this.fillColor.toFillOp())
        }
        if (this.strokeColor) {
            ops.push(this.strokeColor.toStrokeOp())
        }
        ops.push(RectangleOp.create(this.x, this.y, this.width, this.height))
        if (this.fillColor && this.strokeColor) {
            ops.push(new FillAndStrokeOp())
        } else if (this.fillColor) {
            ops.push(new FillOp())
        } else {
            ops.push(new StrokeOp())
        }
        this._ops.replaceAll(ops)
        return this._ops
    }
}
