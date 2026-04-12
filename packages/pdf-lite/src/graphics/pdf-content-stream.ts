import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfStream } from '../core/objects/pdf-stream'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfDictionary, PdfHexadecimal, PdfNumber, PdfString } from '../core'
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
    ShowTextSegment,
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
    FillOp,
    EndPathOp,
    ClipOp,
    ClipEvenOddOp,
    PaintOp,
} from './ops/paint'
import { SetFillColorRGBOp, SetStrokeColorRGBOp, ColorOp } from './ops/color'
import { SaveStateOp, RestoreStateOp, SetMatrixOp, StateOp } from './ops/state'
import { PdfContentStreamTokeniser } from './tokeniser'
import { PdfToken } from '../core/tokens/token.js'

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
        return this.ops.map((o) => o.toString()).join('\n')
    }
}

export class Text extends ContentNode {
    prev?: Text
    /**
     * Reference to the original content-stream Text segment that this
     * regrouped segment was derived from.  Set by `regroupTextBlocks`.
     */
    _sourceSegment?: Text
    /** @internal Cached result of resolveTextState() for O(n) perf. */
    _cachedTextState?: { tm: Matrix; tlm: Matrix }

    /**
     * Replace the text in the original content-stream segment that this
     * regrouped segment was derived from.  Modifies the live node tree
     * so that the content stream auto-serializes the change.
     *
     * Returns true if the replacement succeeded, false if no source exists.
     */
    replaceTextInSource(newText: string): boolean {
        const src = this._sourceSegment
        if (!src) return false

        const newShowOp = src.writeContentStreamText(newText)
        const isShowOp = (o: ContentOp) =>
            o instanceof ShowTextOp ||
            o instanceof ShowTextArrayOp ||
            o instanceof ShowTextNextLineOp ||
            o instanceof ShowTextNextLineSpacingOp

        const oldShowOp = src.ops.find(isShowOp)
        if (!oldShowOp) return false

        // Replace in the original TextBlock's ops array (the content-stream tree)
        const parentBlock = src.parent
        if (parentBlock) {
            const idx = parentBlock.ops.indexOf(oldShowOp)
            if (idx !== -1) parentBlock.ops[idx] = newShowOp
        }
        // Also update the segment's own ops for consistency
        const segIdx = src.ops.indexOf(oldShowOp)
        if (segIdx !== -1) src.ops[segIdx] = newShowOp

        return true
    }

    /**
     * Remove all ops from this segment's original source in the
     * content-stream tree.  Used when collapsing multi-segment edits
     * into the first segment.  Removes positioning ops too so orphaned
     * Td/Tm ops don't shift the cursor after the consolidated Tj.
     */
    clearSourceOps(): void {
        const src = this._sourceSegment
        if (!src) return

        const parentBlock = src.parent
        if (parentBlock) {
            for (const op of src.ops) {
                const idx = parentBlock.ops.indexOf(op)
                if (idx !== -1) parentBlock.ops.splice(idx, 1)
            }
        }
        src.ops.length = 0
    }

    /**
     * Shift the position in this segment's original source by (dx, dy)
     * in world-space coordinates.  Correctly accounts for parent graphics
     * state transforms (cm) so the visible result matches the shift.
     * Modifies the live content-stream tree in-place.
     */
    moveSourceBy(dx: number, dy: number): void {
        const src = this._sourceSegment
        if (!src) return
        const newLocal = Text._computeSourceShift(src, dx, dy)
        if (newLocal) Text._applySourceShift(src, newLocal)
    }

    /**
     * Compute the new local Tm that a source segment should have after
     * a world-space shift of (dx, dy).  Pure — no side effects.
     */
    /** @internal */
    static _computeSourceShift(
        src: Text,
        dx: number,
        dy: number,
    ): Matrix | null {
        const oldWorld = src.getWorldTransform()
        const localTm = src.getLocalTransform()
        const localInv = localTm.inverse()
        if (!localInv) return null
        const parentGlobal = oldWorld.multiply(localInv)
        const parentInv = parentGlobal.inverse()
        if (!parentInv) return null
        return parentInv.multiply(
            new Matrix({
                a: oldWorld.a,
                b: oldWorld.b,
                c: oldWorld.c,
                d: oldWorld.d,
                e: oldWorld.e + dx,
                f: oldWorld.f + dy,
            }),
        )
    }

    /**
     * Compute the local Tm that would produce the given world transform for
     * `seg`, accounting for its parent's composed transform.  Pure.
     */
    /** @internal */
    static _computeLocalFromWorld(
        seg: Text,
        targetWorld: Matrix,
    ): Matrix | null {
        const currentWorld = seg.getWorldTransform()
        const currentLocal = seg.getLocalTransform()
        const localInv = currentLocal.inverse()
        if (!localInv) return null
        const parentGlobal = currentWorld.multiply(localInv)
        const parentInv = parentGlobal.inverse()
        if (!parentInv) return null
        return parentInv.multiply(targetWorld)
    }

