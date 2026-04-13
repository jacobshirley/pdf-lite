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
import { TextNode } from './text-node'

export class TextBlock extends ContentNode {
    protected segments: TextNode[] = []
    private _rawOps?: ContentOp[]
    prev?: TextBlock

    constructor(page?: PdfPage, ops?: ContentOp[], prev?: TextBlock) {
        super() // Don't pass ops to parent
        this.page = page
        this.prev = prev
        if (ops) {
            this._rawOps = ops
            this.parseSegments()
        }
    }

    /** Auto-rebuild ops from segments when accessed */
    override get ops(): ContentOp[] {
        if (this.segments.length > 0) {
            const newOps: ContentOp[] = [new BeginTextOp()]
            for (const seg of this.segments) {
                newOps.push(...seg.ops)
            }
            newOps.push(new EndTextOp())
            return newOps
        }
        return this._rawOps ?? []
    }

    override set ops(value: ContentOp[]) {
        this._rawOps = value
        this.segments = []
        this.parseSegments()
    }

    /** @internal */
    private parseSegments(): void {
        const segments: TextNode[] = []
        let currentOps: ContentOp[] = []
        // Link the first segment's prev to the last segment of the previous
        // TextBlock so that font/size state carries across BT/ET boundaries.
        let lastSegment: TextNode | undefined = this.prev?.getSegments().at(-1)

        for (const op of this._rawOps ?? []) {
            if (op instanceof BeginTextOp || op instanceof EndTextOp) {
                continue
            }

            currentOps.push(op)
            if (op instanceof ShowTextOp || op instanceof ShowTextArrayOp) {
                const segment = new TextNode(currentOps, this.page)
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
            const segment = new TextNode(currentOps, this.page)
            segment.prev = lastSegment ?? undefined
            segment.parent = this
            segments.push(segment)
        }

        this.segments = segments
    }

    getSegments() {
        return this.segments
    }

    addSegment(segment: TextNode): void {
        segment.parent = this
        segment.prev = this.segments[this.segments.length - 1]
        this.segments.push(segment)
        // ops getter auto-syncs with segments
    }

    get text(): string {
        return this.segments.map((l) => l.text).join('')
    }

    toString(): string {
        if (this.segments.length === 0) {
            return super.toString()
        }

        const ops = [new BeginTextOp()]
        for (const seg of this.segments) {
            ops.push(...seg.ops)
        }
        ops.push(new EndTextOp())
        return ops.map((o) => o.toString()).join('\n')
    }

    getLocalTransform(): Matrix {
        // TextBlock is just a container; segments carry their own transforms
        return Matrix.identity()
    }

    getLocalBoundingBox(): Rect {
        if (this.segments.length === 0) {
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
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

        return new Rect({
            x: (minX - blockTm.e) / xScale,
            y: (minY - blockTm.f) / yScale,
            width: (maxX - minX) / xScale,
            height: (maxY - minY) / yScale,
        })
    }

    /**
     * Set this text block's content, modifying the original content-stream
     * in-place when source segment references are available (i.e. this block
     * was produced by `regroupTextBlocks`).
     */
    set text(newText: string) {
        if (this.segments.length === 0) {
            const text = new TextNode([], this.page)
            text.font = PdfFont.HELVETICA
            text.fontSize = 12
            text.text = newText
            this.addSegment(text)
            return
        }

        const segments = this.getSegments()

        const first = segments[0]

        // Detect multi-font blocks (e.g. Type3 glyph subsets where each
        // character may use a different font resource).
        if (segments.length > 1) {
            const fonts = new Set(segments.map((s) => s.font))
            if (fonts.size > 1) {
                this._editTextMultiFont(newText, segments, fonts)
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

        // Replace the show op in the first segment and clear the rest.
        // Then rebuild each affected real parent block from its segments.
        const isShowOp = (o: ContentOp) =>
            o instanceof ShowTextOp ||
            o instanceof ShowTextArrayOp ||
            o instanceof ShowTextNextLineOp ||
            o instanceof ShowTextNextLineSpacingOp

        const newShowOp = first.writeContentStreamText(newText)
        const oldIdx = first.ops.findIndex(isShowOp)
        if (oldIdx !== -1) {
            first.ops[oldIdx] = newShowOp
        } else {
            first.ops.push(newShowOp)
        }

        // Clear extras — leave them as empty-ops segments in their real
        // parent's segment list; rebuilding the parent drops their content.
        for (let i = 1; i < segments.length; i++) {
            segments[i].ops = []
        }
        // For non-virtual blocks, actually remove cleared segments
        this.segments.splice(1)
        // ops getter auto-syncs with segments
    }

    /**
     * Get the font of the first segment in this text block.
     */
    get font(): PdfFont | undefined {
        return this.segments[0]?.font
    }

    /**
     * Change the font of every segment in this text block.  The font is
     * automatically registered in the page's /Resources/Font dictionary
     * and the resolved resource name is used in the emitted Tf op.
     *
     * The text content is re-encoded with the new font.  Throws if the new
     * font cannot encode the existing text.
     */
    set font(font: PdfFont) {
        const resName = this.page?.addFont(font) ?? font.resourceName

        // Capture all segment texts BEFORE changing any font names,
        // because seg.text decodes the show op using the current font.
        // Changing the Tf first would decode old bytes with the new
        // font's encoding, producing garbage.
        const segTexts = this.segments.map((seg) => seg.text)

        const text = segTexts.join('')
        const bad = font.unsupportedChars(text)
        if (bad.length > 0) {
            throw new Error(
                `Font "${font.fontName}" cannot render: ${bad.map((c) => `'${c}'`).join(', ')}`,
            )
        }

        // Snapshot the first segment's local Tm as the anchor position.
        // We'll recompute all subsequent Tm positions based on the new
        // font's advance widths so segments don't drift apart.
        const firstTm = this.segments[0]?.getLocalTransform()

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i]
            const segText = segTexts[i]

            const tfOp = seg.ops.find((o) => o instanceof SetFontOp)
            if (tfOp) {
                tfOp.fontName = resName
            } else {
                seg.ops.unshift(SetFontOp.create(resName, seg.fontSize))
            }

            if (!segText) continue

            const showOp = seg.ops.find(
                (o) => o instanceof ShowTextOp || o instanceof ShowTextArrayOp,
            )
            if (showOp) {
                const newShow = seg.writeContentStreamText(segText)
                const idx = seg.ops.indexOf(showOp)
                seg.ops[idx] = newShow
            }
        }

        // Recalculate Tm positions for segments 1+ based on the new font's
        // advance widths.  The first segment keeps its original position;
        // each subsequent segment is placed right after the cumulative
        // advance of all prior segments.  Positions are expressed in each
        // segment's own local space by replacing any existing positioning
        // ops with an absolute Tm.
        if (firstTm && this.segments.length > 1) {
            const scale = Math.hypot(firstTm.a, firstTm.b) || 1
            const ux = firstTm.a / scale
            const uy = firstTm.b / scale
            let cursorX = firstTm.e
            let cursorY = firstTm.f

            for (let i = 0; i < this.segments.length; i++) {
                const seg = this.segments[i]

                if (i > 0) {
                    seg.ops = seg.ops.filter(
                        (o) =>
                            !(o instanceof SetTextMatrixOp) &&
                            !(o instanceof MoveTextOp) &&
                            !(o instanceof MoveTextLeadingOp) &&
                            !(o instanceof NextLineOp),
                    )
                    const showIdx = seg.ops.findIndex(
                        (o) =>
                            o instanceof ShowTextOp ||
                            o instanceof ShowTextArrayOp,
                    )
                    const newTm = SetTextMatrixOp.create(
                        firstTm.a,
                        firstTm.b,
                        firstTm.c,
                        firstTm.d,
                        cursorX,
                        cursorY,
                    )
                    if (showIdx !== -1) {
                        seg.ops.splice(showIdx, 0, newTm)
                    } else {
                        seg.ops.push(newTm)
                    }
                }

                const advance = seg.getTextAdvance()
                cursorX += advance * ux * scale
                cursorY += advance * uy * scale
            }
        }
        // ops getter auto-syncs with segments
    }

    /**
     * Get the fill color of the first segment in this text block.
     */
    get color():
        | { r: number; g: number; b: number }
        | { gray: number }
        | undefined {
        const colorOp = this.segments[0]?.fillColor
        if (!colorOp) return undefined

        if (colorOp instanceof SetFillColorRGBOp) {
            return { r: colorOp.r, g: colorOp.g, b: colorOp.b }
        } else if (colorOp instanceof SetFillColorGrayOp) {
            return { gray: colorOp.gray }
        }
        return undefined
    }

    /**
     * Change the fill color of every segment in this text block.
     * Accepts an RGB color as `{ r, g, b }` with values in 0–1 range.
     * Updates both regrouped segments and original source segments.
     */
    set color(color: { r: number; g: number; b: number }) {
        // Snapshot the effective fill color for each segment BEFORE any
        // modifications, so we can restore it after the show op and prevent
        // color bleeding to subsequent text in the same real parent block.
        const prevColors = new Map<TextNode, ContentOp>()
        const black = SetFillColorGrayOp.create(0)

        for (const seg of this.segments) {
            prevColors.set(seg, seg.prev?.fillColor ?? black)
        }

        for (const seg of this.segments) {
            const restoreOp = prevColors.get(seg)

            seg.ops = seg.ops.filter(
                (o) =>
                    !(o instanceof SetFillColorRGBOp) &&
                    !(o instanceof SetFillColorGrayOp) &&
                    !(o instanceof SetFillColorCMYKOp),
            )
            const showIdx = seg.ops.findIndex(
                (o) =>
                    o instanceof ShowTextOp ||
                    o instanceof ShowTextArrayOp ||
                    o instanceof ShowTextNextLineOp ||
                    o instanceof ShowTextNextLineSpacingOp,
            )
            const newColorOp = SetFillColorRGBOp.create(
                color.r,
                color.g,
                color.b,
            )
            if (showIdx !== -1) {
                seg.ops.splice(showIdx, 0, newColorOp)
                // Restore previous color AFTER the show op to prevent the
                // new color from bleeding to subsequent segments.  +2:
                // skip past the inserted color op and the show op.
                if (restoreOp) {
                    seg.ops.splice(showIdx + 2, 0, restoreOp)
                }
            } else {
                seg.ops.push(newColorOp)
            }
        }
        // ops getter auto-syncs with segments
    }

    /**
     * Edit text for blocks spanning multiple font subsets (e.g. Type3).
     * Rebuilds the source TextBlock with proper absolute positioning for
     * each character, using the correct font subset for each glyph.
     */
    private _editTextMultiFont(
        newText: string,
        segs: TextNode[],
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

        // Build font → resource name map from segments' Tf ops
        const fontResName = new Map<PdfFont, string>()
        for (const seg of segs) {
            const f = seg.font
            if (!fontResName.has(f)) {
                const tf = seg.ops.find((o) => o instanceof SetFontOp) as
                    | SetFontOp
                    | undefined
                fontResName.set(f, tf?.fontName ?? f.resourceName)
            }
        }

        // First segment's local Tm is the anchor, in its real parent's
        // coordinate space (pre-CTM) — which is where the rebuilt ops live.
        const firstSeg = segs[0]
        const firstTm = firstSeg.getLocalTransform()
        const fontSize = firstSeg.fontSize

        const scale = Math.hypot(firstTm.a, firstTm.b)
        const ux = scale !== 0 ? firstTm.a / scale : 1
        const uy = scale !== 0 ? firstTm.b / scale : 0

        // Build new ops for the first segment's parent TextBlock, placing
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

        // Replace the first segment's real parent block ops with the
        // rebuilt stream; clear other real parents' segments that belonged
        // to this multi-font line so their ops don't re-emit.
        const firstParent = firstSeg.parent
        if (firstParent instanceof TextBlock) {
            firstParent.ops = newBlockOps
            firstParent.parseSegments()
        }

        for (const seg of segs) {
            const parent = seg.parent
            if (parent && parent !== firstParent) {
                seg.ops = []
                // Parent block's ops getter auto-syncs with segments
            }
        }
    }

    /**
     * Move this TextBlock by shifting the Tm of every segment by (dx, dy)
     * in user-space coordinates.
     */
    moveBy(dx: number, dy: number): void {
        // Batch: compute all new local Tms BEFORE writing any.  Segments in
        // the same parent TextBlock share a prev chain; writing one shifts
        // the chain so later reads return stale values.
        const moves: { seg: TextNode; newLocal: Matrix }[] = []
        const movedSegs = new Set<TextNode>()
        for (const seg of this.segments) {
            const newLocal = seg.computeShift(dx, dy)
            if (newLocal) {
                moves.push({ seg, newLocal })
                movedSegs.add(seg)
            }
        }

        // Snapshot world transforms of non-moved siblings in each affected
        // real parent TextBlock, so we can pin them after the moved segments
        // change (Td-based siblings drift when a prior prev-chain member
        // moves).
        const affectedParents = new Set<TextBlock>()
        for (const { seg } of moves) {
            if (seg.parent instanceof TextBlock) {
                affectedParents.add(seg.parent)
            }
        }
        const siblingSnaps = new Map<TextNode, Matrix>()
        for (const parent of affectedParents) {
            for (const sib of parent.getSegments()) {
                if (!movedSegs.has(sib)) {
                    siblingSnaps.set(sib, sib.getWorldTransform())
                }
            }
        }

        // Apply the shifts.
        for (const { seg, newLocal } of moves) {
            seg.applyShift(newLocal)
        }

        // Pin non-moved siblings to their original world positions by
        // converting them to absolute Tm.
        for (const [sib, oldWorld] of siblingSnaps) {
            const newLocal = sib.computeLocalFromWorld(oldWorld)
            if (newLocal) sib.applyShift(newLocal)
        }
        // ops getter auto-syncs with segments
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
            sourceSegment: TextNode
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
                let walk: TextNode | undefined = seg
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
        const result: VirtualTextBlock[] = []
        for (const band of gapBands) {
            const sortedSegs = [...band.descriptors].sort(
                (a, b) => a.alongCoord - b.alongCoord,
            )

            const newBlock = new VirtualTextBlock(firstPage)
            for (const d of sortedSegs) {
                newBlock.addSegment(d.sourceSegment)
            }
            result.push(newBlock)
        }

        return result
    }
}

/**
 * A regroup-view over a set of original `TextNode`s.  Holds references to
 * the real content-stream segments (shares `.parent` and `.prev` with the
 * real tree) rather than baked copies.  Edit methods inherited from
 * `TextBlock` therefore mutate the real nodes directly; rebuilds cascade
 * to each distinct real parent block.
 *
 * A virtual block owns no BT/ET of its own and must NOT be serialised as
 * a standalone block — its segments' ops already live in real content
 * stream blocks.
 */
export class VirtualTextBlock extends TextBlock {
    constructor(page?: PdfPage) {
        super(page)
    }

    /**
     * Add an existing real TextNode to this view without reparenting or
     * rewriting its prev chain.  Graphics-state resolution and write-back
     * must continue to flow through the node's real parent.
     */
    override addSegment(segment: TextNode): void {
        this.segments.push(segment)
    }

    /**
     * No-op: VirtualTextBlock doesn't own ops, and parent blocks
     * auto-sync via their ops getter when accessed.
     */
    override get ops(): ContentOp[] {
        // Virtual blocks don't own BT/ET — their segments already live
        // in real parent blocks.  Accessing parent.ops automatically
        // rebuilds from segments via the getter.
        return []
    }

    override set ops(value: ContentOp[]) {
        // Virtual blocks are read-only views; ignore writes
    }

    /**
     * Compute the bbox in world (post-CTM) space.  The virtual block has
     * no parent chain, so its world coincides with its local — emit the
     * world-space union of its segments directly.
     */
    override getLocalBoundingBox(): Rect {
        if (this.segments.length === 0) {
            return new Rect({ x: 0, y: 0, width: 0, height: 0 })
        }
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const seg of this.segments) {
            const segBbox = seg.getLocalBoundingBox()
            const wtm = seg.getWorldTransform()
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
            'VirtualTextBlock cannot be serialised standalone; its segments already live in real content-stream blocks.',
        )
    }
}
