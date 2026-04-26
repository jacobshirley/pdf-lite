import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { MoveToOp, CurveToOp } from '../ops/path'
import { FillOp, StrokeOp, FillAndStrokeOp } from '../ops/paint'
import { SetLineWidthOp } from '../ops/state'
import { Color } from '../color'
import { ContentNode } from './content-node'

const KAPPA = 0.552284749831

export class EllipseNode extends ContentNode {
    cx: number
    cy: number
    radiusX: number
    radiusY: number
    fillColor?: Color
    strokeColor?: Color
    strokeWidth?: number

    constructor(options: {
        cx: number
        cy: number
        radiusX: number
        radiusY: number
        fillColor?: Color
        strokeColor?: Color
        strokeWidth?: number
    }) {
        super()
        this.cx = options.cx
        this.cy = options.cy
        this.radiusX = options.radiusX
        this.radiusY = options.radiusY
        this.fillColor = options.fillColor
        this.strokeColor = options.strokeColor
        this.strokeWidth = options.strokeWidth
    }

    getLocalTransform(): Matrix {
        return Matrix.identity()
    }

    getLocalBoundingBox(): Rect {
        return new Rect({
            x: this.cx - this.radiusX,
            y: this.cy - this.radiusY,
            width: this.radiusX * 2,
            height: this.radiusY * 2,
        })
    }

    moveBy(dx: number, dy: number): void {
        this.cx += dx
        this.cy += dy
    }

    setGeometry(
        cx: number,
        cy: number,
        radiusX: number,
        radiusY: number,
    ): void {
        this.cx = cx
        this.cy = cy
        this.radiusX = radiusX
        this.radiusY = radiusY
    }

    override get ops() {
        const { cx, cy, radiusX: rx, radiusY: ry } = this
        const kx = rx * KAPPA
        const ky = ry * KAPPA
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
        ops.push(MoveToOp.create(cx + rx, cy))
        ops.push(
            CurveToOp.create(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry),
        )
        ops.push(
            CurveToOp.create(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy),
        )
        ops.push(
            CurveToOp.create(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry),
        )
        ops.push(
            CurveToOp.create(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy),
        )
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
