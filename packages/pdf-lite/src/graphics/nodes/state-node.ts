import { PdfPage } from '../../pdf/pdf-page'
import { Matrix } from '../geom/matrix'
import { Rect } from '../geom/rect'
import { ContentOp } from '../ops/base'
import { RestoreStateOp, SaveStateOp, SetMatrixOp } from '../ops/state'
import { ContentNode } from './content-node'

export class StateNode extends ContentNode {
    protected children: ContentNode[] = []

    constructor(page?: PdfPage) {
        super()
        this.page = page
    }

    getLocalTransform(): Matrix {
        const lastCm = this.ops.findLast((x) => x instanceof SetMatrixOp)
        if (lastCm) {
            return lastCm.matrix
        }

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

    get ops(): ContentOp[] {
        const ops: ContentOp[] = [new SaveStateOp()]
        for (const child of this.children) {
            ops.push(...child.ops)
        }
        ops.push(new RestoreStateOp())
        return ops
    }
}
