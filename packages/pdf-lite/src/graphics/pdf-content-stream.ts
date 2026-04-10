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
} from './ops/state'

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

    td(x: number, y: number): this {
        this.ops.push(`${x} ${y} Td`)
        return this
    }

    tD(x: number, y: number): this {
        this.ops.push(`${x} ${y} TD`)
        return this
    }

    tj(text: PdfString | PdfHexadecimal | string): this {
        if (typeof text === 'string') {
            this.tj(new PdfString(text))
            return this
        }

        if (text instanceof PdfHexadecimal) {
            this.ops.push(`<${text.hexString}> Tj`)
        } else if (text instanceof PdfString) {
            this.ops.push(`(${text.value}) Tj`)
        } else {
            throw new Error('Invalid text type for Tj operator')
        }

        return this
    }

    tJ(array: string): this {
        this.ops.push(`${array} TJ`)
        return this
    }

    tf(fontName: string, fontSize: number): this {
        this.ops.push(`/${fontName} ${fontSize} Tf`)
        return this
    }

    tm(a: number, b: number, c: number, d: number, e: number, f: number): this {
        this.ops.push(`${a} ${b} ${c} ${d} ${e} ${f} Tm`)
        return this
    }

    tc(charSpace: number): this {
        this.ops.push(`${charSpace} Tc`)
        return this
    }

    tw(wordSpace: number): this {
        this.ops.push(`${wordSpace} Tw`)
        return this
    }

    tStar(): this {
        this.ops.push('T*')
        return this
    }

    quote(text: string): this {
        this.ops.push(`(${text}) '`)
        return this
    }

    bt(): this {
        this.ops.push('BT')
        return this
    }

    et(): this {
        this.ops.push('ET')
        return this
    }

    rg(r: number, g: number, b: number): this {
        this.ops.push(`${r} ${g} ${b} rg`)
        return this
    }

    RG(r: number, g: number, b: number): this {
        this.ops.push(`${r} ${g} ${b} RG`)
        return this
    }

    m(x: number, y: number): this {
        this.ops.push(`${x} ${y} m`)
        return this
    }

    l(x: number, y: number): this {
        this.ops.push(`${x} ${y} l`)
        return this
    }

    re(x: number, y: number, width: number, height: number): this {
        this.ops.push(`${x} ${y} ${width} ${height} re`)
        return this
    }

    h(): this {
        this.ops.push('h')
        return this
    }

    c(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): this {
        this.ops.push(`${x1} ${y1} ${x2} ${y2} ${x3} ${y3} c`)
        return this
    }

    s(): this {
        this.ops.push('S')
        return this
    }

    f(): this {
        this.ops.push('f')
        return this
    }

    fStar(): this {
        this.ops.push('f*')
        return this
    }

    b(): this {
        this.ops.push('b')
        return this
    }

    B(): this {
        this.ops.push('B')
        return this
    }

    bStar(): this {
        this.ops.push('b*')
        return this
    }

    BStar(): this {
        this.ops.push('B*')
        return this
    }

    n(): this {
        this.ops.push('n')
        return this
    }

    W(): this {
        this.ops.push('W')
        return this
    }

    WStar(): this {
        this.ops.push('W*')
        return this
    }

    q(): this {
        this.ops.push('q')
        return this
    }

    Q(): this {
        this.ops.push('Q')
        return this
    }

    cm(a: number, b: number, c: number, d: number, e: number, f: number): this {
        this.ops.push(`${a} ${b} ${c} ${d} ${e} ${f} cm`)
        return this
    }

    w(lineWidth: number): this {
        this.ops.push(`${lineWidth} w`)
        return this
    }

    gs(name: string): this {
        this.ops.push(`/${name} gs`)
        return this
    }

    Do(name: string): this {
        this.ops.push(`/${name} Do`)
        return this
    }

    has(operator: string): boolean {
        return this.ops.some((op) => op.endsWith(` ${operator}`))
    }

    findLast(operator: string): string | null {
        return this.ops.findLast((op) => op.endsWith(` ${operator}`)) ?? null
    }

    prepend(ops: ContentOps): this {
        this.ops = [...ops.ops, ...this.ops]
        return this
    }

    append(ops: ContentOps): this {
        this.ops = [...this.ops, ...ops.ops]
        return this
    }

    replace(ops: ContentOps): this {
        for (const op of ops.ops) {
            const operator = op.split(' ').slice(-1)[0]
            const index = this.ops.findIndex((o) => o.endsWith(` ${operator}`))
            if (index !== -1) {
                this.ops[index] = op
            } else {
                this.ops.push(op)
            }
        }
        return this
    }
}

