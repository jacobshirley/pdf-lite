import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfDefaultAppearance } from '../fields/PdfDefaultAppearance.js'
import { AppearanceStreamBuilder } from './AppearanceStreamBuilder.js'
import type { PdfDefaultResourcesDictionary } from '../acroform.js'

export interface TextFieldContext {
    rect: number[] | null
    value: string
    defaultAppearance: string | null
    multiline: boolean
    comb: boolean
    maxLen: number | null
    fieldDR: PdfDictionary | null | undefined
    acroformDR: PdfDefaultResourcesDictionary | null | undefined
}

/**
 * Generates appearance streams for text fields (single-line, multiline, comb).
 */
export class TextAppearanceGenerator {
    static generate(ctx: TextFieldContext): PdfStream | null {
        const rect = ctx.rect
        if (!rect || rect.length !== 4) return null

        const da = ctx.defaultAppearance
        if (!da) return null

        const parsed = PdfDefaultAppearance.parse(da)
        if (!parsed) return null

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        const value = ctx.value
        const reconstructedDA = parsed.toString()

        const padding = 2
        const textY = (height - parsed.fontSize) / 2 + parsed.fontSize * 0.2

        const escapedValue = value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')

        let textContent: string

        if (ctx.multiline) {
            const lines = value.split('\n')
            const lineHeight = parsed.fontSize * 1.2
            const startY = height - padding - parsed.fontSize

            textContent = 'BT\n'
            textContent += `${reconstructedDA}\n`
            textContent += `${padding} ${startY} Td\n`

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                    .replace(/\\/g, '\\\\')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')
                    .replace(/\r/g, '')

                if (i > 0) {
                    textContent += `0 ${-lineHeight} Td\n`
                }
                textContent += `(${line}) Tj\n`
            }

            textContent += 'ET\n'
        } else if (ctx.comb && ctx.maxLen) {
            const cellWidth = width / ctx.maxLen
            const chars = value.split('')

            textContent = 'BT\n'
            textContent += `${reconstructedDA}\n`

            for (let i = 0; i < chars.length && i < ctx.maxLen; i++) {
                const cellX =
                    cellWidth * i + cellWidth / 2 - parsed.fontSize * 0.3
                const escapedChar = chars[i]
                    .replace(/\\/g, '\\\\')
                    .replace(/\(/g, '\\(')
                    .replace(/\)/g, '\\)')

                textContent += `${cellX} ${textY} Td\n`
                textContent += `(${escapedChar}) Tj\n`
                textContent += `${-cellX} ${-textY} Td\n`
            }

            textContent += 'ET\n'
        } else {
            const textX = padding
            textContent = `BT
${reconstructedDA}
${textX} ${textY} Td
(${escapedValue}) Tj
ET
`
        }

        const contentStream = `/Tx BMC
q
${textContent}Q
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
