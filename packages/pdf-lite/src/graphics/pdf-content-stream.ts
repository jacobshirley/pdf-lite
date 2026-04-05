import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { tokenizeContentStream } from '../utils/content-stream-parser.js'
import type { PdfFont } from '../fonts/pdf-font.js'
import { PdfHexadecimal, PdfString } from '../core'
import { PdfPage } from '../pdf/pdf-page'
import { Matrix } from './geom/matrix'
import { Point } from './geom/point'

function parseNumericOperands(
    tokens: string[],
    i: number,
    count: number,
): number[] | null {
    const result: number[] = []
    for (let j = count; j >= 1; j--) {
        const v = parseFloat(tokens[i - j])
        if (isNaN(v)) return null
        result.push(v)
    }
    return result
}

function extractLiteral(token: string): string {
    if (token.startsWith('(') && token.endsWith(')')) {
        return token
            .slice(1, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
    }
    if (token.startsWith('<') && token.endsWith('>')) {
        const hex = token.slice(1, -1).replace(/\s/g, '')
        const byteWidth = hex.length % 4 === 0 ? 4 : 2
        let result = ''
        for (let i = 0; i < hex.length; i += byteWidth) {
            result += String.fromCharCode(
                parseInt(hex.substring(i, i + byteWidth), 16),
            )
        }
        return result
    }
    return token
}

function parsePdfStringOperand(token: string): PdfString | PdfHexadecimal {
    if (token.startsWith('<') && token.endsWith('>')) {
        return new PdfHexadecimal(token.slice(1, -1))
    }
    if (token.startsWith('(') && token.endsWith(')')) {
        return new PdfString(token.slice(1, -1))
    }
    return new PdfString(token)
}

export class ContentOps {
    ops: string[]

    constructor(ops?: string[]) {
        this.ops = ops ?? []
    }

    toString(): string {
        return this.ops.join(' ')
    }

    toJSON() {
        return this.ops
    }

    td(x: number, y: number) {
        this.ops.push(`${x} ${y} Td`)
    }

    tD(x: number, y: number) {
        this.ops.push(`${x} ${y} TD`)
    }

    tj(text: PdfString | PdfHexadecimal | string) {
        if (typeof text === 'string') {
            this.tj(new PdfString(text))
            return
        }

        if (text instanceof PdfHexadecimal) {
            this.ops.push(`<${text.hexString}> Tj`)
        } else if (text instanceof PdfString) {
            this.ops.push(`(${text.value}) Tj`)
        } else {
            throw new Error('Invalid text type for Tj operator')
        }
    }

    tJ(array: string) {
        this.ops.push(`${array} TJ`)
    }

    tf(fontName: string, fontSize: number) {
        this.ops.push(`/${fontName} ${fontSize} Tf`)
    }

    tm(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.ops.push(`${a} ${b} ${c} ${d} ${e} ${f} Tm`)
    }

    tc(charSpace: number) {
        this.ops.push(`${charSpace} Tc`)
    }

    tw(wordSpace: number) {
        this.ops.push(`${wordSpace} Tw`)
    }

    tStar() {
        this.ops.push('T*')
    }

    quote(text: string) {
        this.ops.push(`(${text}) '`)
    }

    bt() {
        this.ops.push('BT')
    }

    et() {
        this.ops.push('ET')
    }

    rg(r: number, g: number, b: number) {
        this.ops.push(`${r} ${g} ${b} rg`)
    }

    RG(r: number, g: number, b: number) {
        this.ops.push(`${r} ${g} ${b} RG`)
    }

    m(x: number, y: number) {
        this.ops.push(`${x} ${y} m`)
    }

    l(x: number, y: number) {
        this.ops.push(`${x} ${y} l`)
    }

    re(x: number, y: number, width: number, height: number) {
        this.ops.push(`${x} ${y} ${width} ${height} re`)
    }

    h() {
        this.ops.push('h')
    }

    c(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        this.ops.push(`${x1} ${y1} ${x2} ${y2} ${x3} ${y3} c`)
    }

    s() {
        this.ops.push('S')
    }

    f() {
        this.ops.push('f')
    }

    fStar() {
        this.ops.push('f*')
    }

    b() {
        this.ops.push('b')
    }

    B() {
        this.ops.push('B')
    }

    bStar() {
        this.ops.push('b*')
    }

    BStar() {
        this.ops.push('B*')
    }

    n() {
        this.ops.push('n')
    }

    W() {
        this.ops.push('W')
    }

    WStar() {
        this.ops.push('W*')
    }

    q() {
        this.ops.push('q')
    }

    Q() {
        this.ops.push('Q')
    }

    cm(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.ops.push(`${a} ${b} ${c} ${d} ${e} ${f} cm`)
    }

    w(lineWidth: number) {
        this.ops.push(`${lineWidth} w`)
    }

    gs(name: string) {
        this.ops.push(`/${name} gs`)
    }

    Do(name: string) {
        this.ops.push(`/${name} Do`)
    }

    has(operator: string): boolean {
        return this.ops.some((op) => op.endsWith(` ${operator}`))
    }

    findLast(operator: string): string | null {
        return this.ops.findLast((op) => op.endsWith(` ${operator}`)) ?? null
    }

    prepend(ops: ContentOps) {
        this.ops = [...ops.ops, ...this.ops]
    }

    append(ops: ContentOps) {
        this.ops = [...this.ops, ...ops.ops]
    }

    replace(ops: ContentOps) {
        for (const op of ops.ops) {
            const operator = op.split(' ').slice(-1)[0]
            const index = this.ops.findIndex((o) => o.endsWith(` ${operator}`))
            if (index !== -1) {
                this.ops[index] = op
            } else {
                this.ops.push(op)
            }
        }
    }
}

export abstract class ContentNode {
    page?: PdfPage
    parent?: ContentNode
    ops: ContentOps = new ContentOps()

    constructor(page?: PdfPage) {
        this.page = page
    }

    getWorldTransform(): Matrix {
        if (!this.parent) return this.getLocalTransform()
        return this.getLocalTransform().multiply(
            this.parent.getWorldTransform(),
        )
    }

    abstract getLocalTransform(): Matrix
    abstract getLocalBoundingBox(): BoundingBox

    getWorldBoundingBox(): BoundingBox {
        const localBox = this.getLocalBoundingBox()
        const topLeft = new Point({ x: localBox.x, y: localBox.y }).transform(
            this.getWorldTransform(),
        )
        const topRight = new Point({
            x: localBox.x + localBox.width,
            y: localBox.y,
        }).transform(this.getWorldTransform())

        const bottomLeft = new Point({
            x: localBox.x,
            y: localBox.y + localBox.height,
        }).transform(this.getWorldTransform())

        const bottomRight = new Point({
            x: localBox.x + localBox.width,
            y: localBox.y + localBox.height,
        }).transform(this.getWorldTransform())

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

export class GroupNode extends ContentNode {
    protected children: ContentNode[] = []

    constructor(page?: PdfPage) {
        super(page)
    }

    getLocalTransform(): Matrix {
        const lastCm = this.ops.findLast('cm')
        if (lastCm) {
            const parts = lastCm.split(' ')
            if (parts.length >= 7) {
                return new Matrix({
                    a: parseFloat(parts[0]),
                    b: parseFloat(parts[1]),
                    c: parseFloat(parts[2]),
                    d: parseFloat(parts[3]),
                    e: parseFloat(parts[4]),
                    f: parseFloat(parts[5]),
                })
            }
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

/**
 * Compute the text-space advance width for a Tj operator operand.
 * Returns advance in text-space units (before Tm scaling).
 */
function computeTjAdvance(
    operand: string,
    font: PdfFont | null,
    fontSize: number,
    tc: number,
    tw: number,
): number {
    let total = 0
    if (font) {
        const pdfStr = parsePdfStringOperand(operand)
        const decoded = font.decode(pdfStr)
        const chars = [...decoded]
        for (let i = 0; i < chars.length; i++) {
            const charCode = chars[i].charCodeAt(0)
            const w = font.getCharacterWidth(charCode, fontSize)
            total += w ?? fontSize * 0.6
            total += tc
            if (chars[i] === ' ') total += tw
        }
    } else {
        const literal = extractLiteral(operand)
        const chars = [...literal]
        for (let i = 0; i < chars.length; i++) {
            total += fontSize * 0.6
            total += tc
            if (chars[i] === ' ') total += tw
        }
    }
    return total
}

/**
 * Compute the text-space advance width for a TJ operator operand.
 * Handles both string elements and numeric kerning adjustments.
 * Returns advance in text-space units (before Tm scaling).
 */
function computeTJAdvance(
    operand: string,
    font: PdfFont | null,
    fontSize: number,
    tc: number,
    tw: number,
): number {
    let total = 0
    // Parse TJ array elements: strings and numbers alternating
    const re = /(\([^)]*\)|<[^>]*>)|(-?\d+(?:\.\d+)?)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(operand)) !== null) {
        if (m[1]) {
            // String element — compute its advance
            total += computeTjAdvance(m[1], font, fontSize, tc, tw)
        } else if (m[2] !== undefined) {
            // Numeric kerning: value in thousandths of text space, positive = move left
            total -= (parseFloat(m[2]) / 1000) * fontSize
        }
    }
    return total
}

function decodeTextOperand(
    op: string,
    operator: string,
    font: PdfFont | null,
): string {
    const operand = op.slice(0, -(operator.length + 1)).trim()
    if (operator === 'Tj') {
        return font
            ? font.decode(parsePdfStringOperand(operand))
            : extractLiteral(operand)
    }
    // TJ array like [(Hello) -10 (World)]
    let result = ''
    const re = /(\([^)]*\)|<[^>]*>)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(operand)) !== null) {
        result += font
            ? font.decode(parsePdfStringOperand(m[1]))
            : extractLiteral(m[1])
    }
    return result
}

