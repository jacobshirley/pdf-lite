import { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfAppearanceStream } from './pdf-appearance-stream.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import type { PdfFont } from '../../fonts/pdf-font.js'
import { PdfFormFieldFlags } from '../fields/pdf-form-field-flags.js'

/**
 * Appearance stream for choice fields (dropdowns, list boxes).
 */
export class PdfChoiceAppearanceStream extends PdfAppearanceStream {
    constructor(ctx: {
        rect: [number, number, number, number]
        value: string
        da: PdfDefaultAppearance
        flags: number | PdfFormFieldFlags
        fontResources?: PdfDictionary
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
        displayOptions?: string[]
        selectedIndex?: number
    }) {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        super({
            width,
            height,
            resources: ctx.fontResources,
        })

        const isUnicode = ctx.isUnicode ?? false
        const reverseEncodingMap = ctx.reverseEncodingMap

        const padding = 2
        const isCombo = new PdfFormFieldFlags(ctx.flags).combo

        this.beginMarkedContent()
        this.save()

        if (!isCombo && ctx.displayOptions && ctx.displayOptions.length > 0) {
            // Listbox: render all items, highlight the selected one
            const lineHeight = ctx.da.fontSize + 4
            const selectedIndex = ctx.selectedIndex ?? -1

            for (let i = 0; i < ctx.displayOptions.length; i++) {
                const itemY = height - (i + 1) * lineHeight

                // Stop rendering if we've gone below the visible area
                if (itemY + lineHeight < 0) break

                if (i === selectedIndex) {
                    this.save()
                    this.setFillRGB(0.376, 0.62, 0.671)
                    this.raw(`0 ${itemY} ${width} ${lineHeight} re`)
                    this.fill()
                    this.restore()
                }

                const textY = itemY + lineHeight * 0.25
                this.beginText()
                this.setDefaultAppearance(ctx.da)
                this.moveTo(padding, textY)
                this.showText(
                    ctx.displayOptions[i],
                    isUnicode,
                    reverseEncodingMap,
                )
                this.endText()
            }
        } else {
            // Combo (dropdown) or no options: show selected value only
            const textY = (height - ctx.da.fontSize) / 2 + ctx.da.fontSize * 0.2
            this.beginText()

            this.setDefaultAppearance(ctx.da)
            this.moveTo(padding, textY)
            this.showText(ctx.value, isUnicode, reverseEncodingMap)
            this.endText()

            if (isCombo) {
                const arrowWidth = height * 0.8
                const arrowX = width - arrowWidth - 2
                const arrowY = height / 2
                const arrowSize = height * 0.3

                this.save()
                this.setFillGray(0.5)
                this.movePath(arrowX + arrowWidth / 2, arrowY - arrowSize / 3)
                this.lineTo(
                    arrowX + arrowWidth / 2 - arrowSize / 2,
                    arrowY + arrowSize / 3,
                )
                this.lineTo(
                    arrowX + arrowWidth / 2 + arrowSize / 2,
                    arrowY + arrowSize / 3,
                )
                this.fill()
                this.restore()
            }
        }

        this.restore()
        this.endMarkedContent()

        // Build the content stream
        this.build()
    }
}
