import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/index.js'

/**
 * Manages XFA (XML Forms Architecture) forms in PDF documents.
 * Provides methods to read and write XFA form data as XML.
 */
export class PdfXfaManager {
    private document: PdfDocument
    private _datasetsStream?: PdfIndirectObject<PdfStream>

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Checks if the document contains XFA forms.
     * @returns True if the document has XFA forms, false otherwise
     */
    async hasXfaForms(): Promise<boolean> {
        try {
            const stream = await this.getDatasetsStream()
            return stream !== null
        } catch {
            return false
        }
    }

    /**
     * Reads the XFA form data as XML string.
     * @returns The XFA datasets XML content, or null if no XFA form exists
     */
    async readXml(): Promise<string | null> {
        const stream = await this.getDatasetsStream()
        if (!stream) return null

        // Get decompressed data without modifying the original stream
        const decompressed = stream.content.decode()

        // Return the raw XML content as string
        const decoder = new TextDecoder()
        return decoder.decode(decompressed)
    }

    /**
     * Writes XML content to the XFA datasets stream.
     * @param xml The XML content to write
     * @throws Error if the document doesn't have XFA forms
     */
    async writeXml(xml: string): Promise<void> {
        const stream = await this.getDatasetsStream()
        if (!stream) {
            throw new Error('Document does not contain XFA forms')
        }

        // Update the cached stream directly with the new XML content
        const datasetsIndirect = new PdfIndirectObject({
            ...stream,
            content: PdfStream.fromString(xml),
        })

        const isIncremental = this.document.isIncremental()
        this.document.setIncremental(true)
        await this.document.commit(datasetsIndirect)
        this.document.setIncremental(isIncremental)

        // Reset cached stream to force re-fetch if needed
        this._datasetsStream = undefined
    }

    /**
     * Gets the AcroForm dictionary from the document catalog.
     * @returns The AcroForm dictionary or null if not found
     */
    private async getAcroForm(): Promise<PdfDictionary | null> {
        const catalog = this.document.rootDictionary
        if (!catalog) return null

        const acroFormRef = catalog.get('AcroForm')

        if (!acroFormRef) return null

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = await this.document.readObject({
                objectNumber: acroFormRef.objectNumber,
                generationNumber: acroFormRef.generationNumber,
            })

            if (!acroFormObject) return null

            return acroFormObject.content.as(PdfDictionary)
        } else if (acroFormRef instanceof PdfDictionary) {
            return acroFormRef
        }

        return null
    }

    /**
     * Gets the XFA datasets stream.
     * Caches the stream for subsequent calls to preserve modifications.
     * @returns The datasets stream or null if not found
     */
    private async getDatasetsStream(): Promise<PdfIndirectObject<PdfStream> | null> {
        if (this._datasetsStream) {
            return this._datasetsStream
        }

        const acroForm = await this.getAcroForm()
        if (!acroForm) return null

        const xfaArray = acroForm.get('XFA')
        if (!(xfaArray instanceof PdfArray)) return null

        const datasetsRef = this.findXfaDatasetReference(xfaArray)
        if (!datasetsRef) return null

        const datasetObject = await this.document.readObject({
            objectNumber: datasetsRef.objectNumber,
            generationNumber: datasetsRef.generationNumber,
            allowUnindexed: true,
        })

        if (!datasetObject) return null

        return datasetObject as PdfIndirectObject<PdfStream>
    }

    /**
     * Finds the XFA dataset object reference from the XFA array.
     * XFA array structure: [(name1) ref1 (name2) ref2 ...]
     * @param xfaArray The XFA array from the AcroForm
     * @returns The object reference to the datasets stream, or null if not found
     */
    private findXfaDatasetReference(
        xfaArray: PdfArray,
    ): PdfObjectReference | null {
        const items = xfaArray.items

        // XFA array alternates between name strings and object references
        for (let i = 0; i < items.length - 1; i += 2) {
            const name = items[i]
            const ref = items[i + 1]

            if (name instanceof PdfString && name.value === 'datasets') {
                if (ref instanceof PdfObjectReference) {
                    return ref
                }
            }
        }

        return null
    }
}
