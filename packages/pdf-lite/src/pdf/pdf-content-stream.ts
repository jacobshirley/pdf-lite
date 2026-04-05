import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { tokenizeContentStream } from '../utils/content-stream-parser.js'

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

    tj(text: string) {
        this.ops.push(`(${text}) Tj`)
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
}

export abstract class ContentNode {
    ops: ContentOps

    constructor(ops?: string[]) {
        this.ops = new ContentOps(ops)
    }

    toString(): string {
        return this.ops.toString()
    }

    toJSON() {
        return this.ops.toJSON()
    }
}

export class TextBlock extends ContentNode {
    moveTo(x: number, y: number) {
        this.ops.td(x, y)
    }

    showText(text: string) {
        this.ops.tj(text)
    }

    font(fontName: string, fontSize: number) {
        this.ops.tf(fontName, fontSize)
    }

    rgb(r: number, g: number, b: number) {
        this.ops.rg(r, g, b)
    }
}

export class GraphicsBlock extends ContentNode {
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
}

export class PdfContentStream extends PdfIndirectObject<PdfStream> {
    static ContentNode = ContentNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    add(node: ContentNode) {
        this.content.dataAsString += node.toString() + '\n'
    }

    get nodes(): ContentNode[] {
        const contentString = this.content.dataAsString
        if (!contentString) return []

        const tokens = tokenizeContentStream(contentString)
        const nodes: ContentNode[] = []
        let inTextBlock = false
        let currentOps: string[] = []
        let graphicsOps: string[] = []

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
        const STATE_OPS = new Set([
            'q',
            'Q',
            'cm',
            'w',
            'J',
            'j',
            'M',
            'd',
            'ri',
            'i',
            'gs',
        ])
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
                operandBuffer = []
                continue
            }

            if (token === 'ET') {
                if (inTextBlock && currentOps.length > 0) {
                    nodes.push(new TextBlock(currentOps))
                }
                inTextBlock = false
                currentOps = []
                operandBuffer = []
                continue
            }

            if (inTextBlock) {
                if (TEXT_OPS.has(token) || COLOR_OPS.has(token)) {
                    // Push operands + operator as a single op string
                    const op = [...operandBuffer, token].join(' ')
                    currentOps.push(op)
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
                nodes.push(new GraphicsBlock(graphicsOps))
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
                // State operators are not part of a node
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

        return nodes
    }

    get textBlocks(): TextBlock[] {
        return this.nodes.filter((node) => node instanceof TextBlock)
    }

    get graphicsBlocks(): GraphicsBlock[] {
        return this.nodes.filter((node) => node instanceof GraphicsBlock)
    }
}