export abstract class ContentNode {
    _page?: PdfPage
    parent?: ContentNode
    ops: ContentOp[] = []

    constructor(ops?: ContentOp[], page?: PdfPage) {
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
        const tfOp = `/${font.resourceName} ${size} Tf`
        this.replaceOrPrependOp('Tf', tfOp)
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

    set fontSize(size: number) {
        const fontName = this.font.resourceName
        const tfOp = `/${fontName} ${size} Tf`
        this.replaceOrPrependOp('Tf', tfOp)
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

    set text(newText: string) {
        const newTextOp = this.font.writeContentStreamText(newText)
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

    set text(newText: string) {
        if (this.segments.length === 0) {
            const text = new Text(this.page)
            text.ops = new ContentOps()
            text.font = PdfFont.HELVETICA
            text.fontSize = 12
            text.text = newText
            this.addSegment(text)
            return
        }

        const firstSeg = this.segments[0]
        const textOp = firstSeg.font.writeContentStreamText(newText)
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
                newOps.push(textOp)
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
            newOps.push(textOp)
        }

        firstSeg.ops = new ContentOps(newOps)
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
            const hasTm = seg.ops.ops.some((op) => {
                const parts = op.split(/\s+/)
                return parts[parts.length - 1] === 'Tm' && parts.length >= 7
            })
            return { hasTm, tm: hasTm ? null : seg.getLocalTransform() }
        })

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i]
            const { hasTm, tm } = resolved[i]
            const newOps: string[] = []

