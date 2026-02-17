import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'

export interface ButtonFieldContext {
    rect: number[] | null
    flags: number
}

/**
 * Generates appearance streams for button fields (checkboxes, radio buttons).
 * Returns both Off and Yes states.
 */
export class ButtonAppearanceGenerator {
    static generate(
        ctx: ButtonFieldContext,
    ): { primary: PdfStream; secondary: PdfStream } | null {
        const rect = ctx.rect
        if (!rect || rect.length !== 4) return null

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1
        const size = Math.min(width, height)

        const isRadio = (ctx.flags & 32768) !== 0

        const createAppearanceStream = (content: string) => {
            const appearanceDict = new PdfDictionary()
            appearanceDict.set('Type', new PdfName('XObject'))
            appearanceDict.set('Subtype', new PdfName('Form'))
            appearanceDict.set('FormType', new PdfNumber(1))
            appearanceDict.set(
                'BBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(width),
                    new PdfNumber(height),
                ]),
            )

            const resources = new PdfDictionary()
            const fonts = new PdfDictionary()
            const zapfFont = new PdfDictionary()
            zapfFont.set('Type', new PdfName('Font'))
            zapfFont.set('Subtype', new PdfName('Type1'))
            zapfFont.set('BaseFont', new PdfName('ZapfDingbats'))
            fonts.set('ZaDb', zapfFont)
            resources.set('Font', fonts)
            appearanceDict.set('Resources', resources)

            return new PdfStream({
                header: appearanceDict,
                original: content,
            })
        }

        const offStream = createAppearanceStream('')

        let yesContent: string
        if (isRadio) {
            const center = size / 2
            const radius = size * 0.35
            const k = 0.5522847498
            const kRadius = k * radius

            yesContent = `q
0 0 0 rg
${center} ${center + radius} m
${center + kRadius} ${center + radius} ${center + radius} ${center + kRadius} ${center + radius} ${center} c
${center + radius} ${center - kRadius} ${center + kRadius} ${center - radius} ${center} ${center - radius} c
${center - kRadius} ${center - radius} ${center - radius} ${center - kRadius} ${center - radius} ${center} c
${center - radius} ${center + kRadius} ${center - kRadius} ${center + radius} ${center} ${center + radius} c
f
Q
`
        } else {
            const checkSize = size * 0.8
            const offset = (size - checkSize) / 2
            yesContent = `q
BT
/ZaDb ${checkSize} Tf
${offset} ${offset} Td
(4) Tj
ET
Q
`
        }
        const yesStream = createAppearanceStream(yesContent)

        return { primary: offStream, secondary: yesStream }
    }
}
