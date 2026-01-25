import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'

/**
 * Calculates linearization parameters for a PDF document.
 */
export class LinearizationParams {
    private document: PdfDocument

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Gets the catalog object from the document.
     */
    private getCatalog(): PdfIndirectObject | undefined {
        const revision = this.document.latestRevision
        const catalogRef = revision.trailerDict.get('Root')
        if (catalogRef instanceof PdfObjectReference) {
            // Find the catalog object in the revision's objects
            return revision.objects.find(
                (obj) =>
                    obj instanceof PdfIndirectObject &&
                    obj.objectNumber === catalogRef.objectNumber,
            ) as PdfIndirectObject | undefined
        }
        return undefined
    }

    /**
     * Gets the first page object reference.
     */
    getFirstPageRef(): PdfObjectReference | undefined {
        const catalog = this.getCatalog()
        if (!catalog) return undefined

        const catalogDict = catalog.content as PdfDictionary
        const pagesRef = catalogDict.get('Pages')
        if (!(pagesRef instanceof PdfObjectReference)) return undefined

        const revision = this.document.latestRevision
        const pagesObj = revision.objects.find(
            (obj) =>
                obj instanceof PdfIndirectObject &&
                obj.objectNumber === pagesRef.objectNumber,
        ) as PdfIndirectObject | undefined
        if (!pagesObj) return undefined

        const pagesDict = pagesObj.content as PdfDictionary
        const kidsArray = pagesDict.get('Kids')
        if (!(kidsArray instanceof PdfArray)) return undefined

        const firstPageRef = kidsArray.items[0]
        if (!(firstPageRef instanceof PdfObjectReference)) return undefined

        return firstPageRef
    }

    /**
     * Gets the total number of pages in the document.
     */
    getPageCount(): number {
        const catalog = this.getCatalog()
        if (!catalog) return 0

        const catalogDict = catalog.content as PdfDictionary
        const pagesRef = catalogDict.get('Pages')
        if (!(pagesRef instanceof PdfObjectReference)) return 0

        const revision = this.document.latestRevision
        const pagesObj = revision.objects.find(
            (obj) =>
                obj instanceof PdfIndirectObject &&
                obj.objectNumber === pagesRef.objectNumber,
        ) as PdfIndirectObject | undefined
        if (!pagesObj) return 0

        const pagesDict = pagesObj.content as PdfDictionary
        const count = pagesDict.get('Count')
        if (count && 'value' in count) {
            return (count as any).value
        }

        return 0
    }

    /**
     * Gets all objects required for rendering the first page.
     * This includes the page object, resources, content streams, etc.
     */
    getFirstPageObjects(): Set<PdfIndirectObject> {
        const objects = new Set<PdfIndirectObject>()
        const revision = this.document.latestRevision

        const firstPageRef = this.getFirstPageRef()
        if (!firstPageRef) return objects

        // Add the first page object
        const firstPage = revision.objects.find(
            (obj) =>
                obj instanceof PdfIndirectObject &&
                obj.objectNumber === firstPageRef.objectNumber,
        ) as PdfIndirectObject | undefined
        if (!firstPage) return objects
        objects.add(firstPage)

        // Add referenced objects from the page dictionary
        this.addReferencedObjects(firstPage, objects, revision)

        return objects
    }

    /**
     * Recursively adds objects referenced by a given object.
     */
    private addReferencedObjects(
        obj: PdfIndirectObject,
        objects: Set<PdfIndirectObject>,
        revision: any,
    ): void {
        const content = obj.content
        if (content instanceof PdfDictionary) {
            // Iterate through dictionary values
            const dictValues = Object.values(content.values)
            for (const value of dictValues) {
                if (value instanceof PdfObjectReference) {
                    const referencedObj = revision.objects.find(
                        (o: any) =>
                            o instanceof PdfIndirectObject &&
                            o.objectNumber === value.objectNumber,
                    ) as PdfIndirectObject | undefined
                    if (referencedObj && !objects.has(referencedObj)) {
                        objects.add(referencedObj)
                        this.addReferencedObjects(
                            referencedObj,
                            objects,
                            revision,
                        )
                    }
                }
            }
        } else if (content instanceof PdfArray) {
            for (const item of content.items) {
                if (item instanceof PdfObjectReference) {
                    const referencedObj = revision.objects.find(
                        (o: any) =>
                            o instanceof PdfIndirectObject &&
                            o.objectNumber === item.objectNumber,
                    ) as PdfIndirectObject | undefined
                    if (referencedObj && !objects.has(referencedObj)) {
                        objects.add(referencedObj)
                        this.addReferencedObjects(
                            referencedObj,
                            objects,
                            revision,
                        )
                    }
                }
            }
        }
    }

    /**
     * Gets catalog and page tree objects.
     */
    getCatalogAndPageTreeObjects(): Set<PdfIndirectObject> {
        const objects = new Set<PdfIndirectObject>()
        const revision = this.document.latestRevision

        const catalog = this.getCatalog()
        if (!catalog) return objects
        objects.add(catalog)

        const catalogDict = catalog.content as PdfDictionary
        const pagesRef = catalogDict.get('Pages')
        if (pagesRef instanceof PdfObjectReference) {
            const pagesObj = revision.objects.find(
                (obj) =>
                    obj instanceof PdfIndirectObject &&
                    obj.objectNumber === pagesRef.objectNumber,
            ) as PdfIndirectObject | undefined
            if (pagesObj) {
                objects.add(pagesObj)
            }
        }

        return objects
    }
}
