import { PdfPage } from '../../pdf/pdf-page'
import { Color, RGBColor } from '../color'
import { StateNode } from './state-node'
import { LineNode } from './line-node'
import { RectangleNode } from './rectangle-node'
import { EllipseNode } from './ellipse-node'
import { RawShapeNode } from './raw-shape-node'
import { ContentNode } from './content-node'

export type GraphicsShapeNode =
    | LineNode
    | RectangleNode
    | EllipseNode
    | RawShapeNode

export class GraphicsBlock extends StateNode {
    constructor(page?: PdfPage) {
        super(page)
    }

    static line(options: {
        x1: number
        y1: number
        x2: number
        y2: number
        rgb?: [number, number, number]
        strokeWidth?: number
    }): GraphicsBlock {
        const block = new GraphicsBlock()
        const node = new LineNode({
            x1: options.x1,
            y1: options.y1,
            x2: options.x2,
            y2: options.y2,
            strokeColor: new RGBColor(
                options.rgb?.[0] ?? 0,
                options.rgb?.[1] ?? 0,
                options.rgb?.[2] ?? 0,
            ),
            strokeWidth: options.strokeWidth,
        })
        block.addChild(node)
        return block
    }

    static rectangle(options: {
        x: number
        y: number
        width: number
        height: number
        rgb?: [number, number, number]
        fill?: boolean
        strokeWidth?: number
    }): GraphicsBlock {
        const block = new GraphicsBlock()
        const color = new RGBColor(
            options.rgb?.[0] ?? 0,
            options.rgb?.[1] ?? 0,
            options.rgb?.[2] ?? 0,
        )
        const node = new RectangleNode({
            x: options.x,
            y: options.y,
            width: options.width,
            height: options.height,
            fillColor: options.fill ? color : undefined,
            strokeColor: options.fill ? undefined : color,
            strokeWidth: options.strokeWidth,
        })
        block.addChild(node)
        return block
    }

    static ellipse(options: {
        x: number
        y: number
        radiusX: number
        radiusY: number
        rgb?: [number, number, number]
        fill?: boolean
        strokeWidth?: number
    }): GraphicsBlock {
        const block = new GraphicsBlock()
        const color = new RGBColor(
            options.rgb?.[0] ?? 0,
            options.rgb?.[1] ?? 0,
            options.rgb?.[2] ?? 0,
        )
        const node = new EllipseNode({
            cx: options.x,
            cy: options.y,
            radiusX: options.radiusX,
            radiusY: options.radiusY,
            fillColor: options.fill ? color : undefined,
            strokeColor: options.fill ? undefined : color,
            strokeWidth: options.strokeWidth,
        })
        block.addChild(node)
        return block
    }

    static fromRawOps(page?: PdfPage, shapeNode?: ContentNode): GraphicsBlock {
        const block = new GraphicsBlock(page)
        if (shapeNode) block.addChild(shapeNode)
        return block
    }

    getShapeNode(): GraphicsShapeNode | undefined {
        return this.children.find(
            (c): c is GraphicsShapeNode =>
                c instanceof LineNode ||
                c instanceof RectangleNode ||
                c instanceof EllipseNode ||
                c instanceof RawShapeNode,
        )
    }

    getLineNode(): LineNode | undefined {
        return this.children.find((c): c is LineNode => c instanceof LineNode)
    }

    getRectangleNode(): RectangleNode | undefined {
        return this.children.find(
            (c): c is RectangleNode => c instanceof RectangleNode,
        )
    }

    getEllipseNode(): EllipseNode | undefined {
        return this.children.find(
            (c): c is EllipseNode => c instanceof EllipseNode,
        )
    }

    // --- Color / style accessors (delegate to typed child) ---

    get fillColor(): Color | undefined {
        const node = this.getShapeNode()
        if (node instanceof RectangleNode || node instanceof EllipseNode)
            return node.fillColor
        return undefined
    }

    set fillColor(color: Color | undefined) {
        const node = this.getShapeNode()
        if (node instanceof RectangleNode || node instanceof EllipseNode)
            node.fillColor = color
    }

    get strokeColor(): Color | undefined {
        const node = this.getShapeNode()
        if (
            node instanceof LineNode ||
            node instanceof RectangleNode ||
            node instanceof EllipseNode
        )
            return node.strokeColor
        return undefined
    }

    set strokeColor(color: Color | undefined) {
        const node = this.getShapeNode()
        if (
            node instanceof LineNode ||
            node instanceof RectangleNode ||
            node instanceof EllipseNode
        )
            node.strokeColor = color
    }

    get strokeWidth(): number | undefined {
        const node = this.getShapeNode()
        if (
            node instanceof LineNode ||
            node instanceof RectangleNode ||
            node instanceof EllipseNode
        )
            return node.strokeWidth
        return undefined
    }

    set strokeWidth(width: number | undefined) {
        const node = this.getShapeNode()
        if (
            node instanceof LineNode ||
            node instanceof RectangleNode ||
            node instanceof EllipseNode
        )
            node.strokeWidth = width
    }

    isFilled(): boolean | undefined {
        const node = this.getShapeNode()
        if (node instanceof RectangleNode || node instanceof EllipseNode) {
            if (node.fillColor && node.strokeColor) return true
            return !!node.fillColor
        }
        return undefined
    }

    // --- Geometry helpers ---

    getLinePoints(): { x1: number; y1: number; x2: number; y2: number } | null {
        const node = this.getLineNode()
        if (!node) return null
        return { x1: node.x1, y1: node.y1, x2: node.x2, y2: node.y2 }
    }

    moveLineEndpoint(endpointIndex: 0 | 1, dx: number, dy: number): void {
        this.getLineNode()?.moveEndpoint(endpointIndex, dx, dy)
    }

    setGeometry(x: number, y: number, width: number, height: number): void {
        const node = this.getShapeNode()
        if (node instanceof RectangleNode) {
            node.setGeometry(x, y, width, height)
        } else if (node instanceof EllipseNode) {
            node.setGeometry(
                x + width / 2,
                y + height / 2,
                width / 2,
                height / 2,
            )
        }
        // Lines are not resized via setGeometry
    }
}
