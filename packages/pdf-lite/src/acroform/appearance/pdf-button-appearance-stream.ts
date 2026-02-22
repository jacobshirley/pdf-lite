import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfAppearanceStream } from './pdf-appearance-stream.js'
import { PdfContentStream } from './pdf-content-stream.js'
import { PdfFont } from '../../fonts/pdf-font.js'
import { PdfFormFieldFlags } from '../fields/pdf-form-field-flags.js'

/**
 * Appearance stream for button fields (checkboxes, radio buttons).
 */
export class PdfButtonAppearanceStream extends PdfAppearanceStream {
    constructor(ctx: { width: number; height: number; contentStream: string }) {
        const resources = new PdfDictionary()
        const fonts = new PdfDictionary()
        fonts.set('ZaDb', PdfFont.ZAPF_DINGBATS)
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
        flags: number | PdfFormFieldFlags,
    ): string {
        const size = Math.min(width, height)
        const isRadio = new PdfFormFieldFlags(flags).radio

        // Use a temporary content stream for building
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
            builder.showLiteralText('4') // Checkmark character in Zapf Dingbats
            builder.endText()
            builder.restore()
        }

        builder.build()
        return builder.contentStream
    }
}
