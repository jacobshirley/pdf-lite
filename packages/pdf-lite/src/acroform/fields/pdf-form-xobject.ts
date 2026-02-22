import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfContentStream } from '../../content/pdf-content-stream.js'
import { PdfFont } from '../../fonts/pdf-font.js'
import { PdfTextLayout } from '../../content/pdf-text-layout.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import { PdfFormFieldFlags } from './pdf-form-field-flags.js'

/**
 * PDF Form XObject - a stream with Type=XObject, Subtype=Form.
 * Extends PdfContentStream with Form XObject metadata (BBox, Resources).
 * Used for appearance streams, reusable content, and more.
 */
export class PdfFormXObject extends PdfContentStream {
    constructor(options: {
        x?: number
        y?: number
        width?: number
        height?: number
        contentStream?: string
        resources?: PdfDictionary
    }) {
        const appearanceDict = new PdfDictionary()
        appearanceDict.set('Type', new PdfName('XObject'))
        appearanceDict.set('Subtype', new PdfName('Form'))
        appearanceDict.set('FormType', new PdfNumber(1))
        appearanceDict.set(
            'BBox',
            new PdfArray([
                new PdfNumber(options.x ?? 0),
                new PdfNumber(options.y ?? 0),
                new PdfNumber(options.width ?? 100),
                new PdfNumber(options.height ?? 100),
            ]),
        )

        if (options.resources) {
            appearanceDict.set('Resources', options.resources)
        }

        super({
            header: appearanceDict,
            contentStream: options.contentStream,
        })
    }