            if (hasTm) {
                for (const op of seg.ops.ops) {
                    const parts = op.split(/\s+/)
                    const operator = parts[parts.length - 1]

                    if (operator === 'Tm' && parts.length >= 7) {
                        const a = parts[0]
                        const b = parts[1]
                        const c = parts[2]
                        const d = parts[3]
                        const e = parseFloat(parts[4]) + dx
                        const f = parseFloat(parts[5]) + dy
                        newOps.push(`${a} ${b} ${c} ${d} ${e} ${f} Tm`)
                    } else {
                        newOps.push(op)
                    }
                }
                seg.ops = new ContentOps(newOps)
            } else {
                for (const op of seg.ops.ops) {
                    newOps.push(op)
                }
                newOps.unshift(
                    `${tm!.a} ${tm!.b} ${tm!.c} ${tm!.d} ${tm!.e + dx} ${tm!.f + dy} Tm`,
                )
                seg.ops = new ContentOps(
                    newOps.filter((op) => {
                        const o = op.split(/\s+/).at(-1)
                        return o !== 'Td' && o !== 'TD' && o !== 'T*'
                    }),
                )
            }
        }
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

        const ops = parseContentStream(contentString)
        return this.buildTree(ops)
    }

    private isPaintOp(op: ContentOp): boolean {
        return (
            op instanceof StrokeOp ||
            op instanceof CloseAndStrokeOp ||
            op instanceof FillOp ||
            op instanceof FillAlternateOp ||
            op instanceof FillEvenOddOp ||
            op instanceof FillAndStrokeOp ||
            op instanceof CloseFillAndStrokeOp ||
            op instanceof FillAndStrokeEvenOddOp ||
            op instanceof CloseFillAndStrokeEvenOddOp
        )
    }

    private isPathOp(op: ContentOp): boolean {
        return (
            op instanceof MoveToOp ||
            op instanceof LineToOp ||
            op instanceof CurveToOp ||
            op instanceof CurveToV ||
            op instanceof CurveToY ||
            op instanceof RectangleOp ||
            op instanceof ClosePathOp
        )
    }

    private isColorOp(op: ContentOp): boolean {
        return (
            op instanceof SetFillColorRGBOp ||
            op instanceof SetStrokeColorRGBOp ||
            op instanceof SetFillColorGrayOp ||
            op instanceof SetStrokeColorGrayOp ||
            op instanceof SetFillColorCMYKOp ||
            op instanceof SetStrokeColorCMYKOp ||
            op instanceof SetFillColorSpaceOp ||
            op instanceof SetStrokeColorSpaceOp ||
            op instanceof SetFillColorOp ||
            op instanceof SetStrokeColorOp ||
            op instanceof SetFillColorExtOp ||
            op instanceof SetStrokeColorExtOp
        )
    }

    private isTextOp(op: ContentOp): boolean {
        return op instanceof TextOp
    }

    private isStateOp(op: ContentOp): boolean {
        return (
            op instanceof SetLineWidthOp ||
            op instanceof SetLineCapOp ||
            op instanceof SetLineJoinOp ||
            op instanceof SetMiterLimitOp ||
            op instanceof SetDashPatternOp ||
            op instanceof SetRenderingIntentOp ||
            op instanceof SetFlatnessOp ||
            op instanceof SetGraphicsStateOp ||
            op instanceof InvokeXObjectOp
        )
    }

    private buildTree(ops: ContentOp[]): ContentNode[] {
        const root = new GroupNode(this.page)
        let currentGroup: GroupNode = root
        const groupStack: GroupNode[] = []

        let inTextBlock = false
        let textOps: string[] = []
        let graphicsOps: string[] = []
        let btEtIndex = 0

        // Text state persists across BT/ET blocks (PDF spec 9.3)
        let currentFontName = ''
        let currentFontSize = 0
        let currentTc = 0
        let currentTw = 0

        for (const op of ops) {
            if (op instanceof BeginTextOp) {
                inTextBlock = true
                textOps = []
                // Inject carried-over text state
                if (currentFontName && currentFontSize) {
                    textOps.push(`/${currentFontName} ${currentFontSize} Tf`)
                }
                if (currentTc !== 0) {
                    textOps.push(`${currentTc} Tc`)
                }
                if (currentTw !== 0) {
                    textOps.push(`${currentTw} Tw`)
                }
                continue
            }

            if (op instanceof EndTextOp) {
                if (inTextBlock && textOps.length > 0) {
                    const blocks = TextBlock.parseFromContentStream(
                        textOps,
                        this.page,
                    )
                    for (const block of blocks) {
                        block.sourceIndex = btEtIndex
                        currentGroup.addChild(block)
                    }
                    btEtIndex++
                }
                inTextBlock = false
                textOps = []
                continue
            }

            if (op instanceof SaveStateOp && !inTextBlock) {
                const group = new GroupNode(this.page)
                currentGroup.addChild(group)
                groupStack.push(currentGroup)
                currentGroup = group
                continue
            }

            if (op instanceof RestoreStateOp && !inTextBlock) {
                if (groupStack.length > 0) {
                    currentGroup = groupStack.pop()!
                }
                continue
            }

            if (op instanceof SetMatrixOp && !inTextBlock) {
                currentGroup.ops.cm(op.a, op.b, op.c, op.d, op.e, op.f)
                continue
            }

            if (inTextBlock) {
                if (this.isTextOp(op) || this.isColorOp(op)) {
                    textOps.push(op.raw!)
                    // Track text state for cross-block persistence
                    if (op instanceof SetFontOp) {
                        currentFontName = op.fontName
                        currentFontSize = op.fontSize
                    }
                    if (op instanceof SetCharSpacingOp) {
                        currentTc = op.charSpace
                    }
                    if (op instanceof SetWordSpacingOp) {
                        currentTw = op.wordSpace
                    }
                } else {
                    // Unknown op in text block — include as-is
                    textOps.push(op.raw!)
                }
                continue
            }

            // Outside text block: graphics
            if (this.isPaintOp(op)) {
                graphicsOps.push(op.raw!)
                const gBlock = new GraphicsBlock(graphicsOps)
                currentGroup.addChild(gBlock)
                graphicsOps = []
            } else if (
                this.isPathOp(op) ||
                this.isColorOp(op) ||
                op instanceof ClipOp ||
                op instanceof ClipEvenOddOp
            ) {
                graphicsOps.push(op.raw!)
            } else if (op instanceof EndPathOp) {
                // End path without painting — discard
                graphicsOps = []
            }
            // State ops outside text are ignored
        }

        return root.getChildren()
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

export class PdfContentStreamObject extends PdfIndirectObject<PdfContentStream> {
    static ContentNode = ContentNode
    static GroupNode = GroupNode
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
