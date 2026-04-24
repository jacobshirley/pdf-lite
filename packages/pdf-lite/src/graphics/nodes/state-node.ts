import { PdfPage } from '../../pdf/pdf-page'
import { ArraySegment } from '../../utils/arrays'
import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { ContentOp } from '../ops/base'
import { RestoreStateOp, SaveStateOp, SetMatrixOp } from '../ops/state'
import { ContentNode } from './content-node'

export class StateNode extends ContentNode {
    protected children: ContentNode[] = []

    constructor(page?: PdfPage) {
        super(undefined, page)
    }

    getLocalTransform(): Matrix {
        const lastCm = this.ops.findLast(
            (x: ContentOp) => x instanceof SetMatrixOp,
        )
        if (lastCm) return lastCm.matrix
        return Matrix.identity()
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
        const flat: ContentOp[] = [new SaveStateOp()]
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
