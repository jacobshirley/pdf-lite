import { PdfPage } from '../../pdf/pdf-page'
import { ArraySegment, detachedSegment } from '../../utils/arrays'
import { Matrix } from '../geom/matrix'
import { Point } from '../geom/point'
import { Rect } from '../geom/rect'
import { ContentOp } from '../ops/base'

export abstract class ContentNode {
    _page?: PdfPage
    parent?: ContentNode
    protected _ops: ArraySegment<ContentOp>

    /**
     * Construct with either an existing segment (view over a stream) or a
     * plain array (detached — wrapped in a standalone MultiArray).
     */
    constructor(ops?: ArraySegment<ContentOp> | ContentOp[], page?: PdfPage) {
        if (ops instanceof ArraySegment) {
            this._ops = ops
        } else {
            this._ops = detachedSegment<ContentOp>(ops ?? [])
        }
        this._page = page
    }

    get ops(): ArraySegment<ContentOp> {
        return this._ops
    }

    /**
     * Replace the node's ops with the given list.  If the node is attached to
     * a stream, the stream's backing array is spliced — write-through.  If
     * detached, the standalone backing is simply repopulated.
     */
    set ops(value: ContentOp[] | ArraySegment<ContentOp>) {
        const items = Array.isArray(value) ? value : [...value]
        this._ops.replaceAll(items)
    }

    get page(): PdfPage | undefined {
        return this._page ?? this.parent?.page
    }

    set page(page: PdfPage | undefined) {
        if (this.parent?.page && page && this.parent.page !== page) {
            throw new Error(
                'Cannot set page on a node whose parent belongs to a different page',
            )
        }
        this._page = page
    }

    abstract getLocalTransform(): Matrix
    abstract getLocalBoundingBox(): Rect

    getWorldTransform(): Matrix {
        if (!this.parent) return this.getLocalTransform()
        return this.parent
            .getWorldTransform()
            .multiply(this.getLocalTransform())
    }

    getWorldBoundingBox(): Rect {
        const localBox = this.getLocalBoundingBox()
        const worldTransform = this.getWorldTransform()
        const topLeft = new Point({ x: localBox.x, y: localBox.y }).transform(
            worldTransform,
        )
        const topRight = new Point({
            x: localBox.x + localBox.width,
            y: localBox.y,
        }).transform(worldTransform)
        const bottomLeft = new Point({
            x: localBox.x,
            y: localBox.y + localBox.height,
        }).transform(worldTransform)
        const bottomRight = new Point({
            x: localBox.x + localBox.width,
            y: localBox.y + localBox.height,
        }).transform(worldTransform)

        const xs = [topLeft.x, topRight.x, bottomLeft.x, bottomRight.x]
        const ys = [topLeft.y, topRight.y, bottomLeft.y, bottomRight.y]
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        return new Rect({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        })
    }

    toString() {
        return [...this.ops].map((o) => o.toString()).join('\n')
    }

    replaceOrAddOp(op: ContentOp | undefined, newOp: ContentOp) {
        const idx = op ? this._ops.indexOf(op) : -1
        if (idx === -1) {
            this._ops.push(newOp)
            return
        }
        this._ops.splice(idx, 1, newOp)
    }

    addOp(op: ContentOp | ContentOp[], index?: number) {
        if (Array.isArray(op)) {
            if (index === undefined) {
                for (const item of op) this._ops.push(item)
            } else {
                this._ops.splice(index, 0, ...op)
            }
        } else {
            if (index === undefined) this._ops.push(op)
            else this._ops.splice(index, 0, op)
        }
    }

    /** Remove all ops matching `predicate` from the backing segment. */
    removeOpsWhere(predicate: (op: ContentOp) => boolean): void {
        this._ops.removeWhere(predicate)
    }

    /** Remove all ops from this node's segment. */
    clearOps(): void {
        this._ops.replaceAll([])
    }

    abstract moveBy(dx: number, dy: number): void
}
