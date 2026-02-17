import { PdfFormField } from './PdfFormField.js'
import { PdfDefaultAppearance } from './PdfDefaultAppearance.js'
import { PdfTextAppearanceStream } from '../appearance/PdfTextAppearanceStream.js'

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

        this._appearanceStream = new PdfTextAppearanceStream({
            rect: rect as [number, number, number, number],
            value: this.value,
            da: parsed,
            multiline: this.multiline,
            comb: this.comb,
            maxLen: this.maxLen,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        } else {
            this.print = true
        }
        return true
    }
}