export class Text extends ContentNode {
    prev?: Text

    get text(): string {
        const lastTj = this.ops.findLast('Tj')
        if (lastTj) {
            return decodeTextOperand(lastTj, 'Tj', this.font)
        } else {
            const lastTJ = this.ops.findLast('TJ')
            if (lastTJ) {
                return decodeTextOperand(lastTJ, 'TJ', this.font)
            }
        }

        return ''
    }

    get font(): PdfFont | null {
        const lastTf = this.ops.findLast('Tf')

        if (lastTf) {
            const parts = lastTf.split(' ')
            if (parts.length >= 2) {
                const fontName = parts[0].slice(1)
                return this.page?.fontMap.get(fontName) ?? null
            }
        }

        return this.prev?.font ?? null
    }

    get charSpace(): number {
        const lastTc = this.ops.findLast('Tc')
        if (lastTc) {
            const parts = lastTc.split(' ')
            if (parts.length >= 1) {
                return parseFloat(parts[0])
            }
        }
        return this.prev?.charSpace ?? 0
    }

    get wordSpace(): number {
        const lastTw = this.ops.findLast('Tw')
        if (lastTw) {
            const parts = lastTw.split(' ')
            if (parts.length >= 1) {
                return parseFloat(parts[0])
            }
        }

        return this.prev?.wordSpace ?? 0
    }

