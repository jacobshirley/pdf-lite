import { PdfDocument } from '../pdf/pdf-document.js'
import { LinearizationDictionary } from './linearization-dictionary.js'
import { LinearizationParams } from './linearization-params.js'
import { HintTableGenerator } from './hint-table.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfRevision } from '../pdf/pdf-revision.js'
import { PdfTokenSerializer } from '../core/serializer.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfNumber } from '../core/objects/pdf-number.js'

/**
 * Linearizes a PDF document for fast web viewing.
 * Linearization reorganizes the PDF structure to enable progressive page rendering.
 *
 * @example
 * ```typescript
 * const document = new PdfDocument()
 * // ... build your PDF ...
 *
 * const linearizer = new PdfLinearizer(document)
 * const linearizedDoc = linearizer.linearize()
 * console.log(linearizedDoc.toString())
 * ```
 */
export class PdfLinearizer {
    private document: PdfDocument
    private params: LinearizationParams
    private hintGenerator: HintTableGenerator

    constructor(document: PdfDocument) {
        this.document = document
        this.params = new LinearizationParams(document)
        this.hintGenerator = new HintTableGenerator()
    }

    /**
     * Linearizes the document.
     * Returns a new document with linearized structure.
     */
    linearize(): PdfDocument {
        // Get page count and first page info
        const pageCount = this.params.getPageCount()
        const firstPageRef = this.params.getFirstPageRef()

        if (!firstPageRef || pageCount === 0) {
            throw new Error('Cannot linearize document: invalid page structure')
        }

        // Create a copy of the document for linearization
        const linearizedDoc = this.createLinearizedCopy()

        // Get objects in the correct order for linearization
        const orderedObjects = this.orderObjectsForLinearization()

        // Calculate byte offsets (placeholder values for now)
        const fileLength = this.calculateFileLength(orderedObjects)
        const hintStreamOffset = 548 // Placeholder
        const hintStreamLength = 187 // Placeholder
        const firstPageObjectNumber = firstPageRef.objectNumber
        const endOfFirstPage = 2636 // Placeholder
        const xrefStreamOffset = fileLength - 200 // Placeholder

        // Create linearization dictionary
        const linDict = new LinearizationDictionary({
            fileLength,
            hintStreamOffset,
            hintStreamLength,
            firstPageObjectNumber,
            endOfFirstPage,
            pageCount,
            xrefStreamOffset,
        })

        // Create linearization dictionary object as first object
        const linDictObj = new PdfIndirectObject({
            content: linDict,
            objectNumber: 1,
            generationNumber: 0,
        })

        // Create new revision with linearized structure
        const linearizedRevision = new PdfRevision()
        linearizedRevision.addObject(linDictObj)

        // Add ordered objects to revision
        for (const obj of orderedObjects) {
            linearizedRevision.addObject(obj)
        }

        // Set the linearized revision as the only revision
        linearizedDoc.revisions = [linearizedRevision]

        return linearizedDoc
    }

    /**
     * Orders objects for linearization.
     * The order should be:
     * 1. Linearization dictionary
     * 2. First page objects
     * 3. Catalog and page tree
     * 4. Remaining objects
     */
    private orderObjectsForLinearization(): PdfIndirectObject[] {
        const ordered: PdfIndirectObject[] = []
        const revision = this.document.latestRevision
        // Filter only indirect objects from the revision
        const allIndirectObjects = revision.objects.filter(
            (obj) => obj instanceof PdfIndirectObject,
        ) as PdfIndirectObject[]
        const allObjects = new Set(allIndirectObjects)

        // Get first page objects
        const firstPageObjects = this.params.getFirstPageObjects()

        // Get catalog and page tree objects
        const catalogObjects = this.params.getCatalogAndPageTreeObjects()

        // Add first page objects
        for (const obj of firstPageObjects) {
            ordered.push(obj)
            allObjects.delete(obj)
        }

        // Add catalog and page tree objects
        for (const obj of catalogObjects) {
            if (!firstPageObjects.has(obj)) {
                ordered.push(obj)
                allObjects.delete(obj)
            }
        }

        // Add remaining objects
        for (const obj of allObjects) {
            ordered.push(obj)
        }

        return ordered
    }

    /**
     * Calculates the total file length.
     * This is a simplified calculation.
     */
    private calculateFileLength(objects: PdfIndirectObject[]): number {
        // Estimate based on number of objects
        // In a real implementation, we would serialize and measure
        let length = 1024 // Header and overhead

        for (const obj of objects) {
            // Rough estimate: 500 bytes per object
            length += 500
        }

        return length
    }

    /**
     * Creates a copy of the document for linearization.
     */
    private createLinearizedCopy(): PdfDocument {
        // Create a document with at least one empty revision
        return new PdfDocument({
            revisions: [new PdfRevision()],
            version: this.document.header,
        })
    }

    /**
     * Checks if a document is linearized.
     */
    static isLinearized(document: PdfDocument): boolean {
        // Check if document has revisions
        if (!document.revisions || document.revisions.length === 0) {
            return false
        }

        const revision = document.revisions[0]
        const firstObject = revision.objects[0]

        if (!firstObject || !(firstObject instanceof PdfIndirectObject)) {
            return false
        }

        const content = firstObject.content
        if (!(content instanceof PdfDictionary)) return false

        // Check for Linearized key
        const linearized = content.get('Linearized')
        if (!(linearized instanceof PdfNumber)) return false

        return linearized.value === 1
    }
}