    /**
     * Create a Form XObject for a text field appearance stream.
     * Handles single-line, multiline, and comb text fields.
     */
    static createForTextField(ctx: {
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
    }): PdfFormXObject {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const stream = new PdfFormXObject({
            width,
            height,
            resources: ctx.fontResources,
        })

        stream.beginMarkedContent()
        stream.save()

        if (ctx.multiline) {
            // Use PdfContentStream.createTextBox for multiline
            const textStream = PdfContentStream.createTextBox({
                width,
                height,
                text: ctx.value,
                defaultAppearance: ctx.da,
                resolvedFonts: ctx.resolvedFonts,
                isUnicode: ctx.isUnicode ?? false,
                reverseEncodingMap: ctx.reverseEncodingMap,
            })
            stream.raw(textStream.contentStream.trim())
        } else if (ctx.comb && ctx.maxLen) {
            PdfFormXObject.renderCombField(stream, {
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
            // Use PdfContentStream.createSingleLineText for single line
            const textStream = PdfContentStream.createSingleLineText({
                width,
                height,
                text: ctx.value,
                defaultAppearance: ctx.da,
                resolvedFonts: ctx.resolvedFonts,
                isUnicode: ctx.isUnicode ?? false,
                reverseEncodingMap: ctx.reverseEncodingMap,
            })
            stream.raw(textStream.contentStream.trim())
        }

        stream.restore()
        stream.endMarkedContent()
        stream.build()

        return stream
    }

    /**
     * Create a Form XObject for a button field appearance stream.
     * Includes ZaDb font for checkmarks.
     */
    static createForButton(ctx: {
        width: number
        height: number
        contentStream: string
    }): PdfFormXObject {
        const resources = new PdfDictionary()
        const fonts = new PdfDictionary()
        fonts.set('ZaDb', PdfFont.ZAPF_DINGBATS)
        resources.set('Font', fonts)

        return new PdfFormXObject({
            width: ctx.width,
            height: ctx.height,
            contentStream: ctx.contentStream,
            resources,
        })
    }

    /**
     * Create a Form XObject for a choice field appearance stream.
     * Handles combo boxes (dropdowns) and list boxes.
     */
    static createForChoice(ctx: {
        rect: [number, number, number, number]
        value: string
        da: PdfDefaultAppearance
        flags: number | PdfFormFieldFlags
        fontResources?: PdfDictionary
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
        displayOptions?: string[]
        selectedIndex?: number
    }): PdfFormXObject {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const stream = new PdfFormXObject({
            width,
            height,
            resources: ctx.fontResources,
        })

        const isUnicode = ctx.isUnicode ?? false
        const reverseEncodingMap = ctx.reverseEncodingMap
        const padding = 2
        const isCombo = new PdfFormFieldFlags(ctx.flags).combo

        stream.beginMarkedContent()
        stream.save()

        if (!isCombo && ctx.displayOptions && ctx.displayOptions.length > 0) {
            // Listbox: render all items, highlight the selected one
            const lineHeight = ctx.da.fontSize + 4
            const selectedIndex = ctx.selectedIndex ?? -1

            for (let i = 0; i < ctx.displayOptions.length; i++) {
                const itemY = height - (i + 1) * lineHeight

                if (itemY + lineHeight < 0) break

                if (i === selectedIndex) {
                    stream.save()
                    stream.setFillRGB(0.376, 0.62, 0.671)
                    stream.raw(`0 ${itemY} ${width} ${lineHeight} re`)
                    stream.fill()
                    stream.restore()
                }

                const textY = itemY + lineHeight * 0.25
                stream.beginText()
                stream.setDefaultAppearance(ctx.da)
                stream.moveTo(padding, textY)
                stream.showText(ctx.displayOptions[i], isUnicode, reverseEncodingMap)
                stream.endText()
            }
        } else {
            // Combo (dropdown) or no options: show selected value only
            const textY = (height - ctx.da.fontSize) / 2 + ctx.da.fontSize * 0.2
            stream.beginText()
            stream.setDefaultAppearance(ctx.da)
            stream.moveTo(padding, textY)
            stream.showText(ctx.value, isUnicode, reverseEncodingMap)
            stream.endText()

            if (isCombo) {
                const arrowWidth = height * 0.8
                const arrowX = width - arrowWidth - 2
                const arrowY = height / 2
                const arrowSize = height * 0.3

                stream.save()
                stream.setFillGray(0.5)
                stream.movePath(arrowX + arrowWidth / 2, arrowY - arrowSize / 3)
                stream.lineTo(
                    arrowX + arrowWidth / 2 - arrowSize / 2,
                    arrowY + arrowSize / 3,
                )
                stream.lineTo(
                    arrowX + arrowWidth / 2 + arrowSize / 2,
                    arrowY + arrowSize / 3,
                )
                stream.fill()
                stream.restore()
            }
        }

        stream.restore()
        stream.endMarkedContent()
        stream.build()

        return stream
    }

    /**
     * Build button field checked state content stream (checkmark or radio dot).
     */
    static createButtonContent(
        width: number,
        height: number,
        flags: number | PdfFormFieldFlags,
    ): string {
        const size = Math.min(width, height)
        const isRadio = new PdfFormFieldFlags(flags).radio

        const builder = new PdfContentStream()

        if (isRadio) {
            const center = size / 2
            const radius = size * 0.35
            const k = 0.5522847498
            const kRadius = k * radius

            builder.save()
            builder.setFillRGB(0, 0, 0)
            builder.movePath(center, center + radius)
            builder.curveTo(
                center + kRadius,
                center + radius,
                center + radius,
                center + kRadius,
                center + radius,
                center,
            )
            builder.curveTo(
                center + radius,
                center - kRadius,
                center + kRadius,
                center - radius,
                center,
                center - radius,
            )
            builder.curveTo(
                center - kRadius,
                center - radius,
                center - radius,
                center - kRadius,
                center - radius,
                center,
            )
            builder.curveTo(
                center - radius,
                center + kRadius,
                center - kRadius,
                center + radius,
                center,
                center + radius,
            )
            builder.fill()
            builder.restore()
        } else {
            const checkSize = size * 0.8
            const offset = (size - checkSize) / 2

            builder.save()
            builder.beginText()
            builder.setFont('ZaDb', checkSize)
            builder.moveTo(offset, offset)
            builder.showLiteralText('4') // Checkmark in Zapf Dingbats
            builder.endText()
            builder.restore()
        }

        builder.build()
        return builder.contentStream
    }

    /**
     * Render comb field with fixed-width character cells.
     */
    private static renderCombField(
        stream: PdfFormXObject,
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

        const layout = new PdfTextLayout({
            defaultAppearance: da,
            resolvedFonts,
        })

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
            finalFontSize = layout.calculateFittingFontSize(widestChar, cellWidth)
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
}