    get fontSize(): number {
        const lastTf = this.ops.findLast('Tf')
        if (lastTf) {
            const parts = lastTf.split(' ')
            if (parts.length >= 2) {
                return parseFloat(parts[1])
            }
        }

        return this.prev?.fontSize ?? 12
    }

    getLocalTransform(): Matrix {
        let matrix = this.prev?.getLocalTransform() ?? Matrix.identity()
        for (const op of this.ops.ops) {
            switch (op.split(' ').at(-1)) {
                case 'Tm': {
                    // Tm is absolute — replaces the text matrix
                    const parts = op.split(/\s+/)
                    if (parts.length >= 7) {
                        matrix = new Matrix({
                            a: parseFloat(parts[0]),
                            b: parseFloat(parts[1]),
                            c: parseFloat(parts[2]),
                            d: parseFloat(parts[3]),
                            e: parseFloat(parts[4]),
                            f: parseFloat(parts[5]),
                        })
                    }
                    break
                }
                case 'Td': {
                    const match = op.match(
                        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td/,
                    )
                    if (match) {
                        matrix = matrix.translate(
                            parseFloat(match[1]),
                            parseFloat(match[2]),
                        )
                    }
                    break
                }
                case 'TD':
                    {
                        const match = op.match(
                            /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+TD/,
                        )
                        if (match) {
                            matrix = matrix.translate(
                                parseFloat(match[1]),
                                parseFloat(match[2]),
                            )
                        }
                    }
                    break
            }
        }

        return matrix
    }

