import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { MoveToOp, LineToOp } from '../ops/path'
import { StrokeOp } from '../ops/paint'
import { SetLineWidthOp } from '../ops/state'
import { Color } from '../color'
import { ContentNode } from './content-node'

export class LineNode extends ContentNode {
    x1: number
    y1: number
    x2: number
    y2: number
    strokeColor?: Color
    strokeWidth?: number

    constructor(options: {
        x1: number
        y1: number
        x2: number
        y2: number
        strokeColor?: Color
        strokeWidth?: number
    }) {
        super()
        this.x1 = options.x1
        this.y1 = options.y1
        this.x2 = options.x2
        this.y2 = options.y2
        this.strokeColor = options.strokeColor
        this.strokeWidth = options.strokeWidth
    }

    getLocalTransform(): Matrix {
        return Matrix.identity()
    }

    getLocalBoundingBox(): Rect {
        return new Rect({
            x: Math.min(this.x1, this.x2),
            y: Math.min(this.y1, this.y2),
            width: Math.abs(this.x2 - this.x1),
            height: Math.abs(this.y2 - this.y1),
        })
    }

    moveBy(dx: number, dy: number): void {
        this.x1 += dx
        this.y1 += dy
        this.x2 += dx
        this.y2 += dy
    }

    moveEndpoint(endpointIndex: 0 | 1, dx: number, dy: number): void {
        if (endpointIndex === 0) {
            this.x1 += dx
            this.y1 += dy
        } else {
            this.x2 += dx
            this.y2 += dy
        }
    }

    override get ops() {
        const ops = []
        if (this.strokeWidth !== undefined) {
            ops.push(SetLineWidthOp.create(this.strokeWidth))
        }
        if (this.strokeColor) {
            ops.push(this.strokeColor.toStrokeOp())
        }
        ops.push(MoveToOp.create(this.x1, this.y1))
        ops.push(LineToOp.create(this.x2, this.y2))
        ops.push(new StrokeOp())
        this._ops.replaceAll(ops)
        return this._ops
    }
}
