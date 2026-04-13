import { PdfPage } from '../../pdf/pdf-page'
import { Matrix } from '../geom/matrix'
import { ContentOp } from '../ops/base'
import {
    ClosePathOp,
    CurveToOp,
    CurveToV,
    CurveToY,
    LineToOp,
    MoveToOp,
    RectangleOp,
} from '../ops/path'
import { FillOp, StrokeOp } from '../ops/paint'
import { SetFillColorRGBOp, SetStrokeColorRGBOp } from '../ops/color'
import { BoundingBox } from './bounding-box'
import { ContentNode } from './content-node'

export class GraphicsBlock extends ContentNode {
    constructor(page?: PdfPage, ops?: ContentOp[]) {
        super(ops)
        this.page = page
    }

    static line(options: {
        x1: number
        y1: number
        x2: number
        y2: number
        rgb?: [number, number, number]
    }): GraphicsBlock {
        const { x1, y1, x2, y2, rgb } = options
        const block = new GraphicsBlock()
        block.moveTo(x1, y1)
        block.lineTo(x2, y2)
        if (rgb) {
            block.rgb(...rgb)
        }
        block.stroke()
        return block
    }

    static rectangle(options: {
        x: number
        y: number
        width: number
        height: number
        rgb?: [number, number, number]
        fill?: boolean
    }): GraphicsBlock {
        const { x, y, width, height, rgb, fill } = options
        const block = new GraphicsBlock()
        block.moveTo(x, y)
        block.lineTo(x + width, y)
        block.lineTo(x + width, y + height)
        block.lineTo(x, y + height)
        block.lineTo(x, y)
        if (rgb) {
            block.rgb(...rgb)
        }
        if (fill) {
            block.fill()
        } else {
            block.stroke()
        }
        return block
    }

    static ellipse(options: {
        x: number
        y: number
        radiusX: number
        radiusY: number
        rgb?: [number, number, number]
        fill?: boolean
    }): GraphicsBlock {
        const { x, y, radiusX, radiusY, rgb, fill } = options
        const block = new GraphicsBlock()
        // Approximate ellipse with Bezier curves
        const kappa = 0.552284749831
        const controlX = radiusX * kappa
        const controlY = radiusY * kappa

        block.moveTo(x + radiusX, y)
        block.lineTo(x + radiusX, y + controlY)
        block.lineTo(x + controlX, y + radiusY)
        block.lineTo(x, y + radiusY)
        block.lineTo(x - controlX, y + radiusY)
        block.lineTo(x - radiusX, y + controlY)
        block.lineTo(x - radiusX, y)
        block.lineTo(x - radiusX, y - controlY)
        block.lineTo(x - controlX, y - radiusY)
        block.lineTo(x, y - radiusY)
        block.lineTo(x + controlX, y - radiusY)
        block.lineTo(x + radiusX, y - controlY)
        block.lineTo(x + radiusX, y)

        if (rgb) {
            block.rgb(...rgb)
        }
        if (fill) {
            block.fill()
        } else {
            block.stroke()
        }
        return block
    }

    moveTo(x: number, y: number) {
        this.ops.push(MoveToOp.create(x, y))
    }

    lineTo(x: number, y: number) {
        this.ops.push(LineToOp.create(x, y))
    }

    stroke() {
        this.ops.push(new StrokeOp())
    }

    fill() {
        this.ops.push(new FillOp())
    }

    rgb(r: number, g: number, b: number) {
        this.ops.push(SetStrokeColorRGBOp.create(r, g, b))
        this.ops.push(SetFillColorRGBOp.create(r, g, b))
    }

    getLocalTransform(): Matrix {
        return Matrix.identity()
    }

    getLocalBoundingBox(): BoundingBox {
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

        for (const op of this.ops) {
            if (op instanceof MoveToOp || op instanceof LineToOp) {
                track(op.x, op.y)
                continue
            }

            if (op instanceof RectangleOp) {
                track(op.x, op.y)
                track(op.x + op.width, op.y + op.height)
                continue
            }

            if (op instanceof CurveToOp) {
                track(op.x1, op.y1)
                track(op.x2, op.y2)
                track(op.x3, op.y3)
                continue
            }

            if (op instanceof CurveToV) {
                track(op.x2, op.y2)
                track(op.x3, op.y3)
                continue
            }

            if (op instanceof CurveToY) {
                track(op.x1, op.y1)
                track(op.x3, op.y3)
                continue
            }
        }

        if (!isFinite(minX)) {
            return { x: 0, y: 0, width: 0, height: 0 }
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        }
    }
}
