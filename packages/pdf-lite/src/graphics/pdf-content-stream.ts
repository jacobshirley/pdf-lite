import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import type { PdfFont } from '../fonts/pdf-font.js'
import { PdfHexadecimal, PdfString } from '../core'
import { PdfPage } from '../pdf/pdf-page'
import { Matrix } from './geom/matrix'
import { Point } from './geom/point'

function tokenizeContentStream(content: string): string[] {
    const tokens: string[] = []
    let current = ''
    let inString = false
    let inArray = false
    let arrayDepth = 0
    let arrayContent = ''

    for (let i = 0; i < content.length; i++) {
        const char = content[i]
        const nextChar = content[i + 1]

        // Handle arrays
        if (char === '[') {
            if (!inString) {
                inArray = true
                arrayDepth++
                arrayContent = char
                continue
            }
        }

        if (inArray) {
            arrayContent += char
            if (char === '[' && !inString) arrayDepth++
            if (char === ']' && !inString) {
                arrayDepth--
                if (arrayDepth === 0) {
                    tokens.push(arrayContent)
                    arrayContent = ''
                    inArray = false
                }
            }
            if (char === '(') inString = true
            if (char === ')') inString = false
            continue
        }

        // Handle strings
        if (char === '(') {
            inString = true
            current = char
            continue
        }

        if (inString) {
            current += char
            if (char === ')' && content[i - 1] !== '\\') {
                inString = false
                tokens.push(current)
                current = ''
            }
            continue
        }

        // Handle hex strings <...>
        if (char === '<' && nextChar !== '<') {
            if (current) {
                tokens.push(current)
                current = ''
            }
            let hexStr = '<'
            i++
            while (i < content.length && content[i] !== '>') {
                hexStr += content[i]
                i++
            }
            hexStr += '>'
            tokens.push(hexStr)
            continue
        }

        // Handle regular tokens
        if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
            if (current) {
                tokens.push(current)
                current = ''
            }
        } else {
            current += char
        }
    }

    if (current) {
        tokens.push(current)
    }

    return tokens
}

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
        return this.parent
            .getWorldTransform()
            .multiply(this.getLocalTransform())
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
        if (font.isUnicode && pdfStr instanceof PdfHexadecimal) {
            // For CID fonts, use raw CID values for width lookup
            const hex = pdfStr.hexString
            for (let i = 0; i < hex.length; i += 4) {
                const cid = parseInt(hex.substring(i, i + 4), 16)
                const w = font.getCharacterWidth(cid, fontSize)
                total += w ?? fontSize * 0.6
                total += tc
                // Check if this CID maps to a space character
                const umap = font.toUnicodeMap
                const ch = umap?.get(cid) ?? String.fromCodePoint(cid)
                if (ch === ' ') total += tw
            }
        } else {
            const decoded = font.decode(pdfStr)
            const chars = [...decoded]
            for (let i = 0; i < chars.length; i++) {
                const charCode = chars[i].charCodeAt(0)
                const w = font.getCharacterWidth(charCode, fontSize)
                total += w ?? fontSize * 0.6
                total += tc
                if (chars[i] === ' ') total += tw
            }
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
    // String regex handles escaped parens like \) inside (C\))
    const re = /(\((?:[^()\\]|\\.)*\)|<[^>]*>)|(-?\d+(?:\.\d+)?)/g
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
    if (operator === 'Tj' || operator === "'") {
        return font
            ? font.decode(parsePdfStringOperand(operand))
            : extractLiteral(operand)
    }
    // TJ array like [(Hello) -10 (World)]
    let result = ''
    const re = /(\((?:[^()\\]|\\.)*\)|<[^>]*>)/g
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

        const lastQuote = this.ops.findLast("'")
        if (lastQuote) {
            return decodeTextOperand(lastQuote, "'", this.font)
        }

        const lastDblQuote = this.ops.findLast('"')
        if (lastDblQuote) {
            return decodeTextOperand(lastDblQuote, '"', this.font)
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

    get textLeading(): number {
        const lastTL = this.ops.findLast('TL')
        if (lastTL) {
            return parseFloat(lastTL.split(' ')[0])
        }
        // TD also sets TL = -ty (PDF spec Table 108)
        const lastTD = this.ops.findLast('TD')
        if (lastTD) {
            const match = lastTD.match(
                /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+TD/,
            )
            if (match) {
                return -parseFloat(match[2])
            }
        }
        return this.prev?.textLeading ?? 0
    }

    /**
     * Compute the text-space advance width of this segment's show operator.
     * After Tj/TJ, the text position advances by this amount.
     */
    getTextAdvance(): number {
        const fontSize = this.fontSize
        const font = this.font
        const tc = this.charSpace
        const tw = this.wordSpace

        const lastTJ = this.ops.findLast('TJ')
        const lastTj = this.ops.findLast('Tj')
        const lastQuote = this.ops.findLast("'")
        const lastDblQuote = this.ops.findLast('"')

        if (lastTJ) {
            return computeTJAdvance(
                lastTJ.slice(0, -3).trim(),
                font,
                fontSize,
                tc,
                tw,
            )
        }
        if (lastTj) {
            return computeTjAdvance(
                lastTj.slice(0, -3).trim(),
                font,
                fontSize,
                tc,
                tw,
            )
        }
        if (lastQuote) {
            return computeTjAdvance(
                lastQuote.slice(0, -2).trim(),
                font,
                fontSize,
                tc,
                tw,
            )
        }
        if (lastDblQuote) {
            const operand = lastDblQuote.slice(0, -2).trim()
            const strMatch = operand.match(/(\((?:[^()\\]|\\.)*\)|<[^>]*>)\s*$/)
            if (strMatch) {
                return computeTjAdvance(strMatch[1], font, fontSize, tc, tw)
            }
        }
        if (font && this.text) {
            let total = 0
            for (const ch of [...this.text]) {
                total +=
                    font.getCharacterWidth(ch.charCodeAt(0), fontSize) ??
                    fontSize * 0.6
                total += tc
                if (ch === ' ') total += tw
            }
            return total
        }
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
        for (const op of this.ops.ops) {
            switch (op.split(' ').at(-1)) {
                case 'Tm': {
                    // Tm is absolute — sets both Tm and Tlm
                    const parts = op.split(/\s+/)
                    if (parts.length >= 7) {
                        const m = new Matrix({
                            a: parseFloat(parts[0]),
                            b: parseFloat(parts[1]),
                            c: parseFloat(parts[2]),
                            d: parseFloat(parts[3]),
                            e: parseFloat(parts[4]),
                            f: parseFloat(parts[5]),
                        })
                        tm = m
                        tlm = m
                    }
                    break
                }
                case 'Td': {
                    // Td is relative to Tlm, sets both Tlm and Tm
                    const match = op.match(
                        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Td/,
                    )
                    if (match) {
                        tlm = tlm.translate(
                            parseFloat(match[1]),
                            parseFloat(match[2]),
                        )
                        tm = tlm
                    }
                    break
                }
                case 'TD': {
                    // TD is like Td (also sets TL = -ty)
                    const match = op.match(
                        /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+TD/,
                    )
                    if (match) {
                        tlm = tlm.translate(
                            parseFloat(match[1]),
                            parseFloat(match[2]),
                        )
                        tm = tlm
                    }
                    break
                }
                case 'T*':
                case "'":
                case '"': {
                    // Move to next line: Tlm += (0, -TL), Tm = Tlm
                    const tl = this.textLeading
                    tlm = tlm.translate(0, -tl)
                    tm = tlm
                    break
                }
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
    sourceIndex?: number

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

    replaceText(newText: string): void {
        if (this.segments.length === 0) return

        const firstSeg = this.segments[0]
        const newOps: string[] = []
        let replaced = false

        for (const op of firstSeg.ops.ops) {
            const parts = op.split(/\s+/)
            const operator = parts[parts.length - 1]

            if (
                !replaced &&
                (operator === 'Tj' ||
                    operator === 'TJ' ||
                    operator === "'" ||
                    operator === '"')
            ) {
                const escaped = newText
                    .replace(/\\/g, '\\\\')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')
                newOps.push(`(${escaped}) Tj`)
                replaced = true
            } else if (
                replaced &&
                (operator === 'Tj' ||
                    operator === 'TJ' ||
                    operator === "'" ||
                    operator === '"')
            ) {
                // Skip additional text show ops in the first segment
                continue
            } else {
                newOps.push(op)
            }
        }

        if (!replaced) {
            const escaped = newText
                .replace(/\\/g, '\\\\')
                .replace(/\(/g, '\\(')
                .replace(/\)/g, '\\)')
            newOps.push(`(${escaped}) Tj`)
        }

        firstSeg.ops = new ContentOps(newOps)
        this.segments.splice(1)
    }

    static parseFromContentStream(ops: string[], page?: PdfPage): TextBlock[] {
        // Build a full block first to establish proper prev chains for position resolution
        const fullBlock = new TextBlock(page)

        let currentLineOps: string[] = []

        const flushLine = () => {
            if (
                currentLineOps.some(
                    (o) =>
                        o.endsWith(' Tj') ||
                        o.endsWith(' TJ') ||
                        o.endsWith(" '") ||
                        o.endsWith(' "'),
                )
            ) {
                const text = new Text(page)
                text.ops = new ContentOps(currentLineOps)
                fullBlock.addSegment(text)
            }
            currentLineOps = []
        }

        for (const op of ops) {
            currentLineOps.push(op)
            if (
                op.endsWith(' Tj') ||
                op.endsWith(' TJ') ||
                op.endsWith(" '") ||
                op.endsWith(' "')
            ) {
                flushLine()
            }
        }

        flushLine()

        const segments = fullBlock.getSegments()
        if (segments.length <= 1) return [fullBlock]

        // Compute absolute positions using the full prev chain
        const positions = segments.map((s) => s.getLocalTransform())

        // Find split points where position changes significantly
        const Y_THRESHOLD = 0.5
        const X_THRESHOLD = 50
        const splitIndices: number[] = [0]
        for (let i = 1; i < segments.length; i++) {
            const dy = Math.abs(positions[i].f - positions[i - 1].f)
            const prevEndX =
                positions[i - 1].e + segments[i - 1].getTextAdvance()
            const dx = positions[i].e - prevEndX
            if (dy > Y_THRESHOLD || dx > X_THRESHOLD) {
                splitIndices.push(i)
            }
        }

        if (splitIndices.length <= 1) return [fullBlock]

        // Split into separate TextBlocks for each group
        const results: TextBlock[] = []
        for (let g = 0; g < splitIndices.length; g++) {
            const startIdx = splitIndices[g]
            const endIdx =
                g + 1 < splitIndices.length
                    ? splitIndices[g + 1]
                    : segments.length

            const block = new TextBlock(page)
            for (let i = startIdx; i < endIdx; i++) {
                const seg = segments[i]
                const text = new Text(page)

                if (i === startIdx && g > 0) {
                    // First segment of a split group: inject absolute Tm
                    // and inherited font state so prev chain isn't needed
                    const tm = positions[i]
                    const newOps: string[] = []

                    // Keep non-positioning ops from original segment
                    for (const op of seg.ops.ops) {
                        const operator = op.split(/\s+/).at(-1)
                        if (
                            operator === 'Td' ||
                            operator === 'TD' ||
                            operator === 'T*' ||
                            operator === 'Tm'
                        ) {
                            continue
                        }
                        newOps.push(op)
                    }

                    // Inject inherited Tf/Tc/Tw from previous segments if missing
                    const hasTf = newOps.some((op) => op.endsWith(' Tf'))
                    const hasTc = newOps.some((op) => op.endsWith(' Tc'))
                    const hasTw = newOps.some((op) => op.endsWith(' Tw'))
                    const inject: string[] = []

                    for (let j = i - 1; j >= 0; j--) {
                        const segOps = segments[j].ops.ops
                        for (let k = segOps.length - 1; k >= 0; k--) {
                            if (
                                !hasTf &&
                                !inject.some((o) => o.endsWith(' Tf')) &&
                                segOps[k].endsWith(' Tf')
                            )
                                inject.push(segOps[k])
                            if (
                                !hasTc &&
                                !inject.some((o) => o.endsWith(' Tc')) &&
                                segOps[k].endsWith(' Tc')
                            )
                                inject.push(segOps[k])
                            if (
                                !hasTw &&
                                !inject.some((o) => o.endsWith(' Tw')) &&
                                segOps[k].endsWith(' Tw')
                            )
                                inject.push(segOps[k])
                        }
                    }

                    // Insert inherited state at the beginning, then absolute Tm before show op
                    newOps.unshift(...inject)

                    const showIdx = newOps.findIndex((op) => {
                        const operator = op.split(/\s+/).at(-1)
                        return (
                            operator === 'Tj' ||
                            operator === 'TJ' ||
                            operator === "'" ||
                            operator === '"'
                        )
                    })
                    const tmStr = `${tm.a} ${tm.b} ${tm.c} ${tm.d} ${tm.e} ${tm.f} Tm`
                    if (showIdx >= 0) {
                        newOps.splice(showIdx, 0, tmStr)
                    } else {
                        newOps.push(tmStr)
                    }

                    text.ops = new ContentOps(newOps)
                } else {
                    text.ops = new ContentOps([...seg.ops.ops])
                }

                block.addSegment(text)
            }

            if (block.getSegments().length > 0) {
                results.push(block)
            }
        }

        return results
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

        for (const op of this.ops.ops) {
            const parts = op.split(/\s+/)
            const operator = parts[parts.length - 1]

            switch (operator) {
                case 'm': // moveTo: x y m
                case 'l': {
                    // lineTo: x y l
                    if (parts.length >= 3) {
                        track(parseFloat(parts[0]), parseFloat(parts[1]))
                    }
                    break
                }
                case 're': {
                    // rectangle: x y w h re
                    if (parts.length >= 5) {
                        const x = parseFloat(parts[0])
                        const y = parseFloat(parts[1])
                        const w = parseFloat(parts[2])
                        const h = parseFloat(parts[3])
                        track(x, y)
                        track(x + w, y + h)
                    }
                    break
                }
                case 'c': {
                    // cubic bezier: x1 y1 x2 y2 x3 y3 c
                    if (parts.length >= 7) {
                        track(parseFloat(parts[0]), parseFloat(parts[1]))
                        track(parseFloat(parts[2]), parseFloat(parts[3]))
                        track(parseFloat(parts[4]), parseFloat(parts[5]))
                    }
                    break
                }
                case 'v': {
                    // cubic bezier (cp1=current): x2 y2 x3 y3 v
                    if (parts.length >= 5) {
                        track(parseFloat(parts[0]), parseFloat(parts[1]))
                        track(parseFloat(parts[2]), parseFloat(parts[3]))
                    }
                    break
                }
                case 'y': {
                    // cubic bezier (cp2=endpoint): x1 y1 x3 y3 y
                    if (parts.length >= 5) {
                        track(parseFloat(parts[0]), parseFloat(parts[1]))
                        track(parseFloat(parts[2]), parseFloat(parts[3]))
                    }
                    break
                }
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
        let btEtIndex = 0

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
                    const blocks = TextBlock.parseFromContentStream(
                        currentOps,
                        this.page,
                    )
                    for (const block of blocks) {
                        block.sourceIndex = btEtIndex
                        currentGroup.addChild(block)
                    }
                    btEtIndex++
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

    get textBlocks(): TextBlock[] {
        const collect = (nodes: ContentNode[]): TextBlock[] => {
            const result: TextBlock[] = []
            for (const node of nodes) {
                if (node instanceof TextBlock) result.push(node)
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
