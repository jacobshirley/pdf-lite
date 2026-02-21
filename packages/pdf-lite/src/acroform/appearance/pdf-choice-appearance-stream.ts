import { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfAppearanceStream } from './pdf-appearance-stream.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfGraphics } from './pdf-graphics.js'

/**
 * Appearance stream for choice fields (dropdowns, list boxes).
 */
export class PdfChoiceAppearanceStream extends PdfAppearanceStream {
    constructor(ctx: {
        rect: [number, number, number, number]
        value: string
        da: PdfDefaultAppearance
        flags: number
        fontResources?: PdfDictionary
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
    }) {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const isUnicode = ctx.isUnicode ?? false
        const reverseEncodingMap = ctx.reverseEncodingMap

        const padding = 2
        const textY = (height - ctx.da.fontSize) / 2 + ctx.da.fontSize * 0.2

        const isCombo = (ctx.flags & 131072) !== 0

        const g = new PdfGraphics()
        g.beginMarkedContent()
        g.save()
        g.beginText()
        g.setDefaultAppearance(ctx.da)
        g.moveTo(padding, textY)
        g.showText(ctx.value, isUnicode, reverseEncodingMap)
        g.endText()

        if (isCombo) {
            const arrowWidth = height * 0.8
            const arrowX = width - arrowWidth - 2
            const arrowY = height / 2
            const arrowSize = height * 0.3

            g.save()
            g.setFillGray(0.5)
            g.movePath(arrowX + arrowWidth / 2, arrowY - arrowSize / 3)
            g.lineTo(
                arrowX + arrowWidth / 2 - arrowSize / 2,
                arrowY + arrowSize / 3,
            )
            g.lineTo(
                arrowX + arrowWidth / 2 + arrowSize / 2,
                arrowY + arrowSize / 3,
            )
            g.fill()
            g.restore()
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
