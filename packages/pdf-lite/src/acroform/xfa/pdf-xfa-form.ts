import { PdfDocument } from '../../pdf/pdf-document.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfXfaData } from '../objects/pdf-xfa-data.js'

/**
 * Typed wrapper around the XFA name/stream-ref array.
 * Holds eagerly-loaded references to component streams like datasets.
 */
export class PdfXfaForm {
    datasets: PdfXfaData | null = null

    static fromDocument(document: PdfDocument): PdfXfaForm | null {
        const catalog = document.root
        const acroFormRef = catalog.content.get('AcroForm')
        if (!acroFormRef) return null

        let acroFormDict: PdfDictionary

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = document.readObject(acroFormRef)
            if (!acroFormObject) return null
            acroFormDict = acroFormObject.content.as(PdfDictionary)
        } else if (acroFormRef instanceof PdfDictionary) {
            acroFormDict = acroFormRef
        } else {
            return null
        }

        const xfaArray = acroFormDict.get('XFA')
        if (!(xfaArray instanceof PdfArray)) return null

        const form = new PdfXfaForm()

        // Find the datasets reference in the name/ref pairs
        const items = xfaArray.items
        for (let i = 0; i < items.length - 1; i += 2) {
            const name = items[i]
            const ref = items[i + 1]

            if (
                name instanceof PdfString &&
                name.value === 'datasets' &&
                ref instanceof PdfObjectReference
            ) {
                const datasetObject = document
                    .readObject({
                        objectNumber: ref.objectNumber,
                        generationNumber: ref.generationNumber,
                        allowUnindexed: true,
                    })
                    ?.as(PdfIndirectObject<PdfStream>)

                if (datasetObject) {
                    form.datasets = datasetObject.becomes(PdfXfaData)
                }
                break
            }
        }

        return form
    }
}
