import { PdfFormField } from './pdf-form-field.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import { PdfTextAppearanceStream } from '../appearance/pdf-text-appearance-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfFont } from '../../fonts/pdf-font.js'

/**
 * Text form field subtype.
 */
export class PdfTextFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Tx', PdfTextFormField)
    }

    generateAppearance(options?: {
        makeReadOnly?: boolean
        textYOffset?: number
    }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const da = this.defaultAppearance
        if (!da) return false

        const parsed = PdfDefaultAppearance.parse(da)
        if (!parsed) return false

        const font = this.font
        let fontResources: PdfDictionary | undefined

        // Build Resources from DR if available
        const dr = this.defaultResources
        const drFontDict = dr?.get('Font')?.as(PdfDictionary)
        if (drFontDict && drFontDict.get(parsed.fontName)) {
            const resFontDict = new PdfDictionary()
            resFontDict.set(parsed.fontName, drFontDict.get(parsed.fontName)!)
            fontResources = new PdfDictionary()
            fontResources.set('Font', resFontDict)
        } else if (font && !PdfFont.getStandardFont(parsed.fontName)) {
            const ref = font.reference
            const fontDict = new PdfDictionary()
            fontDict.set(parsed.fontName, ref)
            fontResources = new PdfDictionary()
            fontResources.set('Font', fontDict)
        }

        const isUnicode = font?.isUnicode ?? false
        const reverseEncodingMap = font?.reverseEncodingMap

        this.setAppearanceStream(
            new PdfTextAppearanceStream({
                rect: rect,
                value: this.value,
                da: parsed,
                multiline: this.multiline,
                comb: this.comb,
                maxLen: this.maxLen,
                fontResources,
                isUnicode,
                reverseEncodingMap,
            }),
        )

        if (options?.makeReadOnly) {
            this.readOnly = true
            if (!this.print) this.print = true
            this.noZoom = true
        } else {
            if (!this.print) this.print = true
        }
        return true
    }
}
