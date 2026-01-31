import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfAcroForm } from './acroform.js'

/**
 * Manages AcroForm fields in PDF documents.
 * Provides methods to read and write form field values.
 */
export class PdfAcroFormManager {
    private document: PdfDocument

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Checks if the document contains AcroForm fields.
     * @returns True if the document has AcroForm fields, false otherwise
     */
    async hasAcroForm(): Promise<boolean> {
        try {
            const acroForm = await this.getAcroForm()
            return acroForm !== null
        } catch {
            return false
        }
    }

    /**
     * Gets the AcroForm dictionary from the document catalog.
     * @returns The AcroForm dictionary or null if not found
     */
    async getAcroForm(): Promise<PdfAcroForm | null> {
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