    getLocalBoundingBox(): BoundingBox {
        const fontSize = this.fontSize
        const descenderHeight = fontSize * 0.3
        const ascenderHeight = fontSize * 0.95
        const font = this.font
        const tc = this.charSpace
        const tw = this.wordSpace

        let textWidth = 0
        const lastTJ = this.ops.findLast('TJ')
        const lastTj = this.ops.findLast('Tj')

        if (lastTJ) {
            const operand = lastTJ.slice(0, -3).trim()
            textWidth = computeTJAdvance(operand, font, fontSize, tc, tw)
        } else if (lastTj) {
            const operand = lastTj.slice(0, -3).trim()
            textWidth = computeTjAdvance(operand, font, fontSize, tc, tw)
        } else if (font && this.text) {
            const chars = [...this.text]
            for (const ch of chars) {
                const w = font.getCharacterWidth(ch.charCodeAt(0), fontSize)
                textWidth += w ?? fontSize * 0.6
                textWidth += tc
                if (ch === ' ') textWidth += tw
            }
        } else if (this.text) {
            textWidth = this.text.length * fontSize * 0.6
        }

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

    constructor(page?: PdfPage) {
        super(page)
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

    toString(): string {
        const ops = new ContentOps()
        ops.bt()
        for (const line of this.segments) {
            ops.append(line.ops)
        }
        ops.et()
        return ops.toString()
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

    static parseFromContentStream(ops: string[], page?: PdfPage): TextBlock {
        const block = new TextBlock(page)

        let currentLineOps: string[] = []

        const flushLine = () => {
            if (
                currentLineOps.some(
                    (o) => o.endsWith(' Tj') || o.endsWith(' TJ'),
                )
            ) {
                const text = new Text(page)
                text.ops = new ContentOps(currentLineOps)
                block.addSegment(text)
            }
            currentLineOps = []
        }

        for (const op of ops) {
            currentLineOps.push(op)
            if (op.endsWith(' Tj') || op.endsWith(' TJ')) {
                flushLine()
            }
        }

        flushLine()

        return block
    }
}

export class GraphicsBlock extends ContentNode {
    ops: ContentOps

    constructor(ops?: string[], page?: PdfPage) {
        super(page)
        this.ops = new ContentOps(ops)
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
        this.ops.m(x, y)
    }

    lineTo(x: number, y: number) {
        this.ops.l(x, y)
    }

    stroke() {
        this.ops.s()
    }

    fill() {
        this.ops.f()
    }

    rgb(r: number, g: number, b: number) {
        this.ops.rg(r, g, b)
    }

    getLocalTransform(): Matrix {
        return Matrix.identity()
    }

    getLocalBoundingBox(): BoundingBox {
        //TODO
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
    }
}

export class PdfContentStream extends PdfIndirectObject<PdfStream> {
    static ContentNode = ContentNode
    static GroupNode = GroupNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    page?: PdfPage

    constructor(object?: PdfIndirectObject) {
        super(object)
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
        const contentString = this.content.dataAsString
        if (!contentString) return []

        const tokens = tokenizeContentStream(contentString)

        // Build a tree of ContentNodes rooted at a GroupNode
        const root = new GroupNode(this.page)
        let currentGroup: GroupNode = root
        const groupStack: GroupNode[] = []

        let inTextBlock = false
        let currentOps: string[] = []
        let graphicsOps: string[] = []

        // Text state persists across BT/ET blocks (PDF spec 9.3)
        let currentFontName = ''
        let currentFontSize = 0
        let currentTc = 0
        let currentTw = 0

        const PAINT_OPS = new Set([
            'S',
            's',
            'f',
            'F',
            'f*',
            'B',
            'B*',
            'b',
            'b*',
        ])
        const PATH_OPS = new Set(['m', 'l', 're', 'c', 'v', 'y', 'h'])
        const COLOR_OPS = new Set([
            'rg',
            'RG',
            'g',
            'G',
            'k',
            'K',
            'cs',
            'CS',
            'sc',
            'SC',
            'scn',
            'SCN',
        ])
        const STATE_OPS = new Set(['w', 'J', 'j', 'M', 'd', 'ri', 'i', 'gs'])
        const TEXT_OPS = new Set([
            'Tf',
            'Td',
            'TD',
            'Tm',
            'T*',
            'Tj',
            'TJ',
            "'",
            '"',
            'Tc',
            'Tw',
            'Tz',
            'TL',
            'Tr',
            'Ts',
        ])

        // Collect operands preceding the current operator
        let operandBuffer: string[] = []

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]

            if (token === 'BT') {
                inTextBlock = true
                currentOps = []

                // Inject carried-over text state if available
                if (currentFontName && currentFontSize) {
                    currentOps.push(`/${currentFontName} ${currentFontSize} Tf`)
                }
                if (currentTc !== 0) {
                    currentOps.push(`${currentTc} Tc`)
                }
                if (currentTw !== 0) {
                    currentOps.push(`${currentTw} Tw`)
                }
                operandBuffer = []
                continue
            }

            if (token === 'ET') {
                if (inTextBlock && currentOps.length > 0) {
                    const block = TextBlock.parseFromContentStream(
                        currentOps,
                        this.page,
                    )
                    currentGroup.addChild(block)
                }
                inTextBlock = false
                currentOps = []
                operandBuffer = []
                continue
            }

            // Build tree from q/Q scopes; cm sets local transform
            if (token === 'q') {
                if (!inTextBlock) {
                    const group = new GroupNode(this.page)
                    currentGroup.addChild(group)
                    groupStack.push(currentGroup)
                    currentGroup = group
                    operandBuffer = []
                }
                continue
            }
            if (token === 'Q') {
                if (!inTextBlock && groupStack.length > 0) {
                    currentGroup = groupStack.pop()!
                    operandBuffer = []
                }
                continue
            }
            if (token === 'cm') {
                if (!inTextBlock) {
                    const nums = parseNumericOperands(tokens, i, 6)
                    if (nums) {
                        currentGroup.ops.cm(
                            nums[0],
                            nums[1],
                            nums[2],
                            nums[3],
                            nums[4],
                            nums[5],
                        )
                    }
                    operandBuffer = []
                }
                continue
            }

            if (inTextBlock) {
                if (TEXT_OPS.has(token) || COLOR_OPS.has(token)) {
                    // Push operands + operator as a single op string
                    const op = [...operandBuffer, token].join(' ')
                    currentOps.push(op)
                    // Track Tf for cross-block state
                    if (token === 'Tf') {
                        const tfMatch = op.match(/\/(\w+)\s+(\d+(\.\d+)?)\s+Tf/)
                        if (tfMatch) {
                            currentFontName = tfMatch[1]
                            currentFontSize = parseFloat(tfMatch[2])
                        }
                    }
                    // Track Tc/Tw for cross-block state
                    if (token === 'Tc') {
                        const tcMatch = op.match(/(-?\d+(\.\d+)?)\s+Tc/)
                        if (tcMatch) currentTc = parseFloat(tcMatch[1])
                    }
                    if (token === 'Tw') {
                        const twMatch = op.match(/(-?\d+(\.\d+)?)\s+Tw/)
                        if (twMatch) currentTw = parseFloat(twMatch[1])
                    }
                    operandBuffer = []
                } else if (
                    token.startsWith('(') ||
                    token.startsWith('<') ||
                    token.startsWith('[') ||
                    token.startsWith('/')
                ) {
                    operandBuffer.push(token)
                } else if (!isNaN(parseFloat(token)) || token === '-') {
                    operandBuffer.push(token)
                } else {
                    // Unknown text operator - include with operands
                    const op = [...operandBuffer, token].join(' ')
                    currentOps.push(op)
                    operandBuffer = []
                }
                continue
            }

            // Outside text block: track graphics operations
            if (PAINT_OPS.has(token)) {
                // Painting operator ends a graphics block
                const op = [...operandBuffer, token].join(' ')
                graphicsOps.push(op)
                operandBuffer = []
                const gBlock = new GraphicsBlock(graphicsOps)
                currentGroup.addChild(gBlock)
                graphicsOps = []
            } else if (
                PATH_OPS.has(token) ||
                COLOR_OPS.has(token) ||
                token === 'W' ||
                token === 'W*'
            ) {
                const op = [...operandBuffer, token].join(' ')
                graphicsOps.push(op)
                operandBuffer = []
            } else if (token === 'n') {
                // End path without painting - discard accumulated graphics
                operandBuffer = []
                graphicsOps = []
            } else if (STATE_OPS.has(token)) {
                // State operators not handled above (w, J, j, M, etc.)
                operandBuffer = []
            } else if (
                token.startsWith('(') ||
                token.startsWith('<') ||
                token.startsWith('[') ||
                token.startsWith('/')
            ) {
                operandBuffer.push(token)
            } else if (!isNaN(parseFloat(token))) {
                operandBuffer.push(token)
            } else {
                // Unknown operator outside text - reset operands
                operandBuffer = []
            }
        }

        return root.getChildren()
    }

    get textBlocks(): Text[] {
        const collect = (nodes: ContentNode[]): Text[] => {
            const result: Text[] = []
            for (const node of nodes) {
                if (node instanceof TextBlock)
                    result.push(...node.getSegments())
                else if (node instanceof GroupNode) {
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
                else if (node instanceof GroupNode) {
                    result.push(...collect(node.getChildren()))
                }
            }
            return result
        }
        return collect(this.nodes)
    }
}
