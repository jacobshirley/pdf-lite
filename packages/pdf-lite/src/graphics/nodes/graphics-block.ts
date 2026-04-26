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
import {
    CloseAndStrokeOp,
    CloseFillAndStrokeEvenOddOp,
    CloseFillAndStrokeOp,
    FillAlternateOp,
    FillAndStrokeEvenOddOp,
    FillAndStrokeOp,
    FillEvenOddOp,
    FillOp,
    StrokeOp,
} from '../ops/paint'
import {
    ColorOp,
    SetFillColorCMYKOp,
    SetFillColorGrayOp,
    SetFillColorRGBOp,
    SetStrokeColorCMYKOp,
    SetStrokeColorGrayOp,
    SetStrokeColorRGBOp,
} from '../ops/color'
import { Rect } from '../geom/rect'
import { ArraySegment } from '../../utils/arrays'
import { ContentNode } from './content-node'
import { Color, RGBColor } from '../color'
import { CMYKColor } from '../color/cmyk-color'
import { GrayColor } from '../color/gray-color'

export class GraphicsBlock extends ContentNode {
    constructor(page?: PdfPage, ops?: ContentOp[] | ArraySegment<ContentOp>) {
        super(ops, page)
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
        block.strokeColor = new RGBColor(
            rgb?.[0] ?? 0,
            rgb?.[1] ?? 0,
            rgb?.[2] ?? 0,
        )
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
        const color = new RGBColor(rgb?.[0] ?? 0, rgb?.[1] ?? 0, rgb?.[2] ?? 0)
        if (fill) {
            block.fillColor = color
        } else {
            block.strokeColor = color
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

        const color = new RGBColor(rgb?.[0] ?? 0, rgb?.[1] ?? 0, rgb?.[2] ?? 0)
        if (fill) {
            block.fillColor = color
        } else {
            block.strokeColor = color
        }
        return block
    }

    moveTo(x: number, y: number) {
        this._ops.push(MoveToOp.create(x, y))
    }

    lineTo(x: number, y: number) {
        this._ops.push(LineToOp.create(x, y))
    }

    get fillColor(): Color | undefined {
        for (const op of this.ops) {
            if (op instanceof SetFillColorRGBOp)
                return new RGBColor(op.r, op.g, op.b)
            if (op instanceof SetFillColorCMYKOp)
                return new CMYKColor(op.c, op.m, op.y, op.k)
            if (op instanceof SetFillColorGrayOp) return new GrayColor(op.gray)
        }
        return undefined
    }

    set fillColor(color: Color | undefined) {
        const ops = this.ops
        // Find existing fill color op index
        let idx = -1
        for (let i = 0; i < ops.length; i++) {
            if (
                ops[i] instanceof SetFillColorRGBOp ||
                ops[i] instanceof SetFillColorCMYKOp ||
                ops[i] instanceof SetFillColorGrayOp
            ) {
                idx = i
                break
            }
        }
        if (color) {
            const newOp = color.toFillOp()
            if (idx >= 0) {
                ops.splice(idx, 1, newOp)
            } else {
                ops.splice(0, 0, newOp)
            }
        } else if (idx >= 0) {
            ops.splice(idx, 1)
        }
        this.updatePaintOp()
    }

    get strokeColor(): Color | undefined {
        for (const op of this.ops) {
            if (op instanceof SetStrokeColorRGBOp)
                return new RGBColor(op.r, op.g, op.b)
            if (op instanceof SetStrokeColorCMYKOp)
                return new CMYKColor(op.c, op.m, op.y, op.k)
            if (op instanceof SetStrokeColorGrayOp)
                return new GrayColor(op.gray)
        }
        return undefined
    }

    set strokeColor(color: Color | undefined) {
        const ops = this.ops
        // Find existing stroke color op index
        let idx = -1
        for (let i = 0; i < ops.length; i++) {
            if (
                ops[i] instanceof SetStrokeColorRGBOp ||
                ops[i] instanceof SetStrokeColorCMYKOp ||
                ops[i] instanceof SetStrokeColorGrayOp
            ) {
                idx = i
                break
            }
        }
        if (color) {
            const newOp = color.toStrokeOp()
            if (idx >= 0) {
                ops.splice(idx, 1, newOp)
            } else {
                ops.splice(0, 0, newOp)
            }
        } else if (idx >= 0) {
            ops.splice(idx, 1)
        }
        this.updatePaintOp()
    }

    isFilled(): boolean | undefined {
        for (const op of this.ops) {
            if (
                op instanceof FillOp ||
                op instanceof FillAlternateOp ||
                op instanceof FillEvenOddOp ||
                op instanceof FillAndStrokeOp ||
                op instanceof FillAndStrokeEvenOddOp ||
                op instanceof CloseFillAndStrokeOp ||
                op instanceof CloseFillAndStrokeEvenOddOp
            )
                return true
            if (op instanceof StrokeOp || op instanceof CloseAndStrokeOp)
                return false
        }
        return undefined
    }

    private isPaintOp(op: ContentOp): boolean {
        return (
            op instanceof FillOp ||
            op instanceof FillAlternateOp ||
            op instanceof FillEvenOddOp ||
            op instanceof StrokeOp ||
            op instanceof CloseAndStrokeOp ||
            op instanceof FillAndStrokeOp ||
            op instanceof FillAndStrokeEvenOddOp ||
            op instanceof CloseFillAndStrokeOp ||
            op instanceof CloseFillAndStrokeEvenOddOp
        )
    }

    private updatePaintOp(): void {
        const ops = this.ops
        const hasFill = this.fillColor !== undefined
        const hasStroke = this.strokeColor !== undefined
        let newPaintOp: ContentOp | undefined
        if (hasFill && hasStroke) {
            newPaintOp = new FillAndStrokeOp()
        } else if (hasFill) {
            newPaintOp = new FillOp()
        } else if (hasStroke) {
            newPaintOp = new StrokeOp()
        }

        // Find existing paint op and replace/remove it
        let paintIdx = -1
        for (let i = ops.length - 1; i >= 0; i--) {
            if (this.isPaintOp(ops[i])) {
                paintIdx = i
                break
            }
        }

        if (paintIdx >= 0) {
            if (newPaintOp) {
                ops.splice(paintIdx, 1, newPaintOp)
            } else {
                ops.splice(paintIdx, 1)
            }
        } else if (newPaintOp) {
            ops.push(newPaintOp)
        }
    }

    resizeTo(newWidth: number, newHeight: number): void {
        const bbox = this.getLocalBoundingBox()
        if (bbox.width <= 0 || bbox.height <= 0) return
        const sx = newWidth / bbox.width
        const sy = newHeight / bbox.height
        const ox = bbox.x
        const oy = bbox.y

        for (const op of this.ops) {
            if (op instanceof MoveToOp || op instanceof LineToOp) {
                op.x = ox + (op.x - ox) * sx
                op.y = oy + (op.y - oy) * sy
            } else if (op instanceof RectangleOp) {
                op.x = ox + (op.x - ox) * sx
                op.y = oy + (op.y - oy) * sy
                op.width = op.width * sx
                op.height = op.height * sy
            } else if (op instanceof CurveToOp) {
                op.x1 = ox + (op.x1 - ox) * sx
                op.y1 = oy + (op.y1 - oy) * sy
                op.x2 = ox + (op.x2 - ox) * sx
                op.y2 = oy + (op.y2 - oy) * sy
                op.x3 = ox + (op.x3 - ox) * sx
                op.y3 = oy + (op.y3 - oy) * sy
            } else if (op instanceof CurveToV) {
                op.x2 = ox + (op.x2 - ox) * sx
                op.y2 = oy + (op.y2 - oy) * sy
                op.x3 = ox + (op.x3 - ox) * sx
                op.y3 = oy + (op.y3 - oy) * sy
            } else if (op instanceof CurveToY) {
                op.x1 = ox + (op.x1 - ox) * sx
                op.y1 = oy + (op.y1 - oy) * sy
                op.x3 = ox + (op.x3 - ox) * sx
                op.y3 = oy + (op.y3 - oy) * sy
            }
        }
    }

    moveBy(dx: number, dy: number): void {
        for (const op of this.ops) {
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
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
        }

        return new Rect({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        })
    }
}
