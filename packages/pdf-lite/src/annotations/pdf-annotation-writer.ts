import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfPage } from '../pdf/pdf-page.js'

/**
 * Manages page Annots arrays during AcroForm write operations.
 */
export class PdfAnnotationWriter {
    static getPageAnnotsArray(
        document: PdfDocument,
        page: PdfPage,
    ): {
        annotsArray: PdfArray<PdfObjectReference>
        isIndirect: boolean
        objectNumber?: number
        generationNumber?: number
    } {
        const annotsRef = page.content.get('Annots')

        if (annotsRef instanceof PdfObjectReference) {
            const annotsObj = document.readObject({
                objectNumber: annotsRef.objectNumber,
                generationNumber: annotsRef.generationNumber,
            })
            return {
                annotsArray: annotsObj!.content
                    .as(PdfArray<PdfObjectReference>)
                    .clone(),
                isIndirect: true,
                objectNumber: annotsRef.objectNumber,
                generationNumber: annotsRef.generationNumber,
            }
        } else if (annotsRef instanceof PdfArray) {
            return {
                annotsArray: annotsRef.as(PdfArray<PdfObjectReference>).clone(),
                isIndirect: false,
            }
        } else {
            const newArray = new PdfArray<PdfObjectReference>()
            page.content.set('Annots', newArray)
            return {
                annotsArray: newArray,
                isIndirect: false,
            }
        }
    }

    static addFieldsToAnnots(
        annotsArray: PdfArray<PdfObjectReference>,
        fieldRefs: PdfObjectReference[],
    ): void {
        for (const fieldRef of fieldRefs) {
            const exists = annotsArray.items.some((ref) => ref.equals(fieldRef))
            if (!exists) {
                annotsArray.push(fieldRef)
            }
        }
    }

    static updatePageAnnotations(
        document: PdfDocument,
        fieldsByPage: Map<
            string,
            {
                pageRef: PdfObjectReference
                fieldRefs: PdfObjectReference[]
            }
        >,
    ): void {
        for (const { pageRef, fieldRefs } of fieldsByPage.values()) {
            const pageObj = document.readObject({
                objectNumber: pageRef.objectNumber,
                generationNumber: pageRef.generationNumber,
            })

            if (!pageObj) continue

            const page = pageObj.becomes(PdfPage)
            const annotsInfo = PdfAnnotationWriter.getPageAnnotsArray(
                document,
                page,
            )

            PdfAnnotationWriter.addFieldsToAnnots(
                annotsInfo.annotsArray,
                fieldRefs,
            )

            if (
                annotsInfo.isIndirect &&
                annotsInfo.objectNumber !== undefined
            ) {
                const annotsIndirect = new PdfIndirectObject({
                    objectNumber: annotsInfo.objectNumber,
                    generationNumber: annotsInfo.generationNumber!,
                    content: annotsInfo.annotsArray,
                })
                document.add(annotsIndirect)
            }

            document.add(page)
        }
    }
}
