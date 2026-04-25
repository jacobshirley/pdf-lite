import { PdfPage } from '../../pdf/pdf-page'
import { ContentOp } from '../ops/base'
import { InvokeXObjectOp } from '../ops/state'
import { Rect } from '../geom/rect'
import { ArraySegment } from '../../utils/arrays'
import { GraphicsBlock } from './graphics-block'
import { StateNode } from './state-node'

/**
 * Represents an XObject image invocation (Do), typically inside a
 * clipping state (q re W n q gs cm Do Q Q).
 *
 * The cm (CTM) lives on the parent StateNode as a directOp.
 * ImageNode only holds the Do invocation itself.
 */
export class ImageNode extends GraphicsBlock {
    constructor(page?: PdfPage, ops?: ContentOp[] | ArraySegment<ContentOp>) {
        super(page, ops)
    }

    private get invokeOp(): InvokeXObjectOp | undefined {
        for (const op of this.ops) {
            if (op instanceof InvokeXObjectOp) return op
        }
        return undefined
    }

    get name(): string {
        return this.invokeOp?.name ?? ''
    }

    override moveBy(dx: number, dy: number): void {
        // Delegate entirely to parent StateNode — it holds the cm and
        // will propagate up to move clip rects on ancestor StateNodes.
        if (this.parent instanceof StateNode) {
            this.parent.moveBy(dx, dy)
            if (this.parent.parent instanceof StateNode) {
                this.parent.parent.moveBy(dx, dy)
            }
        }
    }

    override getLocalBoundingBox(): Rect {
        // The parent StateNode's cm maps a unit square to the image
        // rectangle. Return the unit square here; getWorldBoundingBox()
        // applies the parent's transform (which includes cm) to get
        // the actual position.
        return new Rect({ x: 0, y: 0, width: 1, height: 1 })
    }
}
