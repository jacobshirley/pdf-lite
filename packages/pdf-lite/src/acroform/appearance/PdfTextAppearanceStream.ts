import { PdfDefaultAppearance } from '../fields/PdfDefaultAppearance.js'
import { PdfAppearanceStream } from './PdfAppearanceStream.js'
import type { PdfDictionary } from '../../core/objects/pdf-dictionary.js'

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
    }) {
        const [x1, y1, x2, y2] = ctx.rect
        const width = x2 - x1
        const height = y2 - y1

        const value = ctx.value
        const reconstructedDA = ctx.da.toString()
        const fontSize = ctx.da.fontSize

        const padding = 2
        const textY = (height - fontSize) / 2 + fontSize * 0.2

        const escapedValue = value
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n')

        let textContent: string

        if (ctx.multiline) {
            const lines = value.split('\n')
            const lineHeight = fontSize * 1.2
            const startY = height - padding - fontSize

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
                const cellX = cellWidth * i + cellWidth / 2 - fontSize * 0.3
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

        super({ width, height, contentStream, resources: ctx.fontResources })
    }
}
