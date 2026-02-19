import { PdfDefaultAppearance } from '../fields/PdfDefaultAppearance.js'
import { PdfAppearanceStream } from './PdfAppearanceStream.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'

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
    }) {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const colorOp = '0 g'
        const reconstructedDA = `/${ctx.da.fontName} ${ctx.da.fontSize} Tf ${colorOp}`

        const padding = 2
        const textY = (height - ctx.da.fontSize) / 2 + ctx.da.fontSize * 0.2
        const textX = padding

        const escapedValue = ctx.value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')

        const isCombo = (ctx.flags & 131072) !== 0

        let arrowGraphics = ''
        if (isCombo) {
            const arrowWidth = height * 0.8
            const arrowX = width - arrowWidth - 2
            const arrowY = height / 2
            const arrowSize = height * 0.3

            arrowGraphics = `
q
0.5 0.5 0.5 rg
${arrowX + arrowWidth / 2} ${arrowY - arrowSize / 3} m
${arrowX + arrowWidth / 2 - arrowSize / 2} ${arrowY + arrowSize / 3} l
${arrowX + arrowWidth / 2 + arrowSize / 2} ${arrowY + arrowSize / 3} l
f
Q
`
        }

        const contentStream = `/Tx BMC
q
BT
${reconstructedDA}
${textX} ${textY} Td
(${escapedValue}) Tj
ET
${arrowGraphics}Q
EMC
`

        super({ width, height, contentStream, resources: ctx.fontResources })
    }
}
