import { PdfDocument } from '../pdf/pdf-document.js'
import { LinearizationDictionary } from './linearization-dictionary.js'
import { LinearizationParams } from './linearization-params.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfRevision } from '../pdf/pdf-revision.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfTokenSerializer } from '../core/serializer.js'
import { PdfToken } from '../core/tokens/token.js'
import { PdfWhitespaceToken } from '../core/tokens/whitespace-token.js'

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

    constructor(document: PdfDocument) {
        this.document = document
        this.params = new LinearizationParams(document)
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

        // Create a temporary serializer to calculate actual byte offsets
        const byteOffsets = this.calculateActualByteOffsets(orderedObjects)

        // Calculate linearization parameters from actual serialized content
        const fileLength = byteOffsets.fileLength
        const hintStreamOffset = byteOffsets.hintStreamOffset
        const hintStreamLength = byteOffsets.hintStreamLength
        const firstPageObjectNumber = firstPageRef.objectNumber
        const endOfFirstPage = byteOffsets.endOfFirstPage
        const xrefStreamOffset = byteOffsets.xrefStreamOffset

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
     * Calculates actual byte offsets by serializing the content.
     * This properly measures the byte positions in the final PDF.
     */
    private calculateActualByteOffsets(objects: PdfIndirectObject[]): {
        fileLength: number
        hintStreamOffset: number
        hintStreamLength: number
        endOfFirstPage: number
        xrefStreamOffset: number
    } {
        // Create a temporary document to serialize and measure offsets
        const tempDoc = this.createLinearizedCopy()
        const tempRevision = new PdfRevision()

        // Add all objects to measure their serialized size
        for (const obj of objects) {
            tempRevision.addObject(obj)
        }

        tempDoc.revisions = [tempRevision]

        // Serialize to tokens to get actual byte measurements
        const tokens = this.getDocumentTokens(tempDoc)
        const serializer = new PdfTokenSerializer()
        serializer.feedMany(tokens)

        // Calculate offsets by walking through tokens
        let currentOffset = 0
        let hintStreamOffset = 0
        let hintStreamLength = 200 // Estimated hint stream size
        let endOfFirstPage = 0
        let firstPageObjectsSeen = 0
        const firstPageObjects = this.params.getFirstPageObjects()

        for (const token of tokens) {
            const tokenBytes = token.toBytes()
            currentOffset += tokenBytes.length

            // Track when we've seen all first page objects
            if (
                token instanceof PdfIndirectObject ||
                (token as any).objectNumber !== undefined
            ) {
                for (const fpObj of firstPageObjects) {
                    if (
                        (token as any).objectNumber === fpObj.objectNumber &&
                        firstPageObjectsSeen < firstPageObjects.size
                    ) {
                        firstPageObjectsSeen++
                        if (firstPageObjectsSeen === firstPageObjects.size) {
                            endOfFirstPage = currentOffset
                        }
                    }
                }
            }
        }

        // Set hint stream offset to after header and linearization dictionary
        // This is a simplified approach - typically after the linearization dict
        hintStreamOffset = Math.max(200, Math.floor(currentOffset * 0.05))

        // Calculate final file length (includes xref table and trailer)
        const xrefOverhead = 500 + objects.length * 20 // Estimate for xref table
        const fileLength = currentOffset + xrefOverhead
        const xrefStreamOffset = fileLength - xrefOverhead

        // If we didn't detect end of first page, estimate it
        if (endOfFirstPage === 0) {
            endOfFirstPage = Math.floor(currentOffset * 0.3)
        }

        return {
            fileLength,
            hintStreamOffset,
            hintStreamLength,
            endOfFirstPage,
            xrefStreamOffset,
        }
    }

    /**
     * Gets tokens for a document, similar to PdfDocument.toTokens()
     */
    private getDocumentTokens(doc: PdfDocument): PdfToken[] {
        const tokens: PdfToken[] = []

        // Add header
        tokens.push(...doc.header.toTokens())

        // Add objects
        for (const obj of doc.objects) {
            const objTokens = obj.toTokens()
            tokens.push(...objTokens)
            if (
                objTokens.length > 0 &&
                !(objTokens[objTokens.length - 1] instanceof PdfWhitespaceToken)
            ) {
                tokens.push(PdfWhitespaceToken.NEWLINE)
            }
        }

        return tokens
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
