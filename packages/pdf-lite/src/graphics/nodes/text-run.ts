import { PdfHexadecimal, PdfNumber, PdfString } from '../../core'
import { PdfFont } from '../../fonts/pdf-font'
import { PdfPage } from '../../pdf/pdf-page'
import { Matrix } from '../geom/matrix'
import {
    MoveTextLeadingOp,
    MoveTextOp,
    NextLineOp,
    SetCharSpacingOp,
    SetFontOp,
    SetTextLeadingOp,
    SetTextMatrixOp,
    SetTextRenderingModeOp,
    SetWordSpacingOp,
    ShowTextArrayOp,
    ShowTextNextLineOp,
    ShowTextNextLineSpacingOp,
    ShowTextOp,
    ShowTextSegment,
} from '../ops/text'
import { SetLineWidthOp } from '../ops/state'
import {
    SetFillColorCMYKOp,
    SetFillColorGrayOp,
    SetFillColorRGBOp,
} from '../ops/color'
import { Rect } from '../geom/rect'
import { ContentNode } from './content-node'
import { ContentOp } from '../ops'
import { CMYKColor, Color, GrayColor, RGBColor } from '../color'

export class TextRun extends ContentNode {
    prev?: TextRun

    /**
     * Build an authored TextRun from structured options. Emits Tf
     * (font + size), an optional fill-colour op, a positioning op, then
     * a Tj/TJ show op encoded via the font.  The `font` PdfFont is
     * cached on the node so `.text =` writes re-encode correctly
     * without requiring a `page.fontMap` lookup.
     */
    static create(opts: {
        text: string
        font: PdfFont
        fontSize: number
        color?: Color
        /** Absolute position via Tm. */
        matrix?: Matrix
        /** Relative position via Td. Ignored when `matrix` is set. */
        move?: { dx: number; dy: number }
        /** Text rendering mode (0 = fill, 2 = fill+stroke for faux-bold). */
        renderingMode?: number
        /** Line width (used with rendering mode 2 for faux-bold stroke). */
        lineWidth?: number
    }): TextRun {
        const ops: ContentOp[] = [
            SetFontOp.create(opts.font.resourceName, opts.fontSize),
        ]
        if (opts.color) ops.push(opts.color.toOp())
        if (opts.matrix) {
            const m = opts.matrix
            ops.push(SetTextMatrixOp.create(m.a, m.b, m.c, m.d, m.e, m.f))
        } else if (opts.move) {
            ops.push(MoveTextOp.create(opts.move.dx, opts.move.dy))
        }
        if (opts.lineWidth !== undefined) {
            ops.push(SetLineWidthOp.create(opts.lineWidth))
        }
        if (opts.renderingMode !== undefined) {
            ops.push(SetTextRenderingModeOp.create(opts.renderingMode))
        }
        // Emit a plain `Tj` with font-encoded bytes. We deliberately
        // bypass `writeContentStreamText` (which emits kerned `TJ`
        // arrays when the font has kern pairs) because appearance
        // streams traditionally use simple `Tj` — callers relying on
        // byte-level output shape should get that.
        ops.push(ShowTextOp.create(opts.font.encode(opts.text)))
        const node = new TextRun(ops)
        node._fontOverride = opts.font
        return node
    }

