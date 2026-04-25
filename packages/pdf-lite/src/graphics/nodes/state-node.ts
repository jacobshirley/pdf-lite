import { PdfPage } from '../../pdf/pdf-page'
import { ArraySegment } from '../../utils/arrays'
import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { ContentOp } from '../ops/base'
import { RestoreStateOp, SaveStateOp, SetMatrixOp } from '../ops/state'
import { RectangleOp, MoveToOp, LineToOp } from '../ops/path'
import { ContentNode } from './content-node'

export class StateNode extends ContentNode {
    protected children: ContentNode[] = []
    private readonly _directOps: ContentOp[] = []

    constructor(page?: PdfPage) {
        super(undefined, page)
    }

    addDirectOp(op: ContentOp): void {
        this._directOps.push(op)
    }

    get directOps(): readonly ContentOp[] {
        return this._directOps
    }

    getLocalTransform(): Matrix {
        let matrix = Matrix.identity()
        for (const op of this._directOps) {
            if (op instanceof SetMatrixOp) {
                matrix = matrix.multiply(op.matrix)
            }
        }
        return matrix
    }

    moveBy(dx: number, dy: number): void {
        for (const op of this._directOps) {
            if (op instanceof RectangleOp) {
                op.x += dx
                op.y += dy
            } else if (op instanceof MoveToOp || op instanceof LineToOp) {
                op.x += dx
                op.y += dy
            } else if (op instanceof SetMatrixOp) {
                op.e += dx
                op.f += dy
            }
        }
    }

    addChild(node: ContentNode): void {
        if (node.parent) {
            throw new Error('Node already has a parent')
        }
        node.parent = this
        this.children.push(node)
    }

    getChildren(): ContentNode[] {
        return this.children
    }

    getLocalBoundingBox(): Rect {
        if (this.children.length === 0) {
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
        }
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const child of this.children) {
            const bbox = child.getLocalBoundingBox()
            minX = Math.min(minX, bbox.x)
            minY = Math.min(minY, bbox.y)
            maxX = Math.max(maxX, bbox.x + bbox.width)
            maxY = Math.max(maxY, bbox.y + bbox.height)
        }
        return new Rect({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        })
    }

    override get ops(): ArraySegment<ContentOp> {
        const flat: ContentOp[] = [new SaveStateOp(), ...this._directOps]
        for (const child of this.children) {
            for (const op of child.ops) flat.push(op)
        }
        flat.push(new RestoreStateOp())
        this._ops.replaceAll(flat)
        return this._ops
    }

    override set ops(value: ContentOp[] | ArraySegment<ContentOp>) {
        const items = Array.isArray(value) ? value : [...value]
        this._ops.replaceAll(items)
    }
}
