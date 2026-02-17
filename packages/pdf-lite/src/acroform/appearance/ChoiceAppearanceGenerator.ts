import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfDefaultAppearance } from '../fields/PdfDefaultAppearance.js'
import { AppearanceStreamBuilder } from './AppearanceStreamBuilder.js'
import type { PdfDefaultResourcesDictionary } from '../acroform.js'

export interface ChoiceFieldContext {
    rect: number[] | null
    value: string
    defaultAppearance: string | null
    flags: number
    fieldDR: PdfDictionary | null | undefined
    acroformDR: PdfDefaultResourcesDictionary | null | undefined
}

/**
 * Generates appearance streams for choice fields (dropdowns, list boxes).
 */
export class ChoiceAppearanceGenerator {
    static generate(ctx: ChoiceFieldContext): PdfStream | null {
        const rect = ctx.rect
        if (!rect || rect.length !== 4) return null

        const da = ctx.defaultAppearance
        if (!da) return null

        const value = ctx.value
        if (!value) return null

        const parsed = PdfDefaultAppearance.parse(da)
        if (!parsed) return null

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        const colorOp = '0 g'
        const reconstructedDA = `/${parsed.fontName} ${parsed.fontSize} Tf ${colorOp}`

        const padding = 2
        const textY = (height - parsed.fontSize) / 2 + parsed.fontSize * 0.2
        const textX = padding

        const escapedValue = value
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

        const resources = AppearanceStreamBuilder.resolveFontResources(
            parsed.fontName,
            ctx.fieldDR,
            ctx.acroformDR,
        )

        return AppearanceStreamBuilder.createFormXObject(
            width,
            height,
            contentStream,
            resources,
        )
    }
}
