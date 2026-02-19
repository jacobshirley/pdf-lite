import { PdfFormField } from './PdfFormField.js'
import { PdfButtonAppearanceStream } from '../appearance/PdfButtonAppearanceStream.js'

/**
 * Button form field subtype (checkboxes, radio buttons, push buttons).
 */
export class PdfButtonFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Btn', PdfButtonFormField)
    }

    generateAppearance(options?: { makeReadOnly?: boolean }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const [x1, y1, x2, y2] = rect
        const width = x2 - x1
        const height = y2 - y1

        this._appearanceStream = new PdfButtonAppearanceStream({
            width,
            height,
            contentStream: '',
        })

        const yesContent = PdfButtonAppearanceStream.buildYesContent(
            width,
            height,
            this.flags,
        )
        this._appearanceStreamYes = new PdfButtonAppearanceStream({
            width,
            height,
            contentStream: yesContent,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