    /**
     * Apply a pre-computed local Tm to a source segment, replacing its
     * positioning ops and rebuilding the parent TextBlock.
     */
    /** @internal */
    static _applySourceShift(src: Text, newLocal: Matrix): void {
        const parentBlock = src.parent
        if (!parentBlock) return

        // Invalidate cached text state since ops are being modified
        src._cachedTextState = undefined

        const newTmOp = SetTextMatrixOp.create(
            newLocal.a,
            newLocal.b,
            newLocal.c,
            newLocal.d,
            newLocal.e,
            newLocal.f,
        )

        // Collect TL side-effects from any MoveTextLeadingOp (TD) that
        // will be stripped.  TD sets TL = -ty; this must be preserved
        // because TL persists in the graphics state and later T* ops
        // in other BT blocks depend on it.
        const tlOps: SetTextLeadingOp[] = []
        for (const o of src.ops) {
            if (o instanceof MoveTextLeadingOp) {
                tlOps.push(SetTextLeadingOp.create(-o.y))
            }
        }

        // Find and replace the existing positioning op
        const tmIdx = src.ops.findIndex((o) => o instanceof SetTextMatrixOp)
        if (tmIdx !== -1) {
            src.ops[tmIdx] = newTmOp
            // The new Tm is absolute — strip any relative positioning ops
            // (Td/TD/T*) that would shift on top of it.
            src.ops = src.ops.filter(
                (o) =>
                    !(o instanceof MoveTextOp) &&
                    !(o instanceof MoveTextLeadingOp) &&
                    !(o instanceof NextLineOp),
            )
            // Re-inject TL ops to preserve the text leading side-effect
            if (tlOps.length > 0) {
                const insertIdx = src.ops.indexOf(newTmOp)
                src.ops.splice(insertIdx, 0, ...tlOps)
            }
            if (parentBlock instanceof TextBlock) {
                parentBlock.rebuildOpsFromSegments()
            }
            return
        }

        // No Tm — replace Td/TD/T* with Tm
        src.ops = src.ops.filter(
            (o) =>
                !(o instanceof MoveTextOp) &&
                !(o instanceof MoveTextLeadingOp) &&
                !(o instanceof NextLineOp),
        )
        const showIdx = src.ops.findIndex(
            (o) =>
                o instanceof ShowTextOp ||
                o instanceof ShowTextArrayOp ||
                o instanceof ShowTextNextLineOp ||
                o instanceof ShowTextNextLineSpacingOp,
        )
        if (showIdx !== -1) {
            src.ops.splice(showIdx, 0, ...tlOps, newTmOp)
        } else {
            src.ops.push(...tlOps, newTmOp)
        }
        if (parentBlock instanceof TextBlock) {
            parentBlock.rebuildOpsFromSegments()
        }
    }

    override get page(): PdfPage | undefined {
        return super.page ?? this.prev?.page
    }

    get text(): string {
        const textOp = this.ops.find(
            (x) =>
                x instanceof ShowTextOp ||
                x instanceof ShowTextArrayOp ||
                x instanceof ShowTextNextLineOp ||
                x instanceof ShowTextNextLineSpacingOp,
        )
        if (!textOp) {
            return ''
        }

        // All text ops now have decodeWithFont method
        return textOp.decodeWithFont(this.font)
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

        // Default to 1 rather than 12 — when no Tf is set, the text
        // matrix (Tm) typically encodes the effective font size.  Using 1
        // avoids double-scaling in getLocalBoundingBox / getTextAdvance.
        return this.prev?.fontSize ?? 1
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
            return ShowTextOp.create(this.font.encode(text))
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
            return ShowTextOp.create(this.font.encode(entries[0].text))
        }

        const segments: ShowTextSegment[] = entries.map((e) =>
            'kern' in e ? new PdfNumber(e.kern) : this.font.encode(e.text),
        )

        return ShowTextArrayOp.create(segments)
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

        /**
         * Measure the advance of a string operand using glyph codes
         * (not decoded Unicode).  For hex strings the raw CID codes are
         * extracted; for literal strings the raw byte values are used.
         */
        const measureOperand = (
            operand: PdfString | PdfHexadecimal,
        ): number => {
            const codes = font.extractGlyphCodes(operand)
            let total = 0
            for (const code of codes) {
                // Per PDF spec, characters outside the font's Widths range
                // use MissingWidth from the font descriptor (default 0).
                total += font.getCharacterWidth(code, fontSize) ?? 0
                total += tc
                if (code === 32) total += tw // ASCII space
            }
            return total
        }

        let total = 0
        let sawShowOp = false

