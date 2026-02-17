import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfAcroForm } from './acroform.js'
import { PdfXfaManager } from './xfa/PdfXfaManager.js'

/**
 * Manages AcroForm fields in PDF documents.
 * Provides methods to read and write form field values.
 */
export class PdfAcroFormManager {
    private document: PdfDocument
    readonly xfa: PdfXfaManager

    constructor(document: PdfDocument) {
        this.document = document
        this.xfa = new PdfXfaManager(document)
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
