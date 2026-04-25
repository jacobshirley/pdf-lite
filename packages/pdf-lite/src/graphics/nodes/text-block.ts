import { PdfFont } from '../../fonts/pdf-font'
import { PdfPage } from '../../pdf/pdf-page'
import { Matrix } from '../geom/matrix'
import { Point } from '../geom/point'
import { ContentOp } from '../ops/base'
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
    ShowTextNextLineOp,
    ShowTextNextLineSpacingOp,
} from '../ops/text'
import {
    SetFillColorRGBOp,
    SetFillColorGrayOp,
    SetFillColorCMYKOp,
} from '../ops/color'
import { Rect } from '../geom/rect'
import { ContentNode } from './content-node'
import { TextRun } from './text-run'
import { Color, GrayColor } from '../color'
import { ArraySegment, SentinelRef, detachedSegment } from '../../utils/arrays'
import { PdfDefaultAppearance } from '../../acroform/fields/pdf-default-appearance'
import {
    parseMarkdownSegments,
    type StyledSegment,
} from '../../utils/parse-markdown-segments'
import { RestoreStateOp, SaveStateOp, SetLineWidthOp } from '../ops/state'
import { MoveToOp, LineToOp } from '../ops/path'
import { StrokeOp } from '../ops/paint'
import { GraphicsBlock } from './graphics-block'

export class TextBlock extends ContentNode {
    protected runs: TextRun[] = []
    prev?: TextBlock
    private _strikes?: GraphicsBlock

    constructor(
        arg?: PdfPage | ArraySegment<ContentOp>,
        ops?: ContentOp[],
        prev?: TextBlock,
    ) {
        if (arg instanceof ArraySegment) {
            // Attached: run already contains BT..ET in the stream.
            super(arg)
            this.prev = prev
        } else {
            super()
            this.page = arg
            this.prev = prev
            if (ops) {
                this._ops.replaceAll(ops)
            }
        }
        if (this._ops.length > 0) this.syncSegmentsFromOps()
    }

    get strikes(): GraphicsBlock | undefined {
        return this._strikes
    }

    set strikes(g: GraphicsBlock | undefined) {
        this._strikes = g
    }

    get da(): PdfDefaultAppearance | undefined {
        const run = this.runs[0]
        if (!run) return undefined
        const tf = run.ops.find((x) => x instanceof SetFontOp)
        const fontName = tf?.fontName ?? this.prev?.da?.fontName ?? 'Helv'
        const fontSize = run.fontSize
        const color = run.color ?? this.prev?.color ?? new GrayColor(0)
        return new PdfDefaultAppearance(
            fontName,
            fontSize,
            color.toOp().toString(),
        )
    }

    /**
     * Expose `_ops` directly — since TextRun runs are now *views* into
     * `_ops.array`, their mutations already appear in `_ops`.
     */
    override get ops(): ArraySegment<ContentOp> {
        if (
            this.runs.length > 0 &&
            this.runs[0].ops.array !== this._ops.array
        ) {
            const arr: ContentOp[] = [new BeginTextOp()]
            for (const run of this.runs) for (const op of run.ops) arr.push(op)
            arr.push(new EndTextOp())
            if (this._strikes) {
                arr.push(new SaveStateOp())
                for (const op of this._strikes.ops) arr.push(op)
                arr.push(new RestoreStateOp())
            }
            this._ops.replaceAll(arr)
        }
        return this._ops
    }

    override set ops(value: ContentOp[] | ArraySegment<ContentOp>) {
        const items = Array.isArray(value) ? value : [...value]
        this._ops.replaceAll(items)
        this.runs = []
        if (this._ops.length > 0) this.syncSegmentsFromOps()
    }

    /**
     * Build TextRun views over `this._ops.array`, using show-op identity as
     * the right sentinel of each run and the previous show op (or
     * BeginTextOp) as the left sentinel.
     *
     * In attached mode, `_ops.array` is the stream's MultiArray, so TextRun
     * mutations flow directly through to the stream.  In detached mode,
     * `_ops.array` is the TextBlock's standalone backing — mutations on
     * TextRuns still appear when iterating `TextBlock.ops` without a rebuild.
     */
    private syncSegmentsFromOps(): void {
        const array = this._ops.array
        const snapshot = [...this._ops]
        const btOp = snapshot.find(
            (o): o is BeginTextOp => o instanceof BeginTextOp,
        )
        const etOp = snapshot.findLast
            ? snapshot.findLast((o): o is EndTextOp => o instanceof EndTextOp)
            : (() => {
                  for (let i = snapshot.length - 1; i >= 0; i--) {
                      if (snapshot[i] instanceof EndTextOp)
                          return snapshot[i] as EndTextOp
                  }
                  return undefined
              })()

        const isShow = (o: ContentOp): boolean =>
            o instanceof ShowTextOp ||
            o instanceof ShowTextArrayOp ||
            o instanceof ShowTextNextLineOp ||
            o instanceof ShowTextNextLineSpacingOp

        const runs: TextRun[] = []
        let lastSegment: TextRun | undefined = this.prev?.getRuns().at(-1)

        // Shared sentinel ref — the endSentinel of run N is the SAME
        // SentinelRef as the startSentinel of run N+1.  This way,
        // replacing a show op via replaceOrAddOp (which updates the ref's
        // .value) transparently updates both adjacent runs' bounds.
        let prevRef = new SentinelRef<ContentOp>(btOp ?? null)

        for (const op of snapshot) {
            if (isShow(op)) {
                const endRef = new SentinelRef<ContentOp>(op)
                const run = new ArraySegment<ContentOp>(
                    array,
                    prevRef,
                    endRef,
                    prevRef.value === null ? 0 : 1,
                    1, // include the show op itself
                )
                const node = new TextRun(run, this.page)
                node.prev = lastSegment
                node.parent = this as ContentNode
                runs.push(node)
                prevRef = endRef
                lastSegment = node
            }
        }

        // Trailing TextRun: ops between last show and ET (or end of array).
        if (etOp) {
            const etRef = new SentinelRef<ContentOp>(etOp)
            const trailing = new ArraySegment<ContentOp>(
                array,
                prevRef,
                etRef,
                prevRef.value === null ? 0 : 1,
                0, // exclusive of ET
            )
            if (trailing.length > 0) {
                const node = new TextRun(trailing, this.page)
                node.prev = lastSegment
                node.parent = this as ContentNode
                runs.push(node)
            }
        } else if (prevRef.value !== null) {
            // No ET — include any trailing ops up to end of array.
            const trailing = new ArraySegment<ContentOp>(
                array,
                prevRef,
                new SentinelRef<ContentOp>(null),
                1,
                0,
            )
            if (trailing.length > 0) {
                const node = new TextRun(trailing, this.page)
                node.prev = lastSegment
                node.parent = this as ContentNode
                runs.push(node)
            }
        }

        this.runs = runs
    }