        for (const op of this.ops) {
            if (op instanceof ShowTextOp) {
                sawShowOp = true
                const operand = op.stringOperand
                if (operand) total += measureOperand(operand)
            } else if (op instanceof ShowTextArrayOp) {
                sawShowOp = true
                for (const segment of op.segments) {
                    if (segment instanceof PdfNumber) {
                        // TJ numeric entries are kern adjustments in
                        // thousandths of a unit of text space — they
                        // *reduce* the advance.
                        total -= (segment.value / 1000) * fontSize
                    } else {
                        total += measureOperand(segment)
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
        if (this._cachedTextState) return this._cachedTextState

        let tm: Matrix
        let tlm: Matrix

        // Short-circuit: if this segment has an absolute Tm operator,
        // the prev chain's text matrix is irrelevant — Tm overrides both
        // tm and tlm completely.  Skip the expensive recursion.
        const hasTmOp = this.ops.some((o) => o instanceof SetTextMatrixOp)

        if (this.prev && !hasTmOp) {
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

        const result = { tm, tlm }
        this._cachedTextState = result
        return result
    }

    getLocalTransform(): Matrix {
        return this.resolveTextState().tm
    }

    getLocalBoundingBox(): BoundingBox {
        const fontSize = this.fontSize
        const descenderHeight = fontSize * 0.3
        const ascenderHeight = fontSize * 0.95
        const textWidth = this.getTextAdvance()
        // Add a small right-side padding to account for the last glyph's
        // visual extent beyond its advance width (glyph overhang).
        const overhang = fontSize * 0.05

        return {
            x: 0,
            y: -descenderHeight,
            width: textWidth + overhang,
            height: ascenderHeight + descenderHeight,
        }
    }
}

export class TextBlock extends ContentNode {
    protected segments: Text[] = []
    prev?: TextBlock

    constructor(page?: PdfPage, ops?: ContentOp[], prev?: TextBlock) {
        super(ops)
        this.page = page
        this.prev = prev
        this.parseSegments()
    }

    /** @internal */
    parseSegments(): void {
        const segments: Text[] = []
        let currentOps: ContentOp[] = []
        // Link the first segment's prev to the last segment of the previous
        // TextBlock so that font/size state carries across BT/ET boundaries.
        let lastSegment: Text | undefined = this.prev?.getSegments().at(-1)

        for (const op of this.ops) {
            if (op instanceof BeginTextOp || op instanceof EndTextOp) {
                continue
            }

            currentOps.push(op)
            if (op instanceof ShowTextOp || op instanceof ShowTextArrayOp) {
                const segment = new Text(currentOps, this.page)
                segment.prev = lastSegment ?? undefined
                segment.parent = this
                segments.push(segment)
                currentOps = []
                lastSegment = segment
            }
        }

        // If there are leftover ops without a show operator, create an empty segment
        // This preserves positioning and font ops even without text
        if (currentOps.length > 0) {
            const segment = new Text(currentOps, this.page)
            segment.prev = lastSegment ?? undefined
            segment.parent = this
            segments.push(segment)
        }

        this.segments = segments
    }

    getSegments() {
        return this.segments
    }

    addSegment(segment: Text): void {
        segment.parent = this
        segment.prev = this.segments[this.segments.length - 1]
        this.segments.push(segment)
        // Rebuild ops to keep it in sync with segments
        this.rebuildOpsFromSegments()
    }

    get text(): string {
        return this.segments.map((l) => l.text).join('')
    }

    toString(): string {
        if (this.segments.length === 0) {
            return this.ops.map((o) => o.toString()).join('\n')
        }
        // Serialize as BT <all ops> ET
        // We serialize from this.ops to preserve order and include non-segment ops
        const parts: string[] = []
        for (const op of this.ops) {
            if (!(op instanceof BeginTextOp) && !(op instanceof EndTextOp)) {
                parts.push(op.toString())
            }
        }
        return `BT\n${parts.join('\n')}\nET`
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

        // Rebuild ops array from segments to keep it in sync
        this.rebuildOpsFromSegments()
    }

    /**
     * Edit this text block's content, modifying the original content-stream
     * in-place when source segment references are available (i.e. this block
     * was produced by `regroupTextBlocks`).  Falls back to direct mutation
     * when no source references exist.
     */
    editText(newText: string): void {
        const segments = this.getSegments()
        if (segments.length === 0) {
            this.text = newText
            return
        }

        const first = segments[0]

        // Detect multi-font blocks (e.g. Type3 glyph subsets where each
        // character may use a different font resource).
        const withSource = segments.filter((s) => s._sourceSegment)
        if (withSource.length > 1) {
            const srcFonts = new Set(
                withSource.map((s) => s._sourceSegment!.font),
            )
            if (srcFonts.size > 1) {
                this._editTextMultiFont(newText, withSource, srcFonts)
                return
            }
        }

        // Single-font path
        const font = first?.font
        if (font) {
            const bad = font.unsupportedChars(newText)
            if (bad.length > 0) {
                const available = font.reverseToUnicodeMap
                const chars = available
                    ? [...available.keys()].sort().join('')
                    : '(unknown)'
                throw new Error(
                    `Font "${font.fontName ?? 'subset'}" cannot render: ${bad.map((c) => `'${c}'`).join(', ')}. Available: ${chars}`,
                )
            }
        }

        if (first?._sourceSegment) {
            first.replaceTextInSource(newText)
            for (let i = 1; i < segments.length; i++) {
                segments[i].clearSourceOps()
            }
        } else {
            this.text = newText
        }
    }

    /**
     * Edit text for blocks spanning multiple font subsets (e.g. Type3).
     * Rebuilds the source TextBlock with proper absolute positioning for
     * each character, using the correct font subset for each glyph.
     */
    private _editTextMultiFont(
        newText: string,
        withSource: Text[],
        fonts: Set<PdfFont>,
    ): void {
        const fontList = [...fonts]
        const findFont = (ch: string): PdfFont | undefined =>
            fontList.find((f) => f.reverseToUnicodeMap?.has(ch))

        // Validate all characters can be encoded by some font
        const chars = [...newText]
        const bad = [...new Set(chars.filter((ch) => !findFont(ch)))]
        if (bad.length > 0) {
            const allChars = [
                ...new Set(
                    fontList.flatMap((f) => [
                        ...(f.reverseToUnicodeMap?.keys() ?? []),
                    ]),
                ),
            ]
                .sort()
                .join('')
            throw new Error(
                `Cannot encode: ${bad.map((c) => `'${c}'`).join(', ')}. Available characters: ${allChars}`,
            )
        }

        // Build font → resource name map from source segments' Tf ops
        const fontResName = new Map<PdfFont, string>()
        for (const seg of withSource) {
            const src = seg._sourceSegment!
            const f = src.font
            if (!fontResName.has(f)) {
                const tf = src.ops.find((o) => o instanceof SetFontOp) as
                    | SetFontOp
                    | undefined
                fontResName.set(f, tf?.fontName ?? f.resourceName)
            }
        }

        // Get the first SOURCE segment's local Tm as the anchor.
        // This is in the content stream's coordinate space (before CTM),
        // which is where the rebuilt ops need to live.
        const firstSrc = withSource[0]._sourceSegment!
        const firstSrcTm = firstSrc.getLocalTransform()
        const fontSize = firstSrc.fontSize

        // Compute the scale factor from the source Tm
        const scale = Math.hypot(firstSrcTm.a, firstSrcTm.b)

        // Compute the text direction unit vector from the source Tm
        const ux = scale !== 0 ? firstSrcTm.a / scale : 1
        const uy = scale !== 0 ? firstSrcTm.b / scale : 0

        // Collect all unique source parent TextBlocks
        const parentBlocks = new Set<TextBlock>()
        for (const seg of withSource) {
            const parent = seg._sourceSegment?.parent
            if (parent instanceof TextBlock) parentBlocks.add(parent)
        }

        // Build new ops for the first parent TextBlock, positioning each
        // character at the correct absolute position using Tm.
        const newBlockOps: ContentOp[] = [new BeginTextOp()]
        let cursorX = firstSrcTm.e
        let cursorY = firstSrcTm.f
        let prevFont: PdfFont | undefined

        for (const ch of chars) {
            const font = findFont(ch)!
            const rn = fontResName.get(font) ?? font.resourceName
            const encoded = font.encode(ch)

            // Emit Tf if font changed
            if (font !== prevFont) {
                newBlockOps.push(SetFontOp.create(rn, fontSize))
                prevFont = font
            }

            // Emit absolute Tm for this character
            newBlockOps.push(
                SetTextMatrixOp.create(
                    firstSrcTm.a,
                    firstSrcTm.b,
                    firstSrcTm.c,
                    firstSrcTm.d,
                    cursorX,
                    cursorY,
                ),
            )

            // Emit the show op
            newBlockOps.push(ShowTextOp.create(encoded))

            // Advance cursor by this character's width in source space
            const rev = font.reverseToUnicodeMap
            const glyphCode = rev?.get(ch)
            if (glyphCode !== undefined) {
                const charWidth =
                    font.getCharacterWidth(glyphCode, fontSize) ?? 0
                cursorX += charWidth * ux * scale
                cursorY += charWidth * uy * scale
            }
        }

        newBlockOps.push(new EndTextOp())

        // Apply: replace the first parent block's ops with the rebuilt ones,
        // and clear all other parent blocks' source segments.
        const firstParent = withSource[0]._sourceSegment?.parent
        if (firstParent instanceof TextBlock) {
            firstParent.ops = newBlockOps
            firstParent.parseSegments()
        }

        // Clear source segments from other parent blocks
        for (const seg of withSource) {
            const parent = seg._sourceSegment?.parent
            if (parent && parent !== firstParent) {
                seg.clearSourceOps()
            }
        }
    }

    /**
     * Rebuild the ops array from segments.
     * Used after programmatic modifications to keep ops in sync.
     */
    rebuildOpsFromSegments(): void {
        // Clear cached text state since ops may have changed
        for (const seg of this.segments) {
            seg._cachedTextState = undefined
        }
        const newOps: ContentOp[] = [new BeginTextOp()]
        for (const seg of this.segments) {
            newOps.push(...seg.ops)
        }
        newOps.push(new EndTextOp())
        this.ops = newOps
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

            if (hasTm) {
                // Shift every existing Tm in-place (world-space: adjust e,f directly)
                const tmOps = seg.ops.filter(
                    (o) => o instanceof SetTextMatrixOp,
                )
                for (const op of tmOps) {
                    const m = op.matrix
                    op.matrix = new Matrix({
                        a: m.a,
                        b: m.b,
                        c: m.c,
                        d: m.d,
                        e: m.e + dx,
                        f: m.f + dy,
                    })
                }
            } else {
                // Replace relative positioning ops (Td/TD/T*) with an
                // absolute Tm derived from the pre-resolved position.
                // Preserve TL side-effects from any TD ops being stripped.
                const tlOps: SetTextLeadingOp[] = []
                for (const o of seg.ops) {
                    if (o instanceof MoveTextLeadingOp) {
                        tlOps.push(SetTextLeadingOp.create(-o.y))
                    }
                }
                const m = tm!
                const shifted = new Matrix({
                    a: m.a,
                    b: m.b,
                    c: m.c,
                    d: m.d,
                    e: m.e + dx,
                    f: m.f + dy,
                })
                seg.ops = seg.ops.filter(
                    (o) =>
                        !(o instanceof MoveTextOp) &&
                        !(o instanceof MoveTextLeadingOp) &&
                        !(o instanceof NextLineOp),
                )
                // Insert the new absolute Tm before the first show op
                const showIdx = seg.ops.findIndex(
                    (o) =>
                        o instanceof ShowTextOp ||
                        o instanceof ShowTextArrayOp ||
                        o instanceof ShowTextNextLineOp ||
                        o instanceof ShowTextNextLineSpacingOp,
                )
                const tmOp = SetTextMatrixOp.create(
                    shifted.a,
                    shifted.b,
                    shifted.c,
                    shifted.d,
                    shifted.e,
                    shifted.f,
                )
                if (showIdx !== -1) {
                    seg.ops.splice(showIdx, 0, ...tlOps, tmOp)
                } else {
                    seg.ops.push(...tlOps, tmOp)
                }
            }
        }

        this.rebuildOpsFromSegments()

        // Batch source shifts: compute all new positions BEFORE writing
        // any.  Source segments in the same parent TextBlock share a prev
        // chain; writing one shifts the chain so later reads return stale
        // values.
        const sourceMoves: { src: Text; newLocal: Matrix }[] = []
        const movedSrcs = new Set<Text>()
        for (const seg of this.segments) {
            const src = seg._sourceSegment
            if (!src) continue
            const newLocal = Text._computeSourceShift(src, dx, dy)
            if (newLocal) {
                sourceMoves.push({ src, newLocal })
                movedSrcs.add(src)
            }
        }

        // Identify all parent TextBlocks that contain a moved source.
        // For each, snapshot EVERY sibling segment's world transform so
        // we can pin their positions after the moved segments change.
        const affectedParents = new Set<TextBlock>()
        for (const { src } of sourceMoves) {
            if (src.parent instanceof TextBlock) {
                affectedParents.add(src.parent)
            }
        }
        const siblingSnaps = new Map<Text, Matrix>()
        for (const parent of affectedParents) {
            for (const sib of parent.getSegments()) {
                if (!movedSrcs.has(sib)) {
                    siblingSnaps.set(sib, sib.getWorldTransform())
                }
            }
        }

        // Apply the source shifts.
        for (const { src, newLocal } of sourceMoves) {
            Text._applySourceShift(src, newLocal)
        }

        // Pin non-moved siblings to their original positions by converting
        // them to absolute Tm.  This prevents Td-based siblings from
        // drifting when a prior segment in the prev chain was shifted.
        for (const [sib, oldWorld] of siblingSnaps) {
            const newLocal = Text._computeLocalFromWorld(sib, oldWorld)
            if (newLocal) Text._applySourceShift(sib, newLocal)
        }
    }

    /**
     * Regroup `Text` segments from the given blocks into new `TextBlock`s
     * such that each output block contains segments that appear on the same
     * visual line when rendered.
     *
     * Each baked segment carries standalone state (Tf, Tc, Tw, TL) plus an
     * absolute `Tm` derived from its original world transform, so the output
     * blocks are self-contained and safe to re-serialize.
     *
     * Contract: because the baked `Tm` is world-absolute, the returned blocks
     * must be placed under an ancestor whose composed `cm` is identity
     * (e.g. directly under the content stream root, or an identity
     * `StateNode`). Otherwise glyphs will be double-transformed.
     */
    static regroupTextBlocks(blocks: TextBlock[]): TextBlock[] {
        type Descriptor = {
            wtm: Matrix
            font: PdfFont
            fontResourceName: string
            fontSize: number
            charSpace: number
            wordSpace: number
            textLeading: number
            text: string
            showOp: ContentOp | null
            sourceSegment: Text
            fontType: string | undefined
            orientationKey: string
            lineCoord: number
            alongCoord: number
            textAdvance: number
            effectiveFontSize: number
            order: number
        }

        const descriptors: Descriptor[] = []
        let order = 0

        for (const block of blocks) {
            for (const seg of block.getSegments()) {
                const text = seg.text
                // Skip segments that have no show operator and no text —
                // they are pure positioning/state and should not create
                // their own visual line band.
                const hasShowOp = seg.ops.some(
                    (o) =>
                        o instanceof ShowTextOp ||
                        o instanceof ShowTextArrayOp ||
                        o instanceof ShowTextNextLineOp ||
                        o instanceof ShowTextNextLineSpacingOp,
                )
                if (!hasShowOp && !text) continue

                const wtm = seg.getWorldTransform()
                const len = Math.hypot(wtm.a, wtm.b) || 1
                const ux = { x: wtm.a / len, y: wtm.b / len }
                const py = { x: -wtm.b / len, y: wtm.a / len }
                const lineCoord = wtm.e * py.x + wtm.f * py.y
                const alongCoord = wtm.e * ux.x + wtm.f * ux.y
                const angle = Math.atan2(wtm.b, wtm.a)
                const orientationKey = (
                    Math.round(angle * 1000) / 1000
                ).toFixed(3)

                // Reuse original show op verbatim to preserve kerning.
                // `'` and `"` operators also advance lines, so fall back to
                // a plain Tj with the decoded text in that case.
                // For empty segments, showOp can be null
                let showOp: ContentOp | null =
                    seg.ops.findLast(
                        (o) =>
                            o instanceof ShowTextOp ||
                            o instanceof ShowTextArrayOp,
                    ) ?? null
                if (!showOp && text) {
                    showOp = ShowTextOp.create(text)
                }

                // Capture the resource name from the Tf op so we
                // can faithfully recreate it in the baked segment.
                // Walk the prev chain like the `font` getter does.
                let fontResourceName: string | undefined
                let walk: Text | undefined = seg
                while (walk) {
                    const tf = walk.ops.find((o) => o instanceof SetFontOp) as
                        | SetFontOp
                        | undefined
                    if (tf) {
                        fontResourceName = tf.fontName
                        break
                    }
                    walk = walk.prev
                }
                fontResourceName ??= seg.font.resourceName

                descriptors.push({
                    wtm,
                    font: seg.font,
                    fontResourceName,
                    fontSize: seg.fontSize,
                    charSpace: seg.charSpace,
                    wordSpace: seg.wordSpace,
                    textLeading: seg.textLeading,
                    text,
                    showOp,
                    sourceSegment: seg,
                    fontType: seg.font.fontType,
                    orientationKey,
                    lineCoord,
                    alongCoord,
                    textAdvance: seg.getTextAdvance() * len,
                    effectiveFontSize: seg.fontSize * len,
                    order: order++,
                })
            }
        }

        // Bucket by orientation so only identically-rotated segments can
        // share a line.
        const buckets = new Map<string, Descriptor[]>()
        for (const d of descriptors) {
            const arr = buckets.get(d.orientationKey) ?? []
            arr.push(d)
            buckets.set(d.orientationKey, arr)
        }

        type Band = {
            descriptors: Descriptor[]
            bandCoord: number
            bandSize: number
            firstOrder: number
        }
        const bands: Band[] = []

        for (const bucket of buckets.values()) {
            // Sort by line coord descending (PDF user space is y-up).
            const sorted = [...bucket].sort((a, b) => b.lineCoord - a.lineCoord)

            const bucketBands: Band[] = []
            for (const d of sorted) {
                const current = bucketBands[bucketBands.length - 1]
                if (current) {
                    const tolerance =
                        0.5 * Math.min(current.bandSize, d.effectiveFontSize)
                    if (
                        Math.abs(d.lineCoord - current.bandCoord) <= tolerance
                    ) {
                        current.descriptors.push(d)
                        current.firstOrder = Math.min(
                            current.firstOrder,
                            d.order,
                        )
                        continue
                    }
                }
                bucketBands.push({
                    descriptors: [d],
                    bandCoord: d.lineCoord,
                    bandSize: d.effectiveFontSize,
                    firstOrder: d.order,
                })
            }
            bands.push(...bucketBands)
        }

        // Sub-split each band by font resource name and font size so
        // segments with different fonts or sizes become separate TextBlocks.
        // Exception: Type3 fonts are glyph subsets — each character may use
        // a different resource name even though they belong to the same
        // visual typeface.  Group all Type3 segments at the same size together.
        type FontBand = Band & { parentDescriptors: Descriptor[] }
        const splitBands: FontBand[] = []
        for (const band of bands) {
            const byFont = new Map<string, Descriptor[]>()
            for (const d of band.descriptors) {
                const fontKey =
                    d.fontType === 'Type3'
                        ? 'Type3' + '\0' + d.fontSize
                        : d.fontResourceName + '\0' + d.fontSize
                const arr = byFont.get(fontKey) ?? []
                arr.push(d)
                byFont.set(fontKey, arr)
            }
            for (const descs of byFont.values()) {
                splitBands.push({
                    descriptors: descs,
                    bandCoord: band.bandCoord,
                    bandSize: band.bandSize,
                    firstOrder: Math.min(...descs.map((d) => d.order)),
                    parentDescriptors: band.descriptors,
                })
            }
        }

        // Sub-split each font band by horizontal gap so segments that
        // are far apart along the text direction become separate TextBlocks.
        // Also split when a segment from a different font sits between two
        // consecutive same-font segments (e.g. bold "and" between regular text).
        // Threshold: a gap larger than 3× the effective font size.
        const gapBands: Band[] = []
        for (const band of splitBands) {
            const sorted = [...band.descriptors].sort(
                (a, b) => a.alongCoord - b.alongCoord,
            )
            // Collect descriptors from other fonts on the same baseline
            // band, sorted by alongCoord, for interleaving detection.
            // For Type3 fonts, all Type3 segments share one group, so only
            // non-Type3 segments on the same band are "other".
            const firstDesc = sorted[0]
            const otherFontDescs = band.parentDescriptors
                .filter((d) => {
                    if (firstDesc.fontType === 'Type3') {
                        return d.fontType !== 'Type3'
                    }
                    return d.fontResourceName !== firstDesc.fontResourceName
                })
                .sort((a, b) => a.alongCoord - b.alongCoord)

            let current: Descriptor[] = [sorted[0]]
            for (let i = 1; i < sorted.length; i++) {
                const prev = current[current.length - 1]
                const prevEnd = prev.alongCoord + prev.textAdvance
                const gap = sorted[i].alongCoord - prevEnd
                const threshold =
                    3 *
                    Math.min(
                        prev.effectiveFontSize,
                        sorted[i].effectiveFontSize,
                    )

                // Check if a different-font segment sits between prev and sorted[i]
                const hasInterleaved = otherFontDescs.some(
                    (d) =>
                        d.alongCoord >= prevEnd - 1 &&
                        d.alongCoord + d.textAdvance <=
                            sorted[i].alongCoord + 1,
                )

                if (gap > threshold || hasInterleaved) {
                    gapBands.push({
                        descriptors: current,
                        bandCoord: band.bandCoord,
                        bandSize: band.bandSize,
                        firstOrder: Math.min(...current.map((d) => d.order)),
                    })
                    current = [sorted[i]]
                } else {
                    current.push(sorted[i])
                }
            }
            gapBands.push({
                descriptors: current,
                bandCoord: band.bandCoord,
                bandSize: band.bandSize,
                firstOrder: Math.min(...current.map((d) => d.order)),
            })
        }

        // Stable output order: follow original segment ordering.
        gapBands.sort((a, b) => a.firstOrder - b.firstOrder)

        const firstPage = blocks[0]?.page
        const result: TextBlock[] = []
        for (const band of gapBands) {
            const sortedSegs = [...band.descriptors].sort(
                (a, b) => a.alongCoord - b.alongCoord,
            )

            const newBlock = new TextBlock(firstPage)

            for (const d of sortedSegs) {
                const newOps: ContentOp[] = []
                newOps.push(SetFontOp.create(d.fontResourceName, d.fontSize))
                if (d.textLeading !== 0) {
                    newOps.push(SetTextLeadingOp.create(d.textLeading))
                }
                if (d.charSpace !== 0) {
                    newOps.push(SetCharSpacingOp.create(d.charSpace))
                }
                if (d.wordSpace !== 0) {
                    newOps.push(SetWordSpacingOp.create(d.wordSpace))
                }
                newOps.push(
                    SetTextMatrixOp.create(
                        d.wtm.a,
                        d.wtm.b,
                        d.wtm.c,
                        d.wtm.d,
                        d.wtm.e,
                        d.wtm.f,
                    ),
                )
                if (d.showOp) {
                    newOps.push(d.showOp)
                }

                const newSeg = new Text(newOps, firstPage)
                newSeg._sourceSegment = d.sourceSegment
                newBlock.addSegment(newSeg)
            }

            result.push(newBlock)
        }

        return result
    }
}

export class GraphicsBlock extends ContentNode {
    constructor(page?: PdfPage, ops?: ContentOp[]) {
        super(ops)
        this.page = page
    }

    toString(): string {
        return this.ops.map((o) => o.toString()).join('\n')
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

        for (const op of this.ops) {
            parts.push(op.toString())
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

export class PdfContentStream extends PdfStream {
    _nodes: ContentNode[] | undefined
    /** @internal Root StateNode; preserves top-level ops (e.g. cm before q). */
    _rootNode: StateNode | undefined
    page?: PdfPage

    constructor(
        options:
            | {
                  header: PdfDictionary
                  original: ByteArray | string
                  isModified?: boolean
              }
            | ByteArray
            | string = '',
    ) {
        super(options)
    }

    get nodes(): ContentNode[] {
        if (!this._nodes) {
            this._nodes = this.parseNodes()
        }
        return this._nodes
    }

    /** Serialize the node tree back to a content-stream string. */
    private serializeNodes(): string {
        const parts: string[] = []
        // Emit root-level ops (e.g. cm transforms that appear before the
        // first q/BT).  These belong to the implicit root StateNode and
        // must NOT be wrapped in q/Q.
        if (this._rootNode) {
            for (const op of this._rootNode.ops) {
                parts.push(op.toString())
            }
        }
        if (this._nodes) {
            for (const n of this._nodes) {
                parts.push(n.toString())
            }
        }
        return parts.join('\n')
    }

    get dataAsString(): string {
        if (this._nodes) {
            return this.serializeNodes()
        }
        return super.dataAsString
    }

    set dataAsString(value: string) {
        this._nodes = undefined
        this._rootNode = undefined
        super.dataAsString = value
    }

    protected getRawData(): ByteArray | undefined {
        if (this._nodes === undefined) return undefined
        const contentString = this.serializeNodes()
        return stringToBytes(contentString)
    }

    protected tokenize(): PdfToken[] {
        const rawData = this.getRawData()
        if (rawData) {
            // Use the data setter so the bytes are properly re-encoded
            // through any existing filters (e.g. FlateDecode).
            this.data = rawData
        }
        return super.tokenize()
    }

    private parseNodes(): ContentNode[] {
        const contentString = this.dataAsString
        if (!contentString) return []

        const ops = PdfContentStreamTokeniser.tokenise(contentString)
        const root = PdfContentStream.buildNodeTree(ops, this.page)
        this._rootNode = root
        return root.getChildren()
    }

    static buildNodeTree(ops: ContentOp[], page?: PdfPage): StateNode {
        const root = new StateNode(page)
        const stateStack: StateNode[] = []

        let textOps: ContentOp[] = []
        let graphicsOps: (PaintOp | PathOp | ColorOp)[] = []
        let currentState: StateNode = root
        let inTextBlock = false
        // Track the previous TextBlock so segments can inherit font state
        // across BT/ET boundaries without modifying the original ops.
        let lastTextBlock: TextBlock | undefined
        // Save/restore lastTextBlock along with the graphics state stack
        // so that q/Q correctly revert font inheritance across BT blocks.
        const textBlockStack: (TextBlock | undefined)[] = []

        for (const op of ops) {
            if (op instanceof BeginTextOp) {
                // Flush any stray graphics ops (e.g. color state) before BT
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                textOps.push(op)
                inTextBlock = true
                continue
            }

            if (op instanceof EndTextOp) {
                textOps.push(op)
                inTextBlock = false
                // Only add non-empty text blocks
                const block = new TextBlock(page, textOps, lastTextBlock)
                if (block.getSegments().length > 0) {
                    currentState.addChild(block)
                    lastTextBlock = block
                }
                textOps = []
                continue
            }

            // If we're inside a text block, collect ALL ops (not just TextOps)
            // This includes marked content operators like BDC, EMC
            if (inTextBlock) {
                textOps.push(op)
                continue
            }

            if (op instanceof SaveStateOp) {
                // Flush any stray graphics ops before entering a new state
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                const group = new StateNode(page)
                currentState.addChild(group)
                stateStack.push(currentState)
                textBlockStack.push(lastTextBlock)
                currentState = group
                continue
            }

            if (op instanceof RestoreStateOp) {
                // Flush any stray graphics ops before restoring state
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                if (stateStack.length > 0) {
                    currentState = stateStack.pop()!
                    lastTextBlock = textBlockStack.pop()
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
            } else {
                // Preserve all other ops (e.g. marked-content BDC/EMC,
                // XObject invocations, inline images, etc.) so they
                // round-trip faithfully through serialization.
                for (const g of graphicsOps) currentState.ops.push(g)
                graphicsOps = []
                currentState.ops.push(op)
            }
        }

        // Preserve any stray graphics ops (e.g. color state ops that appear
        // before any paint op) as root-level ops so they round-trip correctly.
        if (graphicsOps.length > 0) {
            for (const op of graphicsOps) {
                currentState.ops.push(op)
            }
        }

        return root
    }
}

export class PdfContentStreamObject extends PdfIndirectObject<PdfContentStream> {
    static ContentNode = ContentNode
    static StateNode = StateNode
    static GraphicsBlock = GraphicsBlock
    static TextBlock = TextBlock

    private _page?: PdfPage

    get page(): PdfPage | undefined {
        return this._page
    }

    set page(value: PdfPage | undefined) {
        this._page = value
        this.content.page = value
    }

    constructor(object?: PdfIndirectObject) {
        super(object)

        if (!(object?.content instanceof PdfStream)) {
            throw new Error('Content stream object must have a stream content')
        }

        this.content = new PdfContentStream({
            header: object?.content?.header,
            original: object?.content?.raw,
        })
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
        // Return text blocks as-is for round-trip preservation
        // Users can call regroupTextBlocksByLine() explicitly if they want visual regrouping
        return collect(this.nodes)
    }

    /**
     * Regroup text blocks by visual line position.
     * This converts positioning operators (Td, TD) to absolute matrices (Tm) for each segment.
     */
    regroupTextBlocksByLine(): TextBlock[] {
        return TextBlock.regroupTextBlocks(this.textBlocks)
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
