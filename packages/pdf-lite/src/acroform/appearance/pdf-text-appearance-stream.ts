import { PdfDefaultAppearance } from '../fields/pdf-default-appearance.js'
import { PdfAppearanceStream } from './pdf-appearance-stream.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfGraphics } from './pdf-graphics.js'

/**
 * Appearance stream for text fields (single-line, multiline, comb).
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
        isUnicode?: boolean
        reverseEncodingMap?: Map<string, number>
    }) {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const value = ctx.value
        const fontSize = ctx.da.fontSize
        const isUnicode = ctx.isUnicode ?? false
        const reverseEncodingMap = ctx.reverseEncodingMap

        const padding = 2
        const textY = (height - fontSize) / 2 + fontSize * 0.2

        const g = new PdfGraphics()
        g.raw('/Tx BMC')
        g.save()

        if (ctx.multiline) {
            const lines = value.split('\n')
            const lineHeight = fontSize * 1.2
            const startY = height - padding - fontSize

            g.beginText()
            g.setFont(ctx.da)
            g.moveTo(padding, startY)
            for (let i = 0; i < lines.length; i++) {
                if (i > 0) g.moveTo(0, -lineHeight)
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

            g.beginText()
            g.setFont(ctx.da)
            for (let i = 0; i < chars.length && i < ctx.maxLen; i++) {
                const cellX = cellWidth * i + cellWidth / 2 - fontSize * 0.3
                g.moveTo(cellX, textY)
                g.showText(chars[i], isUnicode, reverseEncodingMap)
                g.moveTo(-cellX, -textY)
            }
            g.endText()
        } else {
            g.beginText()
            g.setFont(ctx.da)
            g.moveTo(padding, textY)
            g.showText(value, isUnicode, reverseEncodingMap)
            g.endText()
        }

        g.restore()
        g.raw('EMC')

        super({
            width,
            height,
            contentStream: g.build(),
            resources: ctx.fontResources,
        })
    }
}
