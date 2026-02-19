import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfAcroForm } from './acroform.js'
import { PdfXfaForm } from './xfa/PdfXfaForm.js'

/**
 * Manages AcroForm fields in PDF documents.
 * Provides methods to read and write form field values.
 */
export class PdfAcroFormManager {
    private document: PdfDocument
    private _xfa: PdfXfaForm | null | undefined = undefined

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Gets the XFA form wrapper, loading it lazily on first access.
     * @returns The PdfXfaForm or null if no XFA forms exist
     */
    async getXfa(): Promise<PdfXfaForm | null> {
        if (this._xfa === undefined) {
            this._xfa = await PdfXfaForm.fromDocument(this.document)
        }
        return this._xfa
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
        return await PdfAcroForm.fromDocument(this.document)
    }

    /**
     * Writes the provided AcroForm to the associated PDF document.
     * @param acroForm The AcroForm instance to serialize into the document.
     * @throws Error If writing the AcroForm to the document fails.
     */
    async write(acroForm: PdfAcroForm): Promise<void> {
        await acroForm.write(this.document)
    }
}
