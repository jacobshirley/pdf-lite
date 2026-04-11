import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfHexadecimal, PdfString } from '../core'
import { PdfPage } from '../pdf/pdf-page'
import { Matrix } from './geom/matrix'
import { Point } from './geom/point'
import { ByteArray } from '../types'
import { stringToBytes } from '../utils'
import { ContentOp } from './ops/base'
import {
    BeginTextOp,
    EndTextOp,
    SetFontOp,
    SetTextMatrixOp,
    MoveTextOp,
    MoveTextLeadingOp,
    NextLineOp,
    ShowTextOp,
    ShowTextArrayOp,
    SetCharSpacingOp,
    SetWordSpacingOp,
    ShowTextNextLineOp,
    ShowTextNextLineSpacingOp,
    SetHorizontalScalingOp,
    SetTextLeadingOp,
    SetTextRenderingModeOp,
    SetTextRiseOp,
    TextOp,
} from './ops/text'
import {
    MoveToOp,
    LineToOp,
    CurveToOp,
    CurveToV,
    CurveToY,
    RectangleOp,
    ClosePathOp,
    PathOp,
} from './ops/path'
import {
    StrokeOp,
    CloseAndStrokeOp,
    FillOp,
    FillAlternateOp,
    FillEvenOddOp,
    FillAndStrokeOp,
    CloseFillAndStrokeOp,
    FillAndStrokeEvenOddOp,
    CloseFillAndStrokeEvenOddOp,
    EndPathOp,
    ClipOp,
    ClipEvenOddOp,
    PaintOp,
} from './ops/paint'
import {
    SetFillColorRGBOp,
    SetStrokeColorRGBOp,
    SetFillColorGrayOp,
    SetStrokeColorGrayOp,
    SetFillColorCMYKOp,
    SetStrokeColorCMYKOp,
    SetFillColorSpaceOp,
    SetStrokeColorSpaceOp,
    SetFillColorOp,
    SetStrokeColorOp,
    SetFillColorExtOp,
    SetStrokeColorExtOp,
    ColorOp,
} from './ops/color'
import {
    SaveStateOp,
    RestoreStateOp,
    SetMatrixOp,
    SetLineWidthOp,
    SetLineCapOp,
    SetLineJoinOp,
    SetMiterLimitOp,
    SetDashPatternOp,
    SetRenderingIntentOp,
    SetFlatnessOp,
    SetGraphicsStateOp,
    InvokeXObjectOp,
    StateOp,
} from './ops/state'
import { PdfContentStreamTokeniser } from './tokeniser'

export abstract class ContentNode {
    _page?: PdfPage
    parent?: ContentNode
    ops: ContentOp[]

    constructor(ops?: ContentOp[], page?: PdfPage) {
        this.ops = ops ?? []
        this._page = page
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
    abstract getLocalBoundingBox(): BoundingBox

    getWorldTransform(): Matrix {
        if (!this.parent) return this.getLocalTransform()
        return this.parent
            .getWorldTransform()
            .multiply(this.getLocalTransform())
    }

    getWorldBoundingBox(): BoundingBox {
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

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        }
    }

    toString() {
        return this.ops.toString()
    }
}

export class Text extends ContentNode {
    prev?: Text

    get text(): string {
        const lastTj = this.ops.find((x) => x instanceof ShowTextOp)
        if (lastTj) {
            return lastTj.text
        } else {
            const lastTJ = this.ops.find((x) => x instanceof ShowTextArrayOp)
            if (lastTJ) {
                return lastTJ.text
            }
        }

        const lastQuote = this.ops.find((x) => x instanceof ShowTextNextLineOp)
        if (lastQuote) {
            return lastQuote.text
        }

        const lastDblQuote = this.ops.find(
            (x) => x instanceof ShowTextNextLineSpacingOp,
        )
        if (lastDblQuote) {
            return lastDblQuote.text
        }

        return ''
    }

    get font(): PdfFont {
        const defaultFont = PdfFont.HELVETICA
        const lastTf = this.ops.find((x) => x instanceof SetFontOp)

        if (lastTf) {
            const fontName = lastTf.fontName
            return this.page?.fontMap.get(fontName) ?? defaultFont
        }

        return this.prev?.font ?? defaultFont
    }

    set font(font: PdfFont) {
        const size = this.fontSize
        const tfOp = this.ops.find((x) => x instanceof SetFontOp)
        if (!tfOp) {
            const newTfOp = SetFontOp.create(font.resourceName, size)
            this.ops.unshift(newTfOp)
        } else {
            tfOp.fontName = font.resourceName
        }
    }

