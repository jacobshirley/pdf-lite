import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfAppearanceStream } from './PdfAppearanceStream.js'
import { PdfGraphics } from './PdfGraphics.js'

/**
 * Appearance stream for button fields (checkboxes, radio buttons).
 */
export class PdfButtonAppearanceStream extends PdfAppearanceStream {
    constructor(ctx: { width: number; height: number; contentStream: string }) {
        const resources = new PdfDictionary()
        const fonts = new PdfDictionary()
        const zapfFont = new PdfDictionary()
        zapfFont.set('Type', new PdfName('Font'))
        zapfFont.set('Subtype', new PdfName('Type1'))
        zapfFont.set('BaseFont', new PdfName('ZapfDingbats'))
        fonts.set('ZaDb', zapfFont)
        resources.set('Font', fonts)

        super({
            width: ctx.width,
            height: ctx.height,
            contentStream: ctx.contentStream,
            resources,
        })
    }

    static buildYesContent(
        width: number,
        height: number,
        flags: number,
    ): string {
        const size = Math.min(width, height)
        const isRadio = (flags & 32768) !== 0

        const g = new PdfGraphics()

        if (isRadio) {
            const center = size / 2
            const radius = size * 0.35
            const k = 0.5522847498
            const kRadius = k * radius

            g.save()
            g.raw('0 0 0 rg')
            g.raw(`${center} ${center + radius} m`)
            g.raw(
                `${center + kRadius} ${center + radius} ${center + radius} ${center + kRadius} ${center + radius} ${center} c`,
            )
            g.raw(
                `${center + radius} ${center - kRadius} ${center + kRadius} ${center - radius} ${center} ${center - radius} c`,
            )
            g.raw(
                `${center - kRadius} ${center - radius} ${center - radius} ${center - kRadius} ${center - radius} ${center} c`,
            )
            g.raw(
                `${center - radius} ${center + kRadius} ${center - kRadius} ${center + radius} ${center} ${center + radius} c`,
            )
            g.raw('f')
            g.restore()
        } else {
            const checkSize = size * 0.8
            const offset = (size - checkSize) / 2

            g.save()
            g.beginText()
            g.raw(`/ZaDb ${checkSize} Tf`)
            g.moveTo(offset, offset)
            g.raw('(4) Tj')
            g.endText()
            g.restore()
        }

        return g.build()
    }
}
