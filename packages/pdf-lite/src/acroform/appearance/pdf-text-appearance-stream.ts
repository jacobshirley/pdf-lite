import { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfAppearanceStream } from './pdf-appearance-stream.js'
import { PdfTextLayout } from '../../content/pdf-text-layout.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import type { PdfFont } from '../../fonts/pdf-font.js'

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

        // Initialize super with font context for text measurement
        super({
            width,
            height,
            resources: ctx.fontResources,
        })

        this.beginMarkedContent()
        this.save()

        // Set initial font to enable measurement
        this.setDefaultAppearance(ctx.da)

        // Delegate to appropriate rendering function
        if (ctx.multiline) {
            PdfTextAppearanceStream.renderMultilineText(this, {
                value: ctx.value,
                width,
                height,
                da: ctx.da,
                resolvedFonts: ctx.resolvedFonts,
                isUnicode: ctx.isUnicode ?? false,
                reverseEncodingMap: ctx.reverseEncodingMap,
            })
        } else if (ctx.comb && ctx.maxLen) {
            PdfTextAppearanceStream.renderCombField(this, {
                value: ctx.value,
                width,
                height,
                maxLen: ctx.maxLen,
                da: ctx.da,
                resolvedFonts: ctx.resolvedFonts,
                isUnicode: ctx.isUnicode ?? false,
                reverseEncodingMap: ctx.reverseEncodingMap,
            })
        } else {
            PdfTextAppearanceStream.renderSingleLineText(this, {
                value: ctx.value,
                width,
                height,
                da: ctx.da,
                resolvedFonts: ctx.resolvedFonts,
                isUnicode: ctx.isUnicode ?? false,
                reverseEncodingMap: ctx.reverseEncodingMap,
            })
        }

        this.restore()
        this.endMarkedContent()

        // Build the content stream
        this.build()
    }

    /**
     * Render multiline text with word wrapping and automatic font scaling.
     */
    static renderMultilineText(
        stream: PdfAppearanceStream,
        options: {
            value: string
            width: number
            height: number
            da: PdfDefaultAppearance
            resolvedFonts?: Map<string, PdfFont>
            padding?: number
            lineHeight?: number
            isUnicode?: boolean
            reverseEncodingMap?: Map<string, number>
        },
    ): void {
        const {
            value,
            width,
            height,
            da,
            resolvedFonts,
            padding = 2,
            lineHeight = 1.2,
            isUnicode = false,
            reverseEncodingMap,
        } = options

        const availableWidth = width - 2 * padding
        const availableHeight = height - 2 * padding

        // Create layout calculator for text measurement
        let layout = new PdfTextLayout({
            defaultAppearance: da,
            resolvedFonts,
        })

        let finalFontSize = da.fontSize
        const testLines = layout.wrapTextToLines(value, availableWidth)
        let lines = testLines

        if (testLines.length * finalFontSize * lineHeight > availableHeight) {
            // Scale font down to fit
            finalFontSize = layout.calculateFittingFontSize(
                value,
                availableWidth,
                availableHeight,
                lineHeight,
            )

            const adjustedDA = new PdfDefaultAppearance(
                da.fontName,
                finalFontSize,
                da.colorOp,
            )
            stream.setDefaultAppearance(adjustedDA)
            // Update layout with new font size
            layout = new PdfTextLayout({
                defaultAppearance: adjustedDA,
                resolvedFonts,
            })
            lines = layout.wrapTextToLines(value, availableWidth)
        }

        const renderLineHeight = finalFontSize * lineHeight
        const startY = height - padding - finalFontSize

        stream.beginText()
        stream.moveTo(padding, startY)

        for (let i = 0; i < lines.length; i++) {
            if (i > 0) stream.moveTo(0, -renderLineHeight)
            stream.showText(
                lines[i].replace(/\r/g, ''),
                isUnicode,
                reverseEncodingMap,
            )
        }

        stream.endText()
    }

    /**
     * Render comb field with fixed-width character cells.
     */
    static renderCombField(
        stream: PdfAppearanceStream,
        options: {
            value: string
            width: number
            height: number
            maxLen: number
            da: PdfDefaultAppearance
            resolvedFonts?: Map<string, PdfFont>
            isUnicode?: boolean
            reverseEncodingMap?: Map<string, number>
        },
    ): void {
        const {
            value,
            width,
            height,
            maxLen,
            da,
            resolvedFonts,
            isUnicode = false,
            reverseEncodingMap,
        } = options

        const cellWidth = width / maxLen
        const chars = [...value]

        // Create layout calculator for text measurement
        const layout = new PdfTextLayout({
            defaultAppearance: da,
            resolvedFonts,
        })

        // Calculate font size to fit the widest character in its cell
        let finalFontSize = da.fontSize
        let maxCharWidth = 0
        let widestChar = chars[0] ?? ''

        for (const char of chars) {
            const charWidth = layout.measureTextWidth(char)
            if (charWidth > maxCharWidth) {
                maxCharWidth = charWidth
                widestChar = char
            }
        }

        if (maxCharWidth > cellWidth) {
            finalFontSize = layout.calculateFittingFontSize(
                widestChar,
                cellWidth,
            )
            const adjustedDA = new PdfDefaultAppearance(
                da.fontName,
                finalFontSize,
                da.colorOp,
            )
            stream.setDefaultAppearance(adjustedDA)
        }

        const textY = (height - finalFontSize) / 2 + finalFontSize * 0.2

        stream.beginText()
        for (let i = 0; i < chars.length && i < maxLen; i++) {
            const cellX = cellWidth * i + cellWidth / 2 - finalFontSize * 0.3
            stream.moveTo(cellX, textY)
            stream.showText(chars[i], isUnicode, reverseEncodingMap)
            stream.moveTo(-cellX, -textY)
        }
        stream.endText()
    }

    /**
     * Render single line of text with automatic font scaling.
     */
    static renderSingleLineText(
        stream: PdfAppearanceStream,
        options: {
            value: string
            width: number
            height: number
            da: PdfDefaultAppearance
            resolvedFonts?: Map<string, PdfFont>
            padding?: number
            isUnicode?: boolean
            reverseEncodingMap?: Map<string, number>
        },
    ): void {
        const {
            value,
            width,
            height,
            da,
            resolvedFonts,
            padding = 2,
            isUnicode = false,
            reverseEncodingMap,
        } = options

        const availableWidth = width - 2 * padding

        // Create layout calculator for text measurement
        const layout = new PdfTextLayout({
            defaultAppearance: da,
            resolvedFonts,
        })

        let finalFontSize = da.fontSize
        const textWidth = layout.measureTextWidth(value)

        if (textWidth > availableWidth) {
            finalFontSize = layout.calculateFittingFontSize(
                value,
                availableWidth,
            )
            const adjustedDA = new PdfDefaultAppearance(
                da.fontName,
                finalFontSize,
                da.colorOp,
            )
            stream.setDefaultAppearance(adjustedDA)
        }

        const textY = (height - finalFontSize) / 2 + finalFontSize * 0.2

        stream.beginText()
        stream.moveTo(padding, textY)
        stream.showText(value, isUnicode, reverseEncodingMap)
        stream.endText()
    }
}