    get charSpace(): number {
        const lastTc = this.ops.findLast((x) => x instanceof SetCharSpacingOp)
        if (lastTc) {
            return lastTc.charSpace
        }
        return this.prev?.charSpace ?? 0
    }

    get wordSpace(): number {
        const lastTw = this.ops.findLast((x) => x instanceof SetWordSpacingOp)
        if (lastTw) {
            return lastTw.wordSpace
        }

        return this.prev?.wordSpace ?? 0
    }

    get fontSize(): number {
        const lastTf = this.ops.findLast((x) => x instanceof SetFontOp)
        if (lastTf) {
            return lastTf.fontSize
        }

        return this.prev?.fontSize ?? 12
    }

    set fontSize(size: number) {
        const fontName = this.font.resourceName
        const tfOp = this.ops.find((x) => x instanceof SetFontOp)
        if (!tfOp) {
            const newTfOp = SetFontOp.create(fontName, size)
            this.ops.unshift(newTfOp)
        } else {
            tfOp.fontSize = size
        }
    }

    get textLeading(): number {
        const lastTL = this.ops.findLast((x) => x instanceof SetTextLeadingOp)
        if (lastTL) {
            return lastTL.leading
        }
        // TD also sets TL = -ty (PDF spec Table 108)
        const lastTD = this.ops.findLast((x) => x instanceof MoveTextLeadingOp)
        if (lastTD) {
            return -lastTD.y
        }
        return this.prev?.textLeading ?? 0
    }

    /**
     * Produces a Tj or TJ content stream operator for the given text.
     * Uses the TJ operator with kern adjustments when kern data is available,
     * otherwise falls back to a simple Tj.
     *
     * The returned string is ready to be inserted into a content stream, e.g.:
     * ```
     * BT /F1 12 Tf 100 700 Td <TJ output> ET
     * ```
     *
     * @param text - The text to render
     * @returns A string like `(Hello) Tj` or `[(H) 40 (ello)] TJ`
     */
    writeContentStreamText(text: string): ContentOp {
        const m = this.font.metrics
        const hasKern = m.kernPairs.length > 0

        if (!hasKern || text.length <= 1) {
            return new ShowTextOp(`${this.encodeOperand(text)} Tj`)
        }

        // Build TJ array: split at kern boundaries
        type TJEntry = { text: string } | { kern: number }
        const entries: TJEntry[] = []
        let run = ''

        const chars = [...text]
        for (let i = 0; i < chars.length; i++) {
            run += chars[i]

            if (i < chars.length - 1) {
                const leftCode = chars[i].codePointAt(0)!
                const rightCode = chars[i + 1].codePointAt(0)!
                const leftName = m.getGlyphMetrics(leftCode)?.name
                const rightName = m.getGlyphMetrics(rightCode)?.name

                if (leftName && rightName) {
                    const kern = m.getKernAdjustment(leftName, rightName)
                    if (kern !== 0) {
                        entries.push({ text: run })
                        // PDF TJ kern values: positive moves left (tightens),
                        // AFM dx is negative for tightening, so negate
                        entries.push({ kern: -kern })
                        run = ''
                    }
                }
            }
        }

        if (run) {
            entries.push({ text: run })
        }

        // If no kern was actually applied, use simple Tj
        if (entries.length === 1 && 'text' in entries[0]) {
            return new ShowTextOp(`${this.encodeOperand(entries[0].text)} Tj`)
        }

        const parts = entries.map((e) => {
            if ('kern' in e) return String(e.kern)
            return this.encodeOperand(e.text)
        })

        return new ShowTextArrayOp(`[${parts.join(' ')}] TJ`)
    }

    /**
     * Encodes text as a PDF string operand for use in content streams.
     * Returns `(escaped text)` for literal strings or `<hex>` for hex strings.
     */
    private encodeOperand(text: string): string {
        const encoded = this.font.encode(text)
        if (encoded instanceof PdfHexadecimal) {
            return `<${encoded.hexString}>`
        }
        // PdfString — escape special chars for PDF literal string
        const val = encoded.value
        const escaped = val
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
        return `(${escaped})`
    }

