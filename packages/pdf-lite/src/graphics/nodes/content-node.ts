import { PdfPage } from '../../pdf/pdf-page'
import { Matrix } from '../geom/matrix'
import { Point } from '../geom/point'
import { Rect } from '../geom/rect'
import { ContentOp } from '../ops/base'

export abstract class ContentNode {
    _page?: PdfPage
    parent?: ContentNode
    private _ops: ContentOp[]

    constructor(ops?: ContentOp[], page?: PdfPage) {
        this._ops = ops ?? []
        this._page = page
    }

    get ops(): ContentOp[] {
        return this._ops
    }

    set ops(value: ContentOp[]) {
        this._ops = value
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
        return this.ops.map((o) => o.toString()).join('\n')
    }
}
