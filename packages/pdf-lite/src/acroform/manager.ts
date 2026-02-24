import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfAcroForm } from './acroform.js'
import { PdfXfaForm } from './xfa/pdf-xfa-form.js'

/**
 * Manages AcroForm fields in PDF documents.
 * Provides methods to read and write form field values.
 */
export class PdfAcroFormManager {
    private document: PdfDocument
    private _acroform: PdfAcroForm | null = null

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Gets the XFA form wrapper, loading it lazily on first access.
     * @returns The PdfXfaForm or null if no XFA forms exist
     */
    getXfa(): PdfXfaForm | null {
        return this.read()?.getXfa() || null
    }

    /**
     * Checks if the document contains AcroForm fields.
     * @returns True if the document has AcroForm fields, false otherwise
     */
    exists(): boolean {
        try {
            const acroForm = this.read()
            return acroForm !== null
        } catch {
            return false
        }
    }

    /**
     * Gets the AcroForm object from the document catalog.
     * @returns The AcroForm object or null if not found
     */
    read(): PdfAcroForm | null {
        if (this._acroform) return this._acroform
        this._acroform = PdfAcroForm.fromDocument(this.document)
        return this._acroform
    }

    /**
     * Explicitly sets the XFA form instance, bypassing the lazy load on next write.
     */
    setXfa(xfa: PdfXfaForm): void {
        this.read()?.setXfa(xfa)
    }
}