    /**
     * Compute the new local Tm that a run should have after a
     * world-space shift of (dx, dy).  Pure — no side effects.
     */
    computeShift(dx: number, dy: number): Matrix | null {
        const oldWorld = this.getWorldTransform()
        const localTm = this.getLocalTransform()
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
     * `run`, accounting for its parent's composed transform.  Pure.
     */
    computeLocalFromWorld(targetWorld: Matrix): Matrix | null {
        const currentWorld = this.getWorldTransform()
        const currentLocal = this.getLocalTransform()
        const localInv = currentLocal.inverse()
        if (!localInv) return null
        const parentGlobal = currentWorld.multiply(localInv)
        const parentInv = parentGlobal.inverse()
        if (!parentInv) return null
        return parentInv.multiply(targetWorld)
    }

    /**
     * Apply a pre-computed local Tm to a run, replacing its
     * positioning ops and rebuilding its parent TextBlock.
     */
    applyShift(newLocal: Matrix): void {
        const parentBlock = this.parent
        if (!parentBlock) return

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
        for (const o of this.ops) {
            if (o instanceof MoveTextLeadingOp) {
                tlOps.push(SetTextLeadingOp.create(-o.y))
            }
        }

        // Find and replace the existing positioning op
        const tmIdx = this.ops.findIndex((o) => o instanceof SetTextMatrixOp)
        if (tmIdx !== -1) {
            this.replaceOrAddOp(this.ops[tmIdx], newTmOp)
            // The new Tm is absolute — strip any relative positioning ops
            // (Td/TD/T*) that would shift on top of it.
            this.removeOpsWhere(
                (o) =>
                    o instanceof MoveTextOp ||
                    o instanceof MoveTextLeadingOp ||
                    o instanceof NextLineOp,
            )
            // Re-inject TL ops to preserve the text leading side-effect
            if (tlOps.length > 0) {
                const insertIdx = this.ops.indexOf(newTmOp)
                this.addOp(tlOps, insertIdx)
            }
            // Parent block's ops getter auto-syncs with runs
            return
        }

        // No Tm — strip Td/TD/T* and insert absolute Tm before the show op
        this.removeOpsWhere(
            (o) =>
                o instanceof MoveTextOp ||
                o instanceof MoveTextLeadingOp ||
                o instanceof NextLineOp,
        )
        const showIdx = this.ops.findIndex(
            (o) =>
                o instanceof ShowTextOp ||
                o instanceof ShowTextArrayOp ||
                o instanceof ShowTextNextLineOp ||
                o instanceof ShowTextNextLineSpacingOp,
        )
        this.addOp(newTmOp, showIdx === -1 ? 0 : showIdx)
        // Parent block's ops getter auto-syncs with runs
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

        // Handle split ShowTextArrayOp case: if TJ has no operands but there's a ContentOp with array
        if (textOp instanceof ShowTextArrayOp && textOp.operands.length === 0) {
            const arrayOp = this.ops.find(
                (op) => op.operands.length > 0 && Array.isArray(op.operands[0]),
            )
            if (arrayOp) {
                // Create a temporary ShowTextArrayOp with the found operands
                const tempOp = new ShowTextArrayOp('')
                tempOp.operands = arrayOp.operands
                return tempOp.decodeWithFont(this.font)
            }
        }

        // All text ops now have decodeWithFont method
        return textOp.decodeWithFont(this.font)
    }

    /**
     * Cached PdfFont for authoring from scratch — when set (via the
     * `font` setter), subsequent `.font` reads return this directly
     * without requiring a page.fontMap lookup. Preserves existing
     * round-trip semantics: for parsed nodes, `.font` still resolves
     * through the page.
     */
    private _fontOverride?: PdfFont

    get font(): PdfFont {
        if (this._fontOverride) return this._fontOverride
        const defaultFont = PdfFont.HELVETICA
        const lastTf = this.ops.find((x) => x instanceof SetFontOp)

        if (lastTf) {
            const fontName = lastTf.fontName
            return this.page?.fontMap.get(fontName) ?? defaultFont
        }

        return this.prev?.font ?? defaultFont
    }

    set font(font: PdfFont) {
        this._fontOverride = font
        const size = this.fontSize
        const tfOp = this.ops.find((x) => x instanceof SetFontOp)
        if (!tfOp) {
            const newTfOp = SetFontOp.create(font.resourceName, size)
            this.addOp(newTfOp, 0)
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
            this.addOp(newTfOp, 0)
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

    set matrix(newTm: Matrix) {
        const tmOp = this.ops.find((x) => x instanceof SetTextMatrixOp)
        const newTmOp = SetTextMatrixOp.create(
            newTm.a,
            newTm.b,
            newTm.c,
            newTm.d,
            newTm.e,
            newTm.f,
        )
        this.replaceOrAddOp(tmOp, newTmOp)
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

        const runs: ShowTextSegment[] = entries.map((e) =>
            'kern' in e ? new PdfNumber(e.kern) : this.font.encode(e.text),
        )

        return ShowTextArrayOp.create(runs)
    }

    set text(newText: string) {
        const newTextOp = this.writeContentStreamText(newText)
        const textOp = this.ops.findLast(
            (x) => x instanceof ShowTextOp || x instanceof ShowTextArrayOp,
        )
        this.replaceOrAddOp(textOp, newTextOp)
    }

    /**
     * Compute the text-space advance width of this run's show operator.
     * After Tj/TJ, the text position advances by this amount.
     *
     * For Tj: sum of glyph widths, plus Tc per glyph and Tw per space.
     * For TJ: same, summed across string runs, with each numeric
     *   run `n` contributing `-n/1000 * fontSize` (per PDF spec).
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
                for (const run of op.segments) {
                    if (run instanceof PdfNumber) {
                        // TJ numeric entries are kern adjustments in
                        // thousandths of a unit of text space — they
                        // *reduce* the advance.
                        total -= (run.value / 1000) * fontSize
                    } else {
                        total += measureOperand(run)
                    }
                }
            }
        }

        // When a show op was found but all character widths were null (font
        // has no width data), fall through to the length-based estimate
        // so gap detection in regroupTextBlocks uses the right prevEnd.
        if (sawShowOp && total > 0) return total

        // Fallback: estimate from character count and an average glyph width.
        if (this.text) {
            return this.text.length * fontSize * 0.6
        }
        return 0
    }

    /**
     * Resolve the text matrix (Tm) and text line matrix (Tlm) at the START
     * of this run's text rendering.
     * - Tm: the actual position where glyphs are placed
     * - Tlm: the base for Td/TD/T* calculations (not advanced by text rendering)
     */
    private resolveTextState(): { tm: Matrix; tlm: Matrix } {
        let tm: Matrix
        let tlm: Matrix

        // Only reset inheritance for truly absolute positioning operations
        // SetTextMatrixOp is absolute, others are typically relative
        const hasAbsolutePositioning = this.ops.some(
            (o) => o instanceof SetTextMatrixOp,
        )

        // Per PDF spec, BT resets Tm and Tlm to identity.  Only inherit the
        // text matrix from a previous run when it belongs to the **same**
        // TextBlock (same BT…ET pair).  The `prev` link may cross block
        // boundaries for graphics-state inheritance (font, Tc, Tw), but the
        // text matrix must not leak across BT boundaries.
        const sameBlock = this.prev && this.prev.parent === this.parent

        if (!hasAbsolutePositioning && sameBlock) {
            // Inherit from previous run for relative positioning
            const prevState = this.prev!.resolveTextState()
            const prevAdvance = this.prev!.getTextAdvance()
            tm = prevState.tm.translate(prevAdvance, 0)
            tlm = prevState.tlm
        } else {
            // Start fresh for absolute positioning or at a new BT boundary
            tm = Matrix.identity()
            tlm = Matrix.identity()
        }

        // Process positioning operators in this run
        for (const op of this.ops) {
            if (op instanceof SetTextMatrixOp) {
                // Tm is absolute — sets both Tm and Tlm, ignoring inheritance
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
        return result
    }

    getLocalTransform(): Matrix {
        return this.resolveTextState().tm
    }

    getLocalBoundingBox(): Rect {
        const fontSize = this.fontSize
        const descenderHeight = fontSize * 0.3
        const ascenderHeight = fontSize * 0.95
        const textWidth = this.getTextAdvance()
        // Add a small right-side padding to account for the last glyph's
        // visual extent beyond its advance width (glyph overhang).
        const overhang = fontSize * 0.05

        return new Rect({
            x: 0,
            y: -descenderHeight,
            width: textWidth + overhang,
            height: ascenderHeight + descenderHeight,
        })
    }

    get color(): Color | undefined {
        const o = this.ops.findLast(
            (o) =>
                o instanceof SetFillColorRGBOp ||
                o instanceof SetFillColorGrayOp ||
                o instanceof SetFillColorCMYKOp,
        )

        if (o instanceof SetFillColorRGBOp) {
            return new RGBColor(o.r, o.g, o.b)
        } else if (o instanceof SetFillColorGrayOp) {
            return new GrayColor(o.gray)
        } else if (o instanceof SetFillColorCMYKOp) {
            return new CMYKColor(o.c, o.m, o.y, o.k)
        }
        return this.prev?.color
    }

    set color(color: Color) {
        const op = this.ops.findLast(
            (o) =>
                o instanceof SetFillColorRGBOp ||
                o instanceof SetFillColorGrayOp ||
                o instanceof SetFillColorCMYKOp,
        )
        this.replaceOrAddOp(op, color.toOp())
    }
}
