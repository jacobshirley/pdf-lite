import { ArraySegment } from '../../utils/arrays'
import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { ContentOp } from '../ops/base'
import {
    CurveToOp,
    CurveToV,
    CurveToY,
    LineToOp,
    MoveToOp,
    RectangleOp,
} from '../ops/path'
import { ContentNode } from './content-node'

export class RawShapeNode extends ContentNode {
    constructor(ops?: ContentOp[] | ArraySegment<ContentOp>) {
        super(ops)
    }

    getLocalTransform(): Matrix {
        return Matrix.identity()
    }

    getLocalBoundingBox(): Rect {
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        const track = (x: number, y: number) => {
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
        }

        for (const op of this._ops) {
            if (op instanceof MoveToOp || op instanceof LineToOp) {
                track(op.x, op.y)
            } else if (op instanceof RectangleOp) {
                track(op.x, op.y)
                track(op.x + op.width, op.y + op.height)
            } else if (op instanceof CurveToOp) {
                track(op.x1, op.y1)
                track(op.x2, op.y2)
                track(op.x3, op.y3)
            } else if (op instanceof CurveToV) {
                track(op.x2, op.y2)
                track(op.x3, op.y3)
            } else if (op instanceof CurveToY) {
                track(op.x1, op.y1)
                track(op.x3, op.y3)
            }
        }

        if (!isFinite(minX)) {
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
        }

        return new Rect({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        })
    }

    moveBy(dx: number, dy: number): void {
        for (const op of this._ops) {
            if (op instanceof MoveToOp || op instanceof LineToOp) {
                op.x += dx
                op.y += dy
            } else if (op instanceof RectangleOp) {
                op.x += dx
                op.y += dy
            } else if (op instanceof CurveToOp) {
                op.x1 += dx
                op.y1 += dy
                op.x2 += dx
                op.y2 += dy
                op.x3 += dx
                op.y3 += dy
            } else if (op instanceof CurveToV) {
                op.x2 += dx
                op.y2 += dy
                op.x3 += dx
                op.y3 += dy
            } else if (op instanceof CurveToY) {
                op.x1 += dx
                op.y1 += dy
                op.x3 += dx
                op.y3 += dy
            }
        }
    }
}
