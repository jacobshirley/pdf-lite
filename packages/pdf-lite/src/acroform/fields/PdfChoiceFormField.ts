import { PdfFormField } from './PdfFormField.js'
import { PdfDefaultAppearance } from './PdfDefaultAppearance.js'
import { PdfChoiceAppearanceStream } from '../appearance/PdfChoiceAppearanceStream.js'

/**
 * Choice form field subtype (dropdowns, list boxes).
 */
export class PdfChoiceFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Ch', PdfChoiceFormField)
    }

    generateAppearance(options?: { makeReadOnly?: boolean }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const da = this.defaultAppearance
        if (!da) return false

        const value = this.value
        if (!value) return false

        const parsed = PdfDefaultAppearance.parse(da)
        if (!parsed) return false

        this._appearanceStream = new PdfChoiceAppearanceStream({
            rect: rect as [number, number, number, number],
            value,
            da: parsed,
            flags: this.flags,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