    set text(newText: string) {
        const newTextOp = this.writeContentStreamText(newText)
        const textOpIndex = this.ops.findLastIndex(
            (x) => x instanceof ShowTextOp || x instanceof ShowTextArrayOp,
        )
        if (textOpIndex !== -1) {
            this.ops[textOpIndex] = newTextOp
        } else {
            this.ops.push(newTextOp)
        }
    }

    /**
     * Compute the text-space advance width of this segment's show operator.
     * After Tj/TJ, the text position advances by this amount.
     *
     * For Tj: sum of glyph widths, plus Tc per glyph and Tw per space.
     * For TJ: same, summed across string segments, with each numeric
     *   segment `n` contributing `-n/1000 * fontSize` (per PDF spec).
     */
    getTextAdvance(): number {
        const fontSize = this.fontSize
        const font = this.font
        const tc = this.charSpace
        const tw = this.wordSpace

        const measure = (text: string): number => {
            let total = 0
            for (const ch of [...text]) {
                total +=
                    font.getCharacterWidth(ch.charCodeAt(0), fontSize) ??
                    fontSize * 0.6
                total += tc
                if (ch === ' ') total += tw
            }
            return total
        }

        let total = 0
        let sawShowOp = false

        for (const op of this.ops) {
            if (op instanceof ShowTextOp) {
                sawShowOp = true
                total += measure(op.text)
            } else if (op instanceof ShowTextArrayOp) {
                sawShowOp = true
                for (const segment of op.segments) {
                    if (typeof segment === 'number') {
                        // TJ numeric entries are kern adjustments in
                        // thousandths of a unit of text space — they
                        // *reduce* the advance.
                        total -= (segment / 1000) * fontSize
                    } else {
                        total += measure(font.decode(segment))
                    }
                }
            }
        }

        if (sawShowOp) return total

        // Fallback for segments without an explicit show op: estimate from
        // `this.text` using a rough average glyph width.
        if (this.text) {
            return this.text.length * fontSize * 0.6
        }
        return 0
    }

    /**
     * Resolve the text matrix (Tm) and text line matrix (Tlm) at the START
     * of this segment's text rendering.
     * - Tm: the actual position where glyphs are placed
     * - Tlm: the base for Td/TD/T* calculations (not advanced by text rendering)
     */
    private resolveTextState(): { tm: Matrix; tlm: Matrix } {
        let tm: Matrix
        let tlm: Matrix

        if (this.prev) {
            // After prev rendered text, Tm advanced by text width.
            // Tlm stays wherever prev's positioning ops left it.
            const prevState = this.prev.resolveTextState()
            const prevAdvance = this.prev.getTextAdvance()
            tm = prevState.tm.translate(prevAdvance, 0)
            tlm = prevState.tlm
        } else {
            tm = Matrix.identity()
            tlm = Matrix.identity()
        }

        // Process positioning operators in this segment
        for (const op of this.ops) {
            if (op instanceof SetTextMatrixOp) {
                // Tm is absolute — sets both Tm and Tlm
                const m = op.matrix
                tm = m
                tlm = m
            } else if (op instanceof MoveTextOp) {
                tlm = tlm.translate(op.x, op.y)
                tm = tlm
            } else if (op instanceof MoveTextLeadingOp) {
                tlm = tlm.translate(op.x, op.y)
                tm = tlm
            } else if (
                op instanceof NextLineOp ||
                op instanceof ShowTextNextLineOp
            ) {
                // Move to next line: Tlm += (0, -TL), Tm = Tlm
                const tl = this.textLeading
                tlm = tlm.translate(0, -tl)
                tm = tlm
            } else if (op instanceof ShowTextNextLineSpacingOp) {
                // Move to next line with extra spacing: Tlm += (0, -TL - leading), Tm = Tlm
                const tl = this.textLeading
                tlm = tlm.translate(0, -tl - op.extraLeading)
                tm = tlm
            } else if (op instanceof SetTextLeadingOp) {
                // If TL changes mid-line, it affects subsequent T*, Td, TD
                tlm = tlm.translate(0, -op.leading)
                tm = tlm
            }
        }

        return { tm, tlm }
    }

    getLocalTransform(): Matrix {
        return this.resolveTextState().tm
    }

    getLocalBoundingBox(): BoundingBox {
        const fontSize = this.fontSize
        const descenderHeight = fontSize * 0.3
        const ascenderHeight = fontSize * 0.95
        const textWidth = this.getTextAdvance()

        return {
            x: 0,
            y: -descenderHeight,
            width: textWidth,
            height: ascenderHeight + descenderHeight,
        }
    }
}

