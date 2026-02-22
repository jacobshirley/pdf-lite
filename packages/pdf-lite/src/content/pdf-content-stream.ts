import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { encodePdfText } from '../utils/encodePdfText.js'
import type { PdfDefaultAppearance } from '../acroform/fields/pdf-default-appearance.js'
import { PdfFont } from '../fonts/pdf-font.js'
import { PdfTextLayout } from './pdf-text-layout.js'

/**
 * A content stream that extends PdfIndirectObject<PdfStream> with a fluent API
 * for building PDF graphics operators.
 *
 * Can be used for:
 * - Page content streams
 * - Form XObject streams (via PdfFormXObject subclass)
 * - Any PDF content stream that contains graphics operators
 *
 * The builder methods accumulate operators, and build() writes them to the stream.
 */
export class PdfContentStream extends PdfIndirectObject<PdfStream> {
    private lines: string[] = []

    constructor(options?: {
        header?: PdfDictionary
        contentStream?: string
    }) {
        const stream = new PdfStream({
            header: options?.header ?? new PdfDictionary(),
            original: options?.contentStream ?? '',
        })
        super({ content: stream })
    }

    /**
     * Gets the content stream as a string.
     */
    get contentStream(): string {
        return this.content.rawAsString
    }

    /**
     * Sets the content stream from a string, replacing any pending operations.
     */
    set contentStream(newContent: string) {
        this.content.rawAsString = newContent
        this.lines = []
    }

    // ==================== Graphics State Operators ====================

    save(): this {
        this.lines.push('q')
        return this
    }

    restore(): this {
        this.lines.push('Q')
        return this
    }

    // ==================== Text Operators ====================

    beginText(): this {
        this.lines.push('BT')
        return this
    }

    endText(): this {
        this.lines.push('ET')
        return this
    }

    setDefaultAppearance(da: PdfDefaultAppearance): this {
        this.lines.push(da.toString())
        return this
    }

    moveTo(x: number, y: number): this {
        this.lines.push(`${x} ${y} Td`)
        return this
    }

    showText(
        text: string,
        isUnicode: boolean,
        reverseEncodingMap?: Map<string, number>,
    ): this {
        this.lines.push(
            `${encodePdfText(text, isUnicode, reverseEncodingMap)} Tj`,
        )
        return this
    }

    showLiteralText(text: string): this {
        this.lines.push(`(${text}) Tj`)
        return this
    }

    setFont(name: string, size: number): this {
        this.lines.push(`/${name} ${size} Tf`)
        return this
    }

    // ==================== Marked Content Operators ====================

    beginMarkedContent(): this {
        this.lines.push('/Tx BMC')
        return this
    }

    endMarkedContent(): this {
        this.lines.push('EMC')
        return this
    }

    // ==================== Path Operators ====================

    movePath(x: number, y: number): this {
        this.lines.push(`${x} ${y} m`)
        return this
    }

    lineTo(x: number, y: number): this {
        this.lines.push(`${x} ${y} l`)
        return this
    }

    curveTo(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number,
    ): this {
        this.lines.push(`${x1} ${y1} ${x2} ${y2} ${x3} ${y3} c`)
        return this
    }

    closePath(): this {
        this.lines.push('h')
        return this
    }

    fill(): this {
        this.lines.push('f')
        return this
    }

    stroke(): this {
        this.lines.push('S')
        return this
    }

    // ==================== Color Operators ====================

    setFillRGB(r: number, g: number, b: number): this {
        this.lines.push(`${r} ${g} ${b} rg`)
        return this
    }

    setFillGray(v: number): this {
        this.lines.push(`${v} g`)
        return this
    }

    // ==================== Raw Operator ====================

    raw(op: string): this {
        this.lines.push(op)
        return this
    }

    // ==================== Build Method ====================

    /**
     * Finalizes the pending operations and writes them to the content stream.
     * Returns this for chaining.
     */
    build(): this {
        if (this.lines.length > 0) {
            this.content.rawAsString = this.lines.join('\n') + '\n'
            this.lines = []
        }
        return this
    }

    // ==================== Factory Methods ====================

    /**
     * Create a content stream with a multiline text box with automatic font scaling.
     */
    static createTextBox(options: {
        width: number
        height: number
        text: string
        defaultAppearance: PdfDefaultAppearance
        resolvedFonts?: Map<string, PdfFont>
        padding?: number
        lineHeight?: number
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
    }): PdfContentStream {
        const {
            width,
            height,
            text,
            defaultAppearance,
            resolvedFonts,
            padding = 2,
            lineHeight = 1.2,
            isUnicode = false,
            reverseEncodingMap,
        } = options

        const availableWidth = width - 2 * padding
        const availableHeight = height - 2 * padding

        const stream = new PdfContentStream({})

        const layout = new PdfTextLayout({ defaultAppearance, resolvedFonts })

        // Calculate if we need to scale down
        const testLines = layout.wrapTextToLines(text, availableWidth)
        let finalFontSize = defaultAppearance.fontSize
        let lines = testLines

        if (testLines.length * finalFontSize * lineHeight > availableHeight) {
            finalFontSize = layout.calculateFittingFontSize(
                text,
                availableWidth,
                availableHeight,
                lineHeight,
            )

            const adjustedDA = new (defaultAppearance.constructor as any)(
                defaultAppearance.fontName,
                finalFontSize,
                (defaultAppearance as any).colorOp,
            )
            const adjustedLayout = new PdfTextLayout({
                defaultAppearance: adjustedDA,
                resolvedFonts,
            })
            lines = adjustedLayout.wrapTextToLines(text, availableWidth)
            stream.setDefaultAppearance(adjustedDA)
        } else {
            stream.setDefaultAppearance(defaultAppearance)
        }

        const renderLineHeight = finalFontSize * lineHeight
        const startY = height - padding - finalFontSize

        stream.save()
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
        stream.restore()
        stream.build()

        return stream
    }

    /**
     * Create a content stream with a single line of text with automatic font scaling.
     */
    static createSingleLineText(options: {
        width: number
        height: number
        text: string
        defaultAppearance: PdfDefaultAppearance
        resolvedFonts?: Map<string, PdfFont>
        padding?: number
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
    }): PdfContentStream {
        const {
            width,
            height,
            text,
            defaultAppearance,
            resolvedFonts,
            padding = 2,
            isUnicode = false,
            reverseEncodingMap,
        } = options

        const availableWidth = width - 2 * padding

        const stream = new PdfContentStream({
        })

        const layout = new PdfTextLayout({ defaultAppearance, resolvedFonts })

        // Calculate if we need to scale down
        const textWidth = layout.measureTextWidth(text)
        let finalFontSize = defaultAppearance.fontSize

        if (textWidth > availableWidth) {
            finalFontSize = layout.calculateFittingFontSize(
                text,
                availableWidth,
            )

            const adjustedDA = new (defaultAppearance.constructor as any)(
                defaultAppearance.fontName,
                finalFontSize,
                (defaultAppearance as any).colorOp,
            )
            stream.setDefaultAppearance(adjustedDA)
        } else {
            stream.setDefaultAppearance(defaultAppearance)
        }

        const textY = (height - finalFontSize) / 2 + finalFontSize * 0.2

        stream.save()
        stream.beginText()
        stream.moveTo(padding, textY)
        stream.showText(text, isUnicode, reverseEncodingMap)
        stream.endText()
        stream.restore()
        stream.build()

        return stream
    }
}
