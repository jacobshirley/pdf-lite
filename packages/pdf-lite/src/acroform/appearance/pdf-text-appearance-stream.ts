import { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfAppearanceStream } from './pdf-appearance-stream.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import type { PdfFont } from '../../fonts/pdf-font.js'
import { PdfGraphics } from './pdf-graphics.js'

const DEFAULT_FONT_SIZE = 12

/**
 * Appearance stream for text fields (single-line, multiline, comb).
 * Enhanced with word wrapping and automatic font scaling.
 */
export class PdfTextAppearanceStream extends PdfAppearanceStream {
    constructor(ctx: {
        rect: [number, number, number, number]
        value: string
        da: PdfDefaultAppearance
        multiline: boolean
        comb: boolean
        maxLen: number | null
        fontResources?: PdfDictionary
        resolvedFonts?: Map<string, PdfFont>
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
    }) {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const value = ctx.value
        const isUnicode = ctx.isUnicode ?? false
        const reverseEncodingMap = ctx.reverseEncodingMap

        const padding = 2
        const availableWidth = width - 2 * padding
        const availableHeight = height - 2 * padding
        const autoSize = ctx.da.fontSize <= 0

        // Create graphics with font context for text measurement
        const g = new PdfGraphics({
            resolvedFonts: ctx.resolvedFonts,
        })

        g.beginMarkedContent()
        g.save()

        // Bootstrap with a reference size so measureTextWidth works
        g.setDefaultAppearance(
            new PdfDefaultAppearance(
                ctx.da.fontName,
                DEFAULT_FONT_SIZE,
                ctx.da.colorOp,
            ),
        )

        // ── Determine font size ──────────────────────────────────────
        let finalFontSize: number

        if (autoSize) {
            // Acrobat auto-size: default to 12pt with wrapping, then
            // shrink only if the wrapped text still doesn't fit.
            finalFontSize = DEFAULT_FONT_SIZE
            const testLines = g.wrapTextToLines(value, availableWidth)
            if (testLines.length * DEFAULT_FONT_SIZE * 1.2 > availableHeight) {
                finalFontSize = g.calculateFittingFontSize(
                    value,
                    availableWidth,
                    availableHeight,
                    1.2,
                )
            }
            finalFontSize = Math.max(finalFontSize, 0.5)
        } else {
            finalFontSize = ctx.da.fontSize
        }

        // ── Render ───────────────────────────────────────────────────
        const finalDA = new PdfDefaultAppearance(
            ctx.da.fontName,
            finalFontSize,
            ctx.da.colorOp,
        )
        g.setDefaultAppearance(finalDA)

        let lines: string[] = []

        if (ctx.multiline || autoSize) {
            if (!autoSize) {
                const testLines = g.wrapTextToLines(value, availableWidth)
                const lineHeight = finalFontSize * 1.2

                if (testLines.length * lineHeight > availableHeight) {
                    finalFontSize = g.calculateFittingFontSize(
                        value,
                        availableWidth,
                        availableHeight,
                        1.2,
                    )
                    g.setDefaultAppearance(
                        new PdfDefaultAppearance(
                            ctx.da.fontName,
                            finalFontSize,
                            ctx.da.colorOp,
                        ),
                    )
                }
            }

            lines = g.wrapTextToLines(value, availableWidth)

            const renderLineHeight = finalFontSize * 1.2
            const startY = height - padding - finalFontSize

            g.beginText()
            g.moveTo(padding, startY)

            for (let i = 0; i < lines.length; i++) {
                if (i > 0) g.moveTo(0, -renderLineHeight)
                g.showText(
                    lines[i].replace(/\r/g, ''),
                    isUnicode,
                    reverseEncodingMap,
                )
            }
            g.endText()
        } else if (ctx.comb && ctx.maxLen) {
            const cellWidth = width / ctx.maxLen
            const chars = [...value]

            let maxCharWidth = 0
            let widestChar = chars[0] ?? ''
            for (const char of chars) {
                const charWidth = g.measureTextWidth(char)
                if (charWidth > maxCharWidth) {
                    maxCharWidth = charWidth
                    widestChar = char
                }
            }

            if (maxCharWidth > cellWidth) {
                finalFontSize = g.calculateFittingFontSize(
                    widestChar,
                    cellWidth,
                )
                g.setDefaultAppearance(
                    new PdfDefaultAppearance(
                        ctx.da.fontName,
                        finalFontSize,
                        ctx.da.colorOp,
                    ),
                )
            }

            const textY = (height - finalFontSize) / 2 + finalFontSize * 0.2

            g.beginText()
            for (let i = 0; i < chars.length && i < ctx.maxLen; i++) {
                const cellX =
                    cellWidth * i + cellWidth / 2 - finalFontSize * 0.3
                g.moveTo(cellX, textY)
                g.showText(chars[i], isUnicode, reverseEncodingMap)
                g.moveTo(-cellX, -textY)
            }
            g.endText()
        } else {
            // Single line — for non-auto-size, shrink if text overflows
            if (!autoSize) {
                const textWidth = g.measureTextWidth(value)
                if (textWidth > availableWidth) {
                    finalFontSize = g.calculateFittingFontSize(
                        value,
                        availableWidth,
                    )
                    g.setDefaultAppearance(
                        new PdfDefaultAppearance(
                            ctx.da.fontName,
                            finalFontSize,
                            ctx.da.colorOp,
                        ),
                    )
                }
            }

            const textY = (height - finalFontSize) / 2 + finalFontSize * 0.2

            g.beginText()
            g.moveTo(padding, textY)
            g.showText(value, isUnicode, reverseEncodingMap)
            g.endText()
        }

        g.restore()
        g.endMarkedContent()

        super({
            width,
            height,
            contentStream: g.build(),
            resources: ctx.fontResources,
        })
    }
}