export class TextBlock extends ContentNode {
    protected segments: Text[] = []

    constructor(page?: PdfPage, ops?: ContentOp[]) {
        super(ops)
        this.page = page
    }

    getSegments() {
        return this.segments
    }

    addSegment(segment: Text): void {
        segment.parent = this
        segment.prev = this.segments[this.segments.length - 1]
        this.segments.push(segment)
    }

    get text(): string {
        return this.segments.map((l) => l.text).join('')
    }

    getLocalTransform(): Matrix {
        // TextBlock is just a container; segments carry their own transforms
        return Matrix.identity()
    }

    getLocalBoundingBox(): BoundingBox {
        if (this.segments.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 }
        }

        // Each Text segment has its own transform (Tm/Td).
        // We compute each segment's bbox in user space, then
        // express the union relative to this block's own transform.
        const blockTm = this.getLocalTransform()

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const seg of this.segments) {
            const segTm = seg.getLocalTransform()
            const segBbox = seg.getLocalBoundingBox()

            // Transform the 4 corners of the segment's local bbox
            // into user space via the segment's own Tm
            const corners = [
                new Point({ x: segBbox.x, y: segBbox.y }),
                new Point({ x: segBbox.x + segBbox.width, y: segBbox.y }),
                new Point({ x: segBbox.x, y: segBbox.y + segBbox.height }),
                new Point({
                    x: segBbox.x + segBbox.width,
                    y: segBbox.y + segBbox.height,
                }),
            ]

            for (const corner of corners) {
                // Transform to user space
                const userPt = corner.transform(segTm)
                minX = Math.min(minX, userPt.x)
                minY = Math.min(minY, userPt.y)
                maxX = Math.max(maxX, userPt.x)
                maxY = Math.max(maxY, userPt.y)
            }
        }

        // Convert from user space back to block-local space
        // by inverse-transforming through the block's Tm
        const xScale = Math.abs(blockTm.a) || 1
        const yScale = Math.abs(blockTm.d) || 1

        return {
            x: (minX - blockTm.e) / xScale,
            y: (minY - blockTm.f) / yScale,
            width: (maxX - minX) / xScale,
            height: (maxY - minY) / yScale,
        }
    }

    set text(newText: string) {
        if (this.segments.length === 0) {
            const text = new Text([], this.page)
            text.font = PdfFont.HELVETICA
            text.fontSize = 12
            text.text = newText
            this.addSegment(text)
            return
        }

        const firstSeg = this.segments[0]
        const textOp = firstSeg.writeContentStreamText(newText)
        let textOpIndex = firstSeg.ops.findIndex(
            (x) => x instanceof ShowTextOp || x instanceof ShowTextArrayOp,
        )

        const newOps = firstSeg.ops.slice(0, textOpIndex).concat([textOp])
        firstSeg.ops = newOps
        this.segments.splice(1)
    }

    /**
     * Move this TextBlock by shifting the Tm of every segment by (dx, dy)
     * in user-space coordinates.
     */
    moveBy(dx: number, dy: number): void {
        // Pre-resolve all positions BEFORE modifying any segment.
        // Otherwise, modifying segment N shifts its Tm, and segment N+1's
        // resolveTextState() follows the prev chain to the already-shifted N,
        // causing double-shifting and characters spreading apart.
        const resolved = this.segments.map((seg) => {
            const hasTm = seg.ops.some((x) => x instanceof SetTextMatrixOp)

            return { hasTm, tm: hasTm ? null : seg.getLocalTransform() }
        })

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i]
            const { hasTm, tm } = resolved[i]
            const newOps: string[] = []

            const tmOps = seg.ops.filter((o) => o instanceof SetTextMatrixOp)
            for (const op of tmOps) {
                op.matrix = op.matrix.translate(dx, dy)
            }

            if (!hasTm) {
                seg.ops = seg.ops.filter(
                    (o) =>
                        !(o instanceof MoveTextOp) &&
                        !(o instanceof MoveTextLeadingOp) &&
                        !(o instanceof NextLineOp),
                )
            }
        }
    }

    static regroupTextBlocks(blocks: TextBlock[]): TextBlock[] {}
}

export class GraphicsBlock extends ContentNode {
    constructor(page?: PdfPage, ops?: ContentOp[]) {
        super(ops)
        this.page = page
    }

