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
    SetWordSpacingOp,
    ShowTextArrayOp,
    ShowTextNextLineOp,
    ShowTextNextLineSpacingOp,
    ShowTextOp,
    ShowTextSegment,
} from '../ops/text'
import {
    ColorOp,
    SetFillColorCMYKOp,
    SetFillColorGrayOp,
    SetFillColorRGBOp,
} from '../ops/color'
import { Rect } from '../geom/rect'
import { ContentNode } from './content-node'
import { ContentOp } from '../ops'

export class TextNode extends ContentNode {
    prev?: TextNode

    /**
     * Compute the new local Tm that a segment should have after a
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
     * `seg`, accounting for its parent's composed transform.  Pure.
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
     * Apply a pre-computed local Tm to a segment, replacing its
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
            this.ops[tmIdx] = newTmOp
            // The new Tm is absolute — strip any relative positioning ops
            // (Td/TD/T*) that would shift on top of it.
            this.ops = this.ops.filter(
                (o) =>
                    !(o instanceof MoveTextOp) &&
                    !(o instanceof MoveTextLeadingOp) &&
                    !(o instanceof NextLineOp),
            )
            // Re-inject TL ops to preserve the text leading side-effect
            if (tlOps.length > 0) {
                const insertIdx = this.ops.indexOf(newTmOp)
                this.ops.splice(insertIdx, 0, ...tlOps)
            }
            // Parent block's ops getter auto-syncs with segments
            return
        }

        // No Tm — replace Td/TD/T* with Tm
        this.ops = this.ops.filter(
            (o) =>
                !(o instanceof MoveTextOp) &&
                !(o instanceof MoveTextLeadingOp) &&
                !(o instanceof NextLineOp),
        )
        const showIdx = this.ops.findIndex(
            (o) =>
                o instanceof ShowTextOp ||
                o instanceof ShowTextArrayOp ||
                o instanceof ShowTextNextLineOp ||
                o instanceof ShowTextNextLineSpacingOp,
        )
        if (showIdx !== -1) {
            this.ops.splice(showIdx, 0, ...tlOps, newTmOp)
        } else {
            this.ops.push(...tlOps, newTmOp)
        }
        // Parent block's ops getter auto-syncs with segments
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

    get fillColor(): ColorOp | undefined {
        const o = this.ops.findLast(
            (o) =>
                o instanceof SetFillColorRGBOp ||
                o instanceof SetFillColorGrayOp ||
                o instanceof SetFillColorCMYKOp,
        )
        return o ?? this.prev?.fillColor
    }
}
