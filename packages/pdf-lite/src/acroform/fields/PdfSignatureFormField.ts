import { PdfFormField } from './PdfFormField.js'

/**
 * Signature form field subtype.
 */
export class PdfSignatureFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Sig', PdfSignatureFormField)
    }

    generateAppearance(): boolean {
        return false
    }
}