    /** Re-build run views from the backing ops. */
    private resyncSegments(): void {
        this.runs = []
        if (this._ops.length > 0) this.syncSegmentsFromOps()
    }

    getRuns() {
        return this.runs
    }

    addRun(run: TextRun): void {
        run.parent = this
        run.prev = this.runs[this.runs.length - 1]
        this.runs.push(run)
        // ops getter auto-syncs with runs
    }

    get text(): string {
        return this.runs.map((l) => l.text).join('')
    }

    toString(): string {
        if (this.runs.length === 0) {
            return super.toString()
        }

        const ops = [new BeginTextOp()]
        for (const run of this.runs) {
            ops.push(...run.ops)
        }
        ops.push(new EndTextOp())
        return ops.map((o) => o.toString()).join('\n')
    }

    getLocalTransform(): Matrix {
        // TextBlock is just a container; runs carry their own transforms
        return Matrix.identity()
    }

    getLocalBoundingBox(): Rect {
        if (this.runs.length === 0) {
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
        }

        // Each Text run has its own transform (Tm/Td).
        // We compute each run's bbox in user space, then
        // express the union relative to this block's own transform.
        const blockTm = this.getLocalTransform()

        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity

        for (const run of this.runs) {
            const segTm = run.getLocalTransform()
            const segBbox = run.getLocalBoundingBox()

            // Transform the 4 corners of the run's local bbox
            // into user space via the run's own Tm
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

        return new Rect({
            x: (minX - blockTm.e) / xScale,
            y: (minY - blockTm.f) / yScale,
            width: (maxX - minX) / xScale,
            height: (maxY - minY) / yScale,
        })
    }

    /**
     * Set this text block's content, modifying the original content-stream
     * in-place when source run references are available (i.e. this block
     * was produced by `regroupTextBlocks`).
     */
    set text(newText: string) {
        if (this.runs.length === 0) {
            const text = new TextRun([], this.page)
            text.font = PdfFont.HELVETICA
            text.fontSize = 12
            text.text = newText
            this.addRun(text)
            return
        }

        const runs = this.getRuns()

        const first = runs[0]

        // Detect multi-font blocks (e.g. Type3 glyph subsets where each
        // character may use a different font resource).
        if (runs.length > 1) {
            const fonts = new Set(runs.map((s) => s.font))
            if (fonts.size > 1) {
                this._editTextMultiFont(newText, runs, fonts)
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

        // Replace the show op in the first run and clear the rest.
        // Then rebuild each affected real parent block from its runs.
        const isShowOp = (o: ContentOp) =>
            o instanceof ShowTextOp ||
            o instanceof ShowTextArrayOp ||
            o instanceof ShowTextNextLineOp ||
            o instanceof ShowTextNextLineSpacingOp

        const newShowOp = first.writeContentStreamText(newText)
        const op = first.ops.find(isShowOp)
        first.replaceOrAddOp(op, newShowOp)

        // Capture each extra run's backing range while all sentinels are
        // still valid, then splice the backing array directly in descending
        // order.  This avoids the "sentinel not found" failure that happens
        // when clearing run N removes a show op that run N+1 uses as
        // its start sentinel (they share a SentinelRef).
        const clearedSegs = new Set<TextRun>()
        const affectedParents = new Set<TextBlock>()
        type Job = {
            run: TextRun
            array: typeof first.ops.array
            start: number
            len: number
        }
        const jobs: Job[] = []
        for (let i = 1; i < runs.length; i++) {
            const run = runs[i]
            jobs.push({
                run,
                array: run.ops.array,
                start: run.ops.start,
                len: run.ops.length,
            })
        }
        // Group by backing array, sort each group descending by start.
        const byArray = new Map<typeof first.ops.array, Job[]>()
        for (const job of jobs) {
            const arr = byArray.get(job.array) ?? []
            arr.push(job)
            byArray.set(job.array, arr)
        }
        for (const arr of byArray.values()) {
            arr.sort((a, b) => b.start - a.start)
            for (const job of arr) {
                job.array.splice(job.start, job.len)
            }
        }
        for (const job of jobs) {
            clearedSegs.add(job.run)
            if (job.run.parent instanceof TextBlock) {
                affectedParents.add(job.run.parent as TextBlock)
            }
        }
        // Trim this block's own run list to just the first.
        this.runs.splice(1)
        // Rebuild sentinel views for affected real (attached) parent blocks.
        for (const parent of affectedParents) {
            if (parent === this) continue
            parent.runs = parent.runs.filter((s) => !clearedSegs.has(s))
            if (parent._ops.length > 0) parent.resyncSegments()
        }
    }

    /**
     * Get the font of the first run in this text block.
     */
    get font(): PdfFont | undefined {
        return this.runs[0]?.font
    }

    /**
     * Change the font of every run in this text block.  The font is
     * automatically registered in the page's /Resources/Font dictionary
     * and the resolved resource name is used in the emitted Tf op.
     *
     * The text content is re-encoded with the new font.  Throws if the new
     * font cannot encode the existing text.
     */
    set font(font: PdfFont) {
        const resName = this.page?.addFont(font) ?? font.resourceName

        // Capture all run texts BEFORE changing any font names,
        // because run.text decodes the show op using the current font.
        // Changing the Tf first would decode old bytes with the new
        // font's encoding, producing garbage.
        const segTexts = this.runs.map((run) => run.text)

        const text = segTexts.join('')
        const bad = font.unsupportedChars(text)
        if (bad.length > 0) {
            throw new Error(
                `Font "${font.fontName}" cannot render: ${bad.map((c) => `'${c}'`).join(', ')}`,
            )
        }

        // Snapshot the first run's local Tm as the anchor position.
        // We'll recompute all subsequent Tm positions based on the new
        // font's advance widths so runs don't drift apart.
        const firstTm = this.runs[0]?.getLocalTransform()

        for (let i = 0; i < this.runs.length; i++) {
            const run = this.runs[i]
            const segText = segTexts[i]

            const tfOp = run.ops.find((o) => o instanceof SetFontOp)
            run.replaceOrAddOp(tfOp, SetFontOp.create(resName, run.fontSize))

            if (!segText) continue

            const showOp = run.ops.find(
                (o) => o instanceof ShowTextOp || o instanceof ShowTextArrayOp,
            )
            if (showOp) {
                const newShow = run.writeContentStreamText(segText)
                run.replaceOrAddOp(showOp, newShow)
            }
        }

        // Recalculate Tm positions for runs 1+ based on the new font's
        // advance widths.  The first run keeps its original position;
        // each subsequent run is placed right after the cumulative
        // advance of all prior runs.  Positions are expressed in each
        // run's own local space by replacing any existing positioning
        // ops with an absolute Tm.
        if (firstTm && this.runs.length > 1) {
            const scale = Math.hypot(firstTm.a, firstTm.b) || 1
            const ux = firstTm.a / scale
            const uy = firstTm.b / scale
            let cursorX = firstTm.e
            let cursorY = firstTm.f

            for (let i = 0; i < this.runs.length; i++) {
                const run = this.runs[i]

                if (i > 0) {
                    run.removeOpsWhere(
                        (o) =>
                            o instanceof SetTextMatrixOp ||
                            o instanceof MoveTextOp ||
                            o instanceof MoveTextLeadingOp ||
                            o instanceof NextLineOp,
                    )
                    const newTm = SetTextMatrixOp.create(
                        firstTm.a,
                        firstTm.b,
                        firstTm.c,
                        firstTm.d,
                        cursorX,
                        cursorY,
                    )
                    const showIdx = run.ops.findIndex(
                        (o) =>
                            o instanceof ShowTextOp ||
                            o instanceof ShowTextArrayOp,
                    )
                    if (showIdx !== -1) {
                        run.addOp(newTm, showIdx)
                    } else {
                        run.addOp(newTm)
                    }
                }

                const advance = run.getTextAdvance()
                cursorX += advance * ux * scale
                cursorY += advance * uy * scale
            }
        }
        // ops getter auto-syncs with runs
    }

    /**
     * Get the fill color of the first run in this text block.
     */
    get color(): Color | undefined {
        return this.runs[0]?.color ?? this.prev?.color
    }

    /**
     * Change the fill color of every run in this text block.
     * Accepts an RGB color as `{ r, g, b }` with values in 0–1 range.
     * Updates both regrouped runs and original source runs.
     */
    set color(color: Color) {
        // Snapshot the effective fill color for each run BEFORE any
        // modifications, so we can restore it after the show op and prevent
        // color bleeding to subsequent text in the same real parent block.
        const prevColors = new Map<TextRun, Color>()
        const black = new GrayColor(0)

        for (const run of this.runs) {
            prevColors.set(run, run.prev?.color ?? black)
        }

        for (const run of this.runs) {
            const restoreColor = prevColors.get(run)

            run.removeOpsWhere(
                (o) =>
                    o instanceof SetFillColorRGBOp ||
                    o instanceof SetFillColorGrayOp ||
                    o instanceof SetFillColorCMYKOp,
            )
            const showIdx = run.ops.findIndex(
                (o) =>
                    o instanceof ShowTextOp ||
                    o instanceof ShowTextArrayOp ||
                    o instanceof ShowTextNextLineOp ||
                    o instanceof ShowTextNextLineSpacingOp,
            )

            if (showIdx !== -1) {
                run.addOp(color.toOp(), showIdx)
                // Restore previous color AFTER the show op to prevent the
                // new color from bleeding to subsequent runs.  +2:
                // skip past the inserted color op and the show op.
                if (restoreColor) {
                    run.addOp(restoreColor.toOp(), showIdx + 2)
                }
            } else {
                run.addOp(color.toOp())
            }
        }
        // ops getter auto-syncs with runs
    }

    /**
     * Edit text for blocks spanning multiple font subsets (e.g. Type3).
     * Rebuilds the source TextBlock with proper absolute positioning for
     * each character, using the correct font subset for each glyph.
     */
    private _editTextMultiFont(
        newText: string,
        runs: TextRun[],
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

        // Build font → resource name map from runs' Tf ops
        const fontResName = new Map<PdfFont, string>()
        for (const run of runs) {
            const f = run.font
            if (!fontResName.has(f)) {
                const tf = run.ops.find((o) => o instanceof SetFontOp) as
                    | SetFontOp
                    | undefined
                fontResName.set(f, tf?.fontName ?? f.resourceName)
            }
        }

        // First run's local Tm is the anchor, in its real parent's
        // coordinate space (pre-CTM) — which is where the rebuilt ops live.
        const firstSeg = runs[0]
        const firstTm = firstSeg.getLocalTransform()
        const fontSize = firstSeg.fontSize

        const scale = Math.hypot(firstTm.a, firstTm.b)
        const ux = scale !== 0 ? firstTm.a / scale : 1
        const uy = scale !== 0 ? firstTm.b / scale : 0

        // Build new ops for the first run's parent TextBlock, placing
        // each character at the correct absolute position with its font.
        const newBlockOps: ContentOp[] = [new BeginTextOp()]
        let cursorX = firstTm.e
        let cursorY = firstTm.f
        let prevFont: PdfFont | undefined

        for (const ch of chars) {
            const font = findFont(ch)!
            const rn = fontResName.get(font) ?? font.resourceName
            const encoded = font.encode(ch)

            if (font !== prevFont) {
                newBlockOps.push(SetFontOp.create(rn, fontSize))
                prevFont = font
            }

            newBlockOps.push(
                SetTextMatrixOp.create(
                    firstTm.a,
                    firstTm.b,
                    firstTm.c,
                    firstTm.d,
                    cursorX,
                    cursorY,
                ),
            )

            newBlockOps.push(ShowTextOp.create(encoded))

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

        // Replace the first run's real parent block ops with the
        // rebuilt stream; clear other real parents' runs that belonged
        // to this multi-font line so their ops don't re-emit.
        const firstParent = firstSeg.parent
        if (firstParent instanceof TextBlock) {
            firstParent.ops = newBlockOps
            // setter already reparses runs
        }

        // Clear other real parents' runs in reverse order so that
        // removing a sentinel doesn't break a later run's bounds.
        const otherSegs = runs.filter(
            (run) => run.parent && run.parent !== firstParent,
        )
        const clearedOther = new Set<TextRun>()
        const affectedOtherParents = new Set<TextBlock>()
        for (let i = otherSegs.length - 1; i >= 0; i--) {
            if (otherSegs[i].parent instanceof TextBlock) {
                affectedOtherParents.add(otherSegs[i].parent as TextBlock)
            }
            otherSegs[i].clearOps()
            clearedOther.add(otherSegs[i])
        }
        for (const parent of affectedOtherParents) {
            parent.runs = parent.runs.filter((s) => !clearedOther.has(s))
            if (parent._ops.length > 0) parent.resyncSegments()
        }
    }

    /**
     * Move this TextBlock by shifting the Tm of every run by (dx, dy)
     * in user-space coordinates.
     */
    moveBy(dx: number, dy: number): void {
        // Batch: compute all new local Tms BEFORE writing any.  Segments in
        // the same parent TextBlock share a prev chain; writing one shifts
        // the chain so later reads return stale values.
        const moves: { run: TextRun; newLocal: Matrix }[] = []
        const movedSegs = new Set<TextRun>()
        for (const run of this.runs) {
            const newLocal = run.computeShift(dx, dy)
            if (newLocal) {
                moves.push({ run, newLocal })
                movedSegs.add(run)
            }
        }

        // Snapshot world transforms of non-moved siblings in each affected
        // real parent TextBlock, so we can pin them after the moved runs
        // change (Td-based siblings drift when a prior prev-chain member
        // moves).
        const affectedParents = new Set<TextBlock>()
        for (const { run } of moves) {
            if (run.parent instanceof TextBlock) {
                affectedParents.add(run.parent)
            }
        }
        const siblingSnaps = new Map<TextRun, Matrix>()
        for (const parent of affectedParents) {
            for (const sib of parent.getRuns()) {
                if (!movedSegs.has(sib)) {
                    siblingSnaps.set(sib, sib.getWorldTransform())
                }
            }
        }

        // Apply the shifts.
        for (const { run, newLocal } of moves) {
            run.applyShift(newLocal)
        }

        // Pin non-moved siblings to their original world positions by
        // converting them to absolute Tm.
        for (const [sib, oldWorld] of siblingSnaps) {
            const newLocal = sib.computeLocalFromWorld(oldWorld)
            if (newLocal) sib.applyShift(newLocal)
        }
        // ops getter auto-syncs with runs
    }

    // ─── Authoring builders ─────────────────────────────────────────────

    static readonly DEFAULT_LINE_HEIGHT_FACTOR = 1.2
    /** Italic shear applied via `c` component of Tm (≈ tan 15°). */
    static readonly ITALIC_SHEAR = 0.267
    /** Faux-bold stroke width as a fraction of font size. */
    static readonly BOLD_STROKE_RATIO = 0.04

    /**
     * Build a single-line text block sized to the given rect.  When
     * `da.fontSize <= 0` the builder auto-scales; when it's fixed and
     * the text overflows, it shrinks to fit.  Returns the block and the
     * final DA (which the caller usually emits before the block).
     */
    static singleLine(opts: {
        text: string
        width: number
        height: number
        da: PdfDefaultAppearance
        quadding?: 0 | 1 | 2
        padding?: number
        resolvedFonts?: Map<string, PdfFont>
        fontVariantNames?: {
            bold?: string
            italic?: string
            boldItalic?: string
        }
    }): TextBlock {
        const padding = opts.padding ?? 2
        const availableWidth = opts.width - 2 * padding
        const availableHeight = opts.height - 2 * padding
        const autoScale = opts.da.fontSize <= 0
        const measureCtx = {
            fontName: opts.da.fontName,
            resolvedFonts: opts.resolvedFonts,
            boldFontName: opts.fontVariantNames?.bold,
        }

        let fontSize = autoScale
            ? Math.min(12, availableHeight)
            : opts.da.fontSize
        const currentWidth = TextBlock._measureTextWidth(
            opts.text,
            opts.da.fontName,
            fontSize,
            opts.resolvedFonts,
        )
        if (currentWidth > availableWidth) {
            fontSize = TextBlock._calculateFittingFontSize(
                opts.text,
                availableWidth,
                measureCtx,
                { startSize: fontSize },
            )
        }
        if (autoScale) fontSize = Math.max(fontSize, 0.5)

        const textWidth = TextBlock._measureTextWidth(
            opts.text,
            opts.da.fontName,
            fontSize,
            opts.resolvedFonts,
        )
        const textX = TextBlock._calcTextX(
            opts.quadding ?? 0,
            padding,
            availableWidth,
            textWidth,
        )
        const textY = (opts.height - fontSize) / 2 + fontSize * 0.2
        const font = TextBlock._resolveFont(
            opts.da.fontName,
            opts.resolvedFonts,
        )
        const block = new TextBlock()
        block.addRun(
            TextRun.create({
                text: opts.text,
                font,
                fontSize,
                move: { dx: textX, dy: textY },
            }),
        )
        return block
    }

    /**
     * Build a word-wrapped multi-line text block.  Auto-scales when
     * `da.fontSize <= 0`; shrinks otherwise if the wrapped result won't
     * fit the available height.  Each wrapped line is a separate
     * TextRun run positioned relative to the previous line.
     */
    static multiline(opts: {
        text: string
        width: number
        height: number
        da: PdfDefaultAppearance
        quadding?: 0 | 1 | 2
        padding?: number
        lineHeightFactor?: number
        resolvedFonts?: Map<string, PdfFont>
        fontVariantNames?: {
            bold?: string
            italic?: string
            boldItalic?: string
        }
    }): TextBlock {
        const padding = opts.padding ?? 2
        const availableWidth = opts.width - 2 * padding
        const availableHeight = opts.height - 2 * padding
        const lhFactor =
            opts.lineHeightFactor ?? TextBlock.DEFAULT_LINE_HEIGHT_FACTOR
        const autoScale = opts.da.fontSize <= 0
        const measureCtx = {
            fontName: opts.da.fontName,
            resolvedFonts: opts.resolvedFonts,
            boldFontName: opts.fontVariantNames?.bold,
        }

        let fontSize = autoScale ? 12 : opts.da.fontSize
        const trial = TextBlock._wrapTextToLines(
            opts.text,
            availableWidth,
            fontSize,
            measureCtx,
        )
        if (trial.length * fontSize * lhFactor > availableHeight) {
            fontSize = TextBlock._calculateFittingFontSize(
                opts.text,
                availableWidth,
                measureCtx,
                {
                    startSize: fontSize,
                    maxHeight: availableHeight,
                    lineHeightFactor: lhFactor,
                },
            )
        }
        if (autoScale) fontSize = Math.max(fontSize, 0.5)

        const renderLineHeight = fontSize * lhFactor
        const startY = opts.height - padding - fontSize
        const lines = TextBlock._wrapTextToLines(
            opts.text,
            availableWidth,
            fontSize,
            measureCtx,
        )
        const font = TextBlock._resolveFont(
            opts.da.fontName,
            opts.resolvedFonts,
        )
        const block = new TextBlock()
        let prevLineX = 0
        for (let i = 0; i < lines.length; i++) {
            const lineText = lines[i].replace(/\r/g, '')
            const lineWidth = TextBlock._measureTextWidth(
                lineText,
                opts.da.fontName,
                fontSize,
                opts.resolvedFonts,
            )
            const lineX = TextBlock._calcTextX(
                opts.quadding ?? 0,
                padding,
                availableWidth,
                lineWidth,
            )
            const move =
                i === 0
                    ? { dx: lineX, dy: startY }
                    : { dx: lineX - prevLineX, dy: -renderLineHeight }
            prevLineX = lineX
            block.addRun(
                TextRun.create({
                    text: lineText,
                    font,
                    fontSize,
                    move,
                }),
            )
        }
        return block
    }

    /**
     * Build a comb-field block: one character per cell, centred
     * horizontally.  Auto-sizes when `da.fontSize <= 0`, then shrinks
     * further if any single glyph overflows its cell.  Each cell is its
     * own TextRun positioned via an absolute Tm.
     */
    static comb(opts: {
        text: string
        width: number
        height: number
        maxLen: number
        da: PdfDefaultAppearance
        padding?: number
        resolvedFonts?: Map<string, PdfFont>
    }): TextBlock {
        const padding = opts.padding ?? 2
        const chars = [...opts.text]
        const cellWidth = opts.width / opts.maxLen
        let fontSize = opts.da.fontSize
        if (fontSize <= 0) {
            fontSize = Math.min(opts.height - 2 * padding, cellWidth)
        }
        let maxCharWidth = 0
        let widestChar = chars[0] ?? ''
        for (const char of chars) {
            const cw = TextBlock._measureTextWidth(
                char,
                opts.da.fontName,
                fontSize,
                opts.resolvedFonts,
            )
            if (cw > maxCharWidth) {
                maxCharWidth = cw
                widestChar = char
            }
        }
        if (maxCharWidth > cellWidth) {
            fontSize = TextBlock._calculateFittingFontSize(
                widestChar,
                cellWidth,
                {
                    fontName: opts.da.fontName,
                    resolvedFonts: opts.resolvedFonts,
                },
                { startSize: fontSize },
            )
        }
        const textY = (opts.height - fontSize) / 2 + fontSize * 0.2
        const font = TextBlock._resolveFont(
            opts.da.fontName,
            opts.resolvedFonts,
        )
        const block = new TextBlock()
        for (let i = 0; i < chars.length && i < opts.maxLen; i++) {
            const charWidth = TextBlock._measureTextWidth(
                chars[i],
                opts.da.fontName,
                fontSize,
                opts.resolvedFonts,
            )
            const cellX = cellWidth * i + (cellWidth - charWidth) / 2
            block.addRun(
                TextRun.create({
                    text: chars[i],
                    font,
                    fontSize,
                    matrix: new Matrix({
                        a: 1,
                        b: 0,
                        c: 0,
                        d: 1,
                        e: cellX,
                        f: textY,
                    }),
                }),
            )
        }
        return block
    }

    /**
     * Build a single row (used to compose list-box style layouts).
     * Positions the text at the given `baselineY` with alignment within
     * the available width.  No auto-scaling.
     */
    static row(opts: {
        text: string
        baselineY: number
        availableWidth: number
        padding?: number
        da: PdfDefaultAppearance
        quadding?: 0 | 1 | 2
        resolvedFonts?: Map<string, PdfFont>
    }): TextBlock {
        const padding = opts.padding ?? 2
        const textWidth = TextBlock._measureTextWidth(
            opts.text,
            opts.da.fontName,
            opts.da.fontSize,
            opts.resolvedFonts,
        )
        const textX = TextBlock._calcTextX(
            opts.quadding ?? 0,
            padding,
            opts.availableWidth,
            textWidth,
        )
        const font = TextBlock._resolveFont(
            opts.da.fontName,
            opts.resolvedFonts,
        )
        const block = new TextBlock()
        block.addRun(
            TextRun.create({
                text: opts.text,
                font,
                fontSize: opts.da.fontSize,
                move: { dx: textX, dy: opts.baselineY },
            }),
        )
        return block
    }

    /**
     * Build a markdown-styled block (bold, italic, strikethrough) plus
     * an optional sibling GraphicsBlock carrying the strikethrough
     * stroke paths (which live outside the BT…ET group).
     */
    static markdown(opts: {
        markdown: string
        width: number
        height: number
        da: PdfDefaultAppearance
        multiline?: boolean
        quadding?: 0 | 1 | 2
        padding?: number
        lineHeightFactor?: number
        resolvedFonts?: Map<string, PdfFont>
        fontVariantNames?: {
            bold?: string
            italic?: string
            boldItalic?: string
        }
    }): TextBlock {
        const padding = opts.padding ?? 2
        const availableWidth = opts.width - 2 * padding
        const availableHeight = opts.height - 2 * padding
        const lhFactor =
            opts.lineHeightFactor ?? TextBlock.DEFAULT_LINE_HEIGHT_FACTOR
        const autoScale = opts.da.fontSize <= 0
        const measureCtx = {
            fontName: opts.da.fontName,
            resolvedFonts: opts.resolvedFonts,
            boldFontName: opts.fontVariantNames?.bold,
        }
        const plain = parseMarkdownSegments(opts.markdown)
            .map((s) => s.text)
            .join('')

        // Auto-scale / overflow-shrink against plain text metrics.
        let fontSize = autoScale ? 12 : opts.da.fontSize
        if (opts.multiline) {
            const trial = TextBlock._wrapTextToLines(
                plain,
                availableWidth,
                fontSize,
                measureCtx,
            )
            if (trial.length * fontSize * lhFactor > availableHeight) {
                fontSize = TextBlock._calculateFittingFontSize(
                    plain,
                    availableWidth,
                    measureCtx,
                    {
                        startSize: fontSize,
                        maxHeight: availableHeight,
                        lineHeightFactor: lhFactor,
                    },
                )
            }
        } else if (
            TextBlock._measureTextWidth(
                plain,
                opts.da.fontName,
                fontSize,
                opts.resolvedFonts,
            ) > availableWidth
        ) {
            fontSize = TextBlock._calculateFittingFontSize(
                plain,
                availableWidth,
                measureCtx,
                { startSize: fontSize },
            )
        }
        if (autoScale) fontSize = Math.max(fontSize, 0.5)

        const renderLineHeight = fontSize * lhFactor
        const runs = parseMarkdownSegments(opts.markdown)
        const allStrikes: { x: number; y: number; width: number }[] = []
        const block = new TextBlock()

        if (opts.multiline) {
            const lines = TextBlock._wrapTextToLines(
                plain,
                availableWidth,
                fontSize,
                measureCtx,
            )
            const styledLines = TextBlock._splitStyledSegmentsToLines(
                runs,
                lines,
            )
            const startY = opts.height - padding - fontSize
            for (let i = 0; i < styledLines.length; i++) {
                const rects = TextBlock._addStyledRunsToBlock(
                    block,
                    styledLines[i],
                    padding,
                    startY - i * renderLineHeight,
                    fontSize,
                    opts.da.fontName,
                    opts.resolvedFonts,
                    opts.fontVariantNames,
                )
                allStrikes.push(...rects)
            }
        } else {
            const textX = TextBlock._calcTextX(
                opts.quadding ?? 0,
                padding,
                availableWidth,
                TextBlock._measureTextWidth(
                    plain,
                    opts.da.fontName,
                    fontSize,
                    opts.resolvedFonts,
                ),
            )
            const textY = (opts.height - fontSize) / 2 + fontSize * 0.2
            const rects = TextBlock._addStyledRunsToBlock(
                block,
                runs,
                textX,
                textY,
                fontSize,
                opts.da.fontName,
                opts.resolvedFonts,
                opts.fontVariantNames,
            )
            allStrikes.push(...rects)
        }

        if (allStrikes.length === 0) return block
        const lineWidth = Math.max(0.5, fontSize * 0.06)
        const strikes = new GraphicsBlock()
        strikes.ops.push(SetLineWidthOp.create(Number(lineWidth.toFixed(3))))
        for (const r of allStrikes) {
            const sy = Number((r.y + fontSize * 0.35).toFixed(3))
            strikes.ops.push(MoveToOp.create(Number(r.x.toFixed(3)), sy))
            strikes.ops.push(
                LineToOp.create(Number((r.x + r.width).toFixed(3)), sy),
            )
            strikes.ops.push(new StrokeOp())
        }
        block.strikes = strikes
        return block
    }

    // ─── Internal helpers ───────────────────────────────────────────────

    private static _calcTextX(
        quadding: number,
        padding: number,
        availableWidth: number,
        textWidth: number,
    ): number {
        if (quadding === 2)
            return padding + Math.max(availableWidth - textWidth, 0)
        if (quadding === 1)
            return padding + Math.max((availableWidth - textWidth) / 2, 0)
        return padding
    }

    private static _measureTextWidth(
        text: string,
        fontName: string,
        fontSize: number,
        resolvedFonts?: Map<string, PdfFont>,
    ): number {
        const font =
            resolvedFonts?.get(fontName) ?? PdfFont.getStandardFont(fontName)
        if (font?.widths && font.firstChar !== undefined) {
            return font.measureString(text, fontSize)
        }
        return PdfFont.HELVETICA.measureString(text, fontSize)
    }

    private static _measureTextWidthWithFont(
        text: string,
        variantName: string | undefined,
        fallbackFontName: string,
        fontSize: number,
        resolvedFonts?: Map<string, PdfFont>,
    ): number {
        const font = variantName ? resolvedFonts?.get(variantName) : undefined
        if (!font)
            return TextBlock._measureTextWidth(
                text,
                fallbackFontName,
                fontSize,
                resolvedFonts,
            )
        return font.measureString(text, fontSize)
    }

    private static _wrapTextToLines(
        text: string,
        maxWidth: number,
        fontSize: number,
        ctx: {
            fontName: string
            resolvedFonts?: Map<string, PdfFont>
            boldFontName?: string
        },
    ): string[] {
        const measure = (t: string): number =>
            ctx.boldFontName
                ? TextBlock._measureTextWidthWithFont(
                      t,
                      ctx.boldFontName,
                      ctx.fontName,
                      fontSize,
                      ctx.resolvedFonts,
                  )
                : TextBlock._measureTextWidth(
                      t,
                      ctx.fontName,
                      fontSize,
                      ctx.resolvedFonts,
                  )
        const breakLongWord = (word: string): string[] => {
            const lines: string[] = []
            let current = ''
            for (const ch of word) {
                const test = current + ch
                if (measure(test) <= maxWidth) current = test
                else {
                    if (current) lines.push(current)
                    current = ch
                }
            }
            if (current) lines.push(current)
            return lines.length > 0 ? lines : [word]
        }
        const paragraphs = text.split('\n')
        const out: string[] = []
        for (const paragraph of paragraphs) {
            if (measure(paragraph) <= maxWidth) {
                out.push(paragraph)
                continue
            }
            const words = paragraph.split(' ')
            let current = ''
            for (const word of words) {
                const test = current ? `${current} ${word}` : word
                if (measure(test) <= maxWidth) current = test
                else if (current) {
                    out.push(current)
                    current = word
                } else {
                    const broken = breakLongWord(word)
                    out.push(...broken.slice(0, -1))
                    current = broken[broken.length - 1]
                }
            }
            if (current) out.push(current)
        }
        return out
    }

    private static _calculateFittingFontSize(
        text: string,
        maxWidth: number,
        ctx: {
            fontName: string
            resolvedFonts?: Map<string, PdfFont>
            boldFontName?: string
        },
        opts: {
            startSize: number
            maxHeight?: number
            lineHeightFactor?: number
            minSize?: number
        },
    ): number {
        const minSize = opts.minSize ?? 0.5
        const lineHeight =
            opts.lineHeightFactor ?? TextBlock.DEFAULT_LINE_HEIGHT_FACTOR
        const fits = (size: number): boolean => {
            if (opts.maxHeight !== undefined) {
                const lines = TextBlock._wrapTextToLines(
                    text,
                    maxWidth,
                    size,
                    ctx,
                )
                return lines.length * size * lineHeight <= opts.maxHeight
            }
            const m = ctx.boldFontName
                ? TextBlock._measureTextWidthWithFont(
                      text,
                      ctx.boldFontName,
                      ctx.fontName,
                      size,
                      ctx.resolvedFonts,
                  )
                : TextBlock._measureTextWidth(
                      text,
                      ctx.fontName,
                      size,
                      ctx.resolvedFonts,
                  )
            return m <= maxWidth
        }
        if (fits(opts.startSize)) return opts.startSize
        if (!fits(minSize)) return minSize
        let lo = minSize
        let hi = opts.startSize
        while (hi - lo > 0.5) {
            const mid = Math.round((lo + hi) / 2 / 0.5) * 0.5
            if (fits(mid)) lo = mid
            else hi = mid
        }
        return lo
    }

    private static _resolveFont(
        fontName: string,
        resolvedFonts?: Map<string, PdfFont>,
    ): PdfFont {
        return (
            resolvedFonts?.get(fontName) ??
            PdfFont.getStandardFont(fontName) ??
            PdfFont.HELVETICA
        )
    }

    private static _resolveVariantFontName(
        bold: boolean,
        italic: boolean,
        names:
            | { bold?: string; italic?: string; boldItalic?: string }
            | undefined,
    ): string | undefined {
        if (bold && italic && names?.boldItalic) return names.boldItalic
        if (bold && names?.bold) return names.bold
        if (italic && names?.italic) return names.italic
        return undefined
    }

    private static _addStyledRunsToBlock(
        block: TextBlock,
        lineSegs: StyledSegment[],
        startX: number,
        startY: number,
        fontSize: number,
        regularFontName: string,
        resolvedFonts: Map<string, PdfFont> | undefined,
        variantNames:
            | { bold?: string; italic?: string; boldItalic?: string }
            | undefined,
    ): { x: number; y: number; width: number }[] {
        const regularFont = TextBlock._resolveFont(
            regularFontName,
            resolvedFonts,
        )
        const strikes: { x: number; y: number; width: number }[] = []
        let x = startX
        for (const run of lineSegs) {
            const variantName = TextBlock._resolveVariantFontName(
                run.bold,
                run.italic,
                variantNames,
            )
            if (variantName) {
                const variantFont =
                    resolvedFonts?.get(variantName) ?? regularFont
                const segWidth = variantFont.measureString(run.text, fontSize)
                block.addRun(
                    TextRun.create({
                        text: run.text,
                        font: variantFont,
                        fontSize,
                        matrix: new Matrix({
                            a: 1,
                            b: 0,
                            c: 0,
                            d: 1,
                            e: Number(x.toFixed(3)),
                            f: Number(startY.toFixed(3)),
                        }),
                        renderingMode: 0,
                    }),
                )
                if (run.strikethrough)
                    strikes.push({ x, y: startY, width: segWidth })
                x += segWidth
            } else {
                const shear = run.italic ? TextBlock.ITALIC_SHEAR : 0
                const lineWidth = run.bold
                    ? fontSize * TextBlock.BOLD_STROKE_RATIO
                    : undefined
                const renderingMode = run.bold ? 2 : 0
                block.addRun(
                    TextRun.create({
                        text: run.text,
                        font: regularFont,
                        fontSize,
                        matrix: new Matrix({
                            a: 1,
                            b: 0,
                            c: shear,
                            d: 1,
                            e: Number(x.toFixed(3)),
                            f: Number(startY.toFixed(3)),
                        }),
                        lineWidth,
                        renderingMode,
                    }),
                )
                const segWidth = TextBlock._measureTextWidth(
                    run.text,
                    regularFontName,
                    fontSize,
                    resolvedFonts,
                )
                if (run.strikethrough)
                    strikes.push({ x, y: startY, width: segWidth })
                x += segWidth
            }
        }
        // Restore a clean state for any following content by emitting a
        // fresh Tf and Tr 0 via a zero-width run (no show op, no
        // run created — we just append the ops as a trailing run
        // with empty text via a marker).  Simplest: skip — the q…Q
        // wrapper in the appearance factory will restore graphics state.
        return strikes
    }

    private static _splitStyledSegmentsToLines(
        runs: StyledSegment[],
        lines: string[],
    ): StyledSegment[][] {
        type StyledChar = {
            char: string
            bold: boolean
            italic: boolean
            strikethrough: boolean
        }
        const chars: StyledChar[] = []
        for (const run of runs) {
            for (const char of run.text) {
                chars.push({
                    char,
                    bold: run.bold,
                    italic: run.italic,
                    strikethrough: run.strikethrough,
                })
            }
        }
        const result: StyledSegment[][] = []
        let pos = 0
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            if (lineIdx > 0 && pos < chars.length) {
                const c = chars[pos].char
                if (c === ' ' || c === '\n' || c === '\r') pos++
            }
            const lineSegs: StyledSegment[] = []
            let curText = ''
            let curBold = false
            let curItalic = false
            let curStrike = false
            const lineLen = lines[lineIdx].replace(/\r/g, '').length
            for (let j = 0; j < lineLen && pos < chars.length; j++, pos++) {
                const { char, bold, italic, strikethrough } = chars[pos]
                if (curText === '') {
                    curText = char
                    curBold = bold
                    curItalic = italic
                    curStrike = strikethrough
                } else if (
                    bold !== curBold ||
                    italic !== curItalic ||
                    strikethrough !== curStrike
                ) {
                    lineSegs.push({
                        text: curText,
                        bold: curBold,
                        italic: curItalic,
                        strikethrough: curStrike,
                    })
                    curText = char
                    curBold = bold
                    curItalic = italic
                    curStrike = strikethrough
                } else {
                    curText += char
                }
            }
            if (curText)
                lineSegs.push({
                    text: curText,
                    bold: curBold,
                    italic: curItalic,
                    strikethrough: curStrike,
                })
            result.push(lineSegs)
        }
        return result
    }
}

/**
 * A regroup-view over a set of original `TextRun`s.  Holds references to
 * the real content-stream runs (shares `.parent` and `.prev` with the
 * real tree) rather than baked copies.  Edit methods inherited from
 * `TextBlock` therefore mutate the real nodes directly; rebuilds cascade
 * to each distinct real parent block.
 *
 * A virtual block owns no BT/ET of its own and must NOT be serialised as
 * a standalone block — its runs' ops already live in real content
 * stream blocks.
 */
export class VirtualTextBlock extends TextBlock {
    constructor(page?: PdfPage) {
        super(page)
    }

    /**
     * Add an existing real TextRun to this view without reparenting or
     * rewriting its prev chain.  Graphics-state resolution and write-back
     * must continue to flow through the node's real parent.
     */
    override addRun(run: TextRun): void {
        this.runs.push(run)
    }

    /**
     * No-op: VirtualTextBlock doesn't own ops, and parent blocks
     * auto-sync via their ops getter when accessed.
     */
    override get ops(): ArraySegment<ContentOp> {
        // Virtual blocks don't own BT/ET — their runs already live
        // in real parent blocks.  Accessing parent.ops automatically
        // rebuilds from runs via the getter.
        return detachedSegment<ContentOp>([])
    }

    override set ops(_value: ContentOp[] | ArraySegment<ContentOp>) {
        // Virtual blocks are read-only views; ignore writes
    }

    /**
     * Compute the bbox in world (post-CTM) space.  The virtual block has
     * no parent chain, so its world coincides with its local — emit the
     * world-space union of its runs directly.
     */
    override getLocalBoundingBox(): Rect {
        if (this.runs.length === 0) {
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
        }
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const run of this.runs) {
            const segBbox = run.getLocalBoundingBox()
            const wtm = run.getWorldTransform()
            const corners = [
                new Point({ x: segBbox.x, y: segBbox.y }),
                new Point({
                    x: segBbox.x + segBbox.width,
                    y: segBbox.y,
                }),
                new Point({
                    x: segBbox.x,
                    y: segBbox.y + segBbox.height,
                }),
                new Point({
                    x: segBbox.x + segBbox.width,
                    y: segBbox.y + segBbox.height,
                }),
            ]
            for (const c of corners) {
                const pt = c.transform(wtm)
                minX = Math.min(minX, pt.x)
                minY = Math.min(minY, pt.y)
                maxX = Math.max(maxX, pt.x)
                maxY = Math.max(maxY, pt.y)
            }
        }
        return new Rect({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        })
    }

    override toString(): string {
        throw new Error(
            'VirtualTextBlock cannot be serialised standalone; its runs already live in real content-stream blocks.',
        )
    }

    /**
     * Regroup `Text` runs from the given blocks into new `TextBlock`s
     * such that each output block contains runs that appear on the same
     * visual line when rendered.
     *
     * Each baked run carries standalone state (Tf, Tc, Tw, TL) plus an
     * absolute `Tm` derived from its original world transform, so the output
     * blocks are self-contained and safe to re-serialize.
     *
     * Contract: because the baked `Tm` is world-absolute, the returned blocks
     * must be placed under an ancestor whose composed `cm` is identity
     * (e.g. directly under the content stream root, or an identity
     * `StateNode`). Otherwise glyphs will be double-transformed.
     */
    static regroupTextBlocks(blocks: TextBlock[]): VirtualTextBlock[] {
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
            sourceSegment: TextRun
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
            for (const run of block.getRuns()) {
                const text = run.text
                // Skip runs that have no show operator and no text —
                // they are pure positioning/state and should not create
                // their own visual line band.
                const hasShowOp = run.ops.some(
                    (o) =>
                        o instanceof ShowTextOp ||
                        o instanceof ShowTextArrayOp ||
                        o instanceof ShowTextNextLineOp ||
                        o instanceof ShowTextNextLineSpacingOp,
                )
                if (!hasShowOp && !text) continue

                const wtm = run.getWorldTransform()
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
                // For empty runs, showOp can be null
                let showOp: ContentOp | null =
                    run.ops.findLast(
                        (o) =>
                            o instanceof ShowTextOp ||
                            o instanceof ShowTextArrayOp,
                    ) ?? null
                if (!showOp && text) {
                    showOp = ShowTextOp.create(text)
                }

                // Capture the resource name from the Tf op so we
                // can faithfully recreate it in the baked run.
                // Walk the prev chain like the `font` getter does.
                let fontResourceName: string | undefined
                let walk: TextRun | undefined = run
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
                fontResourceName ??= run.font.resourceName

                descriptors.push({
                    wtm,
                    font: run.font,
                    fontResourceName,
                    fontSize: run.fontSize,
                    charSpace: run.charSpace,
                    wordSpace: run.wordSpace,
                    textLeading: run.textLeading,
                    text,
                    showOp,
                    sourceSegment: run,
                    fontType: run.font.fontType,
                    orientationKey,
                    lineCoord,
                    alongCoord,
                    textAdvance: run.getTextAdvance() * len,
                    effectiveFontSize: run.fontSize * len,
                    order: order++,
                })
            }
        }

        // Bucket by orientation so only identically-rotated runs can
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
        // runs with different fonts or sizes become separate TextBlocks.
        // Exception: Type3 fonts are glyph subsets — each character may use
        // a different resource name even though they belong to the same
        // visual typeface.  Group all Type3 runs at the same size together.
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

        // Sub-split each font band by horizontal gap so runs that
        // are far apart along the text direction become separate TextBlocks.
        // Also split when a run from a different font sits between two
        // consecutive same-font runs (e.g. bold "and" between regular text).
        // Threshold: a gap larger than 3× the effective font size.
        const gapBands: Band[] = []
        for (const band of splitBands) {
            const sorted = [...band.descriptors].sort(
                (a, b) => a.alongCoord - b.alongCoord,
            )
            // Collect descriptors from other fonts on the same baseline
            // band, sorted by alongCoord, for interleaving detection.
            // For Type3 fonts, all Type3 runs share one group, so only
            // non-Type3 runs on the same band are "other".
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

                // Check if a different-font run sits between prev and sorted[i]
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

        // Stable output order: follow original run ordering.
        gapBands.sort((a, b) => a.firstOrder - b.firstOrder)

        const firstPage = blocks[0]?.page
        const result: VirtualTextBlock[] = []
        for (const band of gapBands) {
            const sortedSegs = [...band.descriptors].sort(
                (a, b) => a.alongCoord - b.alongCoord,
            )

            const newBlock = new VirtualTextBlock(firstPage)
            for (const d of sortedSegs) {
                newBlock.addRun(d.sourceSegment)
            }
            result.push(newBlock)
        }

        return result
    }
}
