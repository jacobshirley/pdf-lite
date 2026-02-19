import { PdfFormField } from './PdfFormField.js'
import { PdfDefaultAppearance } from './PdfDefaultAppearance.js'
import { PdfTextAppearanceStream } from '../appearance/PdfTextAppearanceStream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'

/**
 * Text form field subtype.
 */
export class PdfTextFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Tx', PdfTextFormField, {
            fallback: true,
        })
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

        let fontResources: PdfDictionary | undefined
        const drFontValue = this.form?.defaultResources?.get('Font')
        const drFonts =
            drFontValue instanceof PdfDictionary ? drFontValue : undefined
        if (drFonts) {
            fontResources = new PdfDictionary()
            fontResources.set('Font', drFonts)
        }

        this._appearanceStream = new PdfTextAppearanceStream({
            rect: rect as [number, number, number, number],
            value: this.value,
            da: parsed,
            multiline: this.multiline,
            comb: this.comb,
            maxLen: this.maxLen,
            fontResources,
        })

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