    toString(): string {
        return this.ops.toString()
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

export class PdfContentStream extends PdfStream {
    nodes: ContentNode[]
    page?: PdfPage

    constructor(rawData?: ByteArray) {
        super(rawData)
        this.nodes = this.parseNodes()
    }

    protected getRawData(): ByteArray | undefined {
        if (this.nodes === undefined) return undefined
        const contentString = this.nodes.map((n) => n.toString()).join('\n')
        return stringToBytes(contentString)
    }

    private parseNodes(): ContentNode[] {
        const contentString = this.dataAsString
        if (!contentString) return []

        const ops = PdfContentStreamTokeniser.tokenise(contentString)
        return PdfContentStream.buildNodeTree(ops).getChildren()
    }

    static buildNodeTree(ops: ContentOp[], page?: PdfPage): StateNode {
        const root = new StateNode(page)
        const stateStack: StateNode[] = []

        let textOps: TextOp[] = []
        let graphicsOps: (PaintOp | PathOp | ColorOp)[] = []
        let currentState: StateNode = root

        for (const op of ops) {
            if (op instanceof BeginTextOp) {
                textOps.push(op)
            }

            if (op instanceof EndTextOp) {
                currentState.addChild(new TextBlock(page, textOps))
                textOps = []
                continue
            }

            if (op instanceof SaveStateOp) {
                const group = new StateNode(page)
                currentState.addChild(group)
                stateStack.push(currentState)
                currentState = group
                continue
            }

            if (op instanceof RestoreStateOp) {
                if (stateStack.length > 0) {
                    currentState = stateStack.pop()!
                }
                continue
            }

            if (op instanceof StateOp) {
                currentState.ops.push(op)
                continue
            }

            // Outside text block: graphics
            if (op instanceof PaintOp) {
                graphicsOps.push(op)
                const gBlock = new GraphicsBlock(page, graphicsOps)
                currentState.addChild(gBlock)
                graphicsOps = []
            } else if (
                op instanceof PathOp ||
                op instanceof ColorOp ||
                op instanceof ClipOp ||
                op instanceof ClipEvenOddOp
            ) {
                graphicsOps.push(op)
            } else if (op instanceof EndPathOp) {
                graphicsOps = []
            }
        }

        return root
    }
}

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

    getLocalBoundingBox(): BoundingBox {
        if (this.children.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 }
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

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }

    toString(): string {
        const parts: string[] = ['q']
        const lt = this.getLocalTransform()
        const isIdentity = lt.isIdentity()

        if (!isIdentity) {
            parts.push(`${lt.a} ${lt.b} ${lt.c} ${lt.d} ${lt.e} ${lt.f} cm`)
        }

        for (const child of this.children) {
            parts.push(child.toString())
        }

        parts.push('Q')
        return parts.join('\n')
    }
}

export type BoundingBox = {
    x: number
    y: number
    width: number
    height: number
}

export class PdfContentStreamObject extends PdfIndirectObject<PdfContentStream> {
    static ContentNode = ContentNode
    static StateNode = StateNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    page?: PdfPage

    constructor(object?: PdfIndirectObject<PdfStream>) {
        super(object)
        this.content = new PdfContentStream(object?.content?.raw)
    }

    textBlock(): TextBlock {
        const block = new TextBlock(this.page)
        return block
    }

    graphicsBlock(): GraphicsBlock {
        const block = new GraphicsBlock()
        block.page = this.page
        return block
    }

    add(node: ContentNode) {
        this.content.dataAsString += node.toString() + '\n'
    }

    get dataAsString(): string {
        return this.content.dataAsString
    }

    set dataAsString(value: string) {
        this.content.dataAsString = value
    }

    get nodes(): ContentNode[] {
        return this.content.nodes
    }

    get textBlocks(): TextBlock[] {
        const collect = (nodes: ContentNode[]): TextBlock[] => {
            const result: TextBlock[] = []
            for (const node of nodes) {
                if (node instanceof TextBlock) result.push(node)
                else if (node instanceof StateNode) {
                    result.push(...collect(node.getChildren()))
                }
            }
            return result
        }
        return collect(this.nodes)
    }

    get graphicsBlocks(): GraphicsBlock[] {
        const collect = (nodes: ContentNode[]): GraphicsBlock[] => {
            const result: GraphicsBlock[] = []
            for (const node of nodes) {
                if (node instanceof GraphicsBlock) result.push(node)
                else if (node instanceof StateNode) {
                    result.push(...collect(node.getChildren()))
                }
            }
            return result
        }
        return collect(this.nodes)
    }
}
