import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfAcroForm } from './pdf-acro-form.js'
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
    async getXfa(): Promise<PdfXfaForm | null> {
        return (await (await this.read())?.getXfa()) || null
    }

    /**
     * Checks if the document contains AcroForm fields.
     * @returns True if the document has AcroForm fields, false otherwise
     */
    async exists(): Promise<boolean> {
        try {
            const acroForm = await this.read()
            return acroForm !== null
        } catch {
            return false
        }
    }

    /**
     * Gets the AcroForm object from the document catalog.
     * @returns The AcroForm object or null if not found
     */
    async read(): Promise<PdfAcroForm | null> {
        if (this._acroform) return this._acroform
        this._acroform = await PdfAcroForm.fromDocument(this.document)
        return this._acroform
    }

    /**
     * Explicitly sets the XFA form instance, bypassing the lazy load on next write.
     */
    async setXfa(xfa: PdfXfaForm): Promise<void> {
        ;(await this.read())?.setXfa(xfa)
    }

    /**
     * Writes the provided AcroForm to the associated PDF document.
     * @param acroForm The AcroForm instance to serialize into the document.
     * @throws Error If writing the AcroForm to the document fails.
     */
    async write(acroForm?: PdfAcroForm): Promise<void> {
        await (acroForm ?? (await this.read()))?.write(this.document)
    }
}
