import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { tokenizeContentStream } from '../utils/content-stream-parser.js'
import type { PdfFont } from '../fonts/pdf-font.js'
import { PdfHexadecimal, PdfString } from '../core'
import { PdfPage } from './pdf-page'

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
}

export abstract class ContentNode {
    page?: PdfPage

    constructor(page?: PdfPage) {
        this.page = page
    }

    abstract toString(): string
}

export class TextBlock extends ContentNode {
    private x: number
    private y: number
    private _font: PdfFont | null = null
    private _fontSize: number
    text: string

    constructor(ops?: string[], page?: PdfPage) {
        super(page)
        const [x, y] = this.parseXY(ops)
        this.x = x
        this.y = y
        this._font = this.parseCurrentFont(ops)
        this._fontSize = this.parseCurrentFontSize(ops)
        this.text = this.parseText(ops)
    }

    moveTo(x: number, y: number) {
        this.x = x
        this.y = y
    }

    showText(text: string) {
        this.text = text
    }

    font(font: PdfFont, fontSize?: number) {
        this._font = font
        if (typeof fontSize === 'number') {
            this._fontSize = fontSize
        }
    }

    fontSize(size: number) {
        this._fontSize = size
    }

    toString(): string {
        const ops = new ContentOps()
        ops.bt()
        if (this._font) {
            ops.tf(this._font.resourceName, this._fontSize)
        } else {
            ops.tf('F1', this._fontSize)
        }
        ops.td(this.x, this.y)
        if (this._font) {
            ops.tj(this._font.encode(this.text))
        } else {
            ops.tj(this.text)
        }
        ops.et()
        return ops.toString()
    }

    private parseXY(ops: string[] = []): [number, number] {
        const tdOp = ops.find((op) => op.includes(' Td'))
        if (tdOp) {
            const match = tdOp.match(/(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s+Td/)
            if (match) {
                return [parseFloat(match[1]), parseFloat(match[3])]
            }
        }
        const tDOp = ops.find((op) => op.includes(' TD'))
        if (tDOp) {
            const match = tDOp.match(/(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s+TD/)
            if (match) {
                return [parseFloat(match[1]), parseFloat(match[3])]
            }
        }
        return [0, 0]
    }

    private parseText(ops: string[] = []): string {
        let result = ''
        for (const op of ops) {
            if (op.endsWith(' Tj')) {
                const operand = op.slice(0, -3).trim()
                result += this._font
                    ? this._font.decode(parsePdfStringOperand(operand))
                    : extractLiteral(operand)
            } else if (op.endsWith(' TJ')) {
                const operand = op.slice(0, -3).trim()
                // TJ array like [(Hello) -10 (World)]
                const re = /(\([^)]*\)|<[^>]*>)/g
                let m: RegExpExecArray | null
                while ((m = re.exec(operand)) !== null) {
                    result += this._font
                        ? this._font.decode(parsePdfStringOperand(m[1]))
                        : extractLiteral(m[1])
                }
            }
        }

        return result
    }

    private parseCurrentFont(ops: string[] = []): PdfFont | null {
        if (this._font) return this._font
        const fontOp = ops.find((op) => op.includes(' Tf'))
        if (!fontOp) return null
        const match = fontOp.match(/\/(\w+)\s+\d+(\.\d+)?\s+Tf/)
        if (!match) return null
        const fontName = match[1]
        return this.page?.fontMap.get(fontName) || null
    }

    private parseCurrentFontSize(ops: string[] = []): number {
        const fontOp = ops.find((op) => op.includes(' Tf'))
        if (!fontOp) return 12
        const match = fontOp.match(/\/\w+\s+(\d+(\.\d+)?)\s+Tf/)
        if (!match) return 12
        return parseFloat(match[1])
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
}

export class PdfContentStream extends PdfIndirectObject<PdfStream> {
    static ContentNode = ContentNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    page?: PdfPage

    constructor(object?: PdfIndirectObject) {
        super(object)
    }

    textBlock(): TextBlock {
        const block = new TextBlock()
        block.page = this.page
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

        for (const node of nodes) {
            node.page = this.page
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
