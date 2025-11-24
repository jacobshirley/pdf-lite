// Incremental PDF update example

import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

// Helper functions for creating PDF objects
function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Step 1: Create an initial PDF document
console.log('Step 1: Creating initial PDF document...')
const document = new PdfDocument()

const font = createFont()
document.commit(font)

const resources = createResources(font.reference)
document.commit(resources)

const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Original Document - Revision 1) Tj ET',
    }),
})

const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.commit(page)

const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.commit(pages)

const catalog = createCatalog(pages.reference)
document.commit(catalog)

document.trailerDict.set('Root', catalog.reference)
document.commit(contentStream)

// Save the original PDF
const originalPdfPath = '/tmp/original.pdf'
await fs.writeFile(originalPdfPath, document.toBytes())
console.log(`Original PDF saved to: ${originalPdfPath}`)
console.log(`Original PDF has ${document.revisions.length} revision(s)`)

// Step 2: Load the PDF and perform an incremental update
console.log('\nStep 2: Loading PDF and performing incremental update...')

// Read the existing PDF
const existingPdfBytes = await fs.readFile(originalPdfPath)
const loadedDocument = await PdfDocument.fromBytes([existingPdfBytes])

// Lock existing revisions to enable incremental mode
// This ensures changes are added as new revisions instead of modifying existing ones
loadedDocument.setIncremental(true)

// Start a new revision for our changes
loadedDocument.startNewRevision()

// Create new content for the incremental update
// In a real scenario, this could be adding annotations, form fields, signatures, etc.
const newContentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 18 Tf 100 650 Td (This content was added in Revision 2) Tj ET',
    }),
})

// Add the new content to the document
await loadedDocument.commit(newContentStream)

// Save the incrementally updated PDF
const updatedPdfPath = '/tmp/incremental-update.pdf'
await fs.writeFile(updatedPdfPath, loadedDocument.toBytes())
console.log(`Incrementally updated PDF saved to: ${updatedPdfPath}`)
console.log(`Updated PDF has ${loadedDocument.revisions.length} revision(s)`)

// Step 3: Verify the incremental update preserved the original content
console.log('\nStep 3: Verifying incremental update...')

// Check file sizes to confirm incremental update (new file should be larger)
const originalStats = await fs.stat(originalPdfPath)
const updatedStats = await fs.stat(updatedPdfPath)

console.log(`Original PDF size: ${originalStats.size} bytes`)
console.log(`Updated PDF size: ${updatedStats.size} bytes`)
console.log(
    `Size difference: ${updatedStats.size - originalStats.size} bytes (new revision data)`,
)

// The updated PDF contains the original bytes plus the new revision
// This is the key feature of incremental updates - the original PDF is preserved
const updatedPdfBytes = await fs.readFile(updatedPdfPath)
const originalPdfBytesForComparison = await fs.readFile(originalPdfPath)

// Verify that the beginning of the updated PDF matches the original
const originalBytesMatch = updatedPdfBytes
    .slice(0, originalPdfBytesForComparison.length - 10) // Exclude the %%EOF marker area
    .toString()
    .includes(
        originalPdfBytesForComparison.slice(0, -10).toString().substring(0, 100),
    )

console.log(
    `Original content preserved: ${originalBytesMatch ? 'Yes' : 'No'}`,
)

// Step 4: Add another incremental revision
console.log('\nStep 4: Adding another incremental revision...')

const secondUpdate = await PdfDocument.fromBytes([updatedPdfBytes])
secondUpdate.setIncremental(true)
secondUpdate.startNewRevision()

const thirdRevisionContent = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original:
            'BT /F1 14 Tf 100 600 Td (Third revision - demonstrates multiple incremental updates) Tj ET',
    }),
})

await secondUpdate.commit(thirdRevisionContent)

const multiRevisionPdfPath = '/tmp/multi-revision.pdf'
await fs.writeFile(multiRevisionPdfPath, secondUpdate.toBytes())
console.log(`Multi-revision PDF saved to: ${multiRevisionPdfPath}`)
console.log(`Multi-revision PDF has ${secondUpdate.revisions.length} revision(s)`)

const multiRevisionStats = await fs.stat(multiRevisionPdfPath)
console.log(`Multi-revision PDF size: ${multiRevisionStats.size} bytes`)

console.log('\n=== Summary ===')
console.log('Incremental updates allow you to:')
console.log('1. Preserve the original PDF content (important for signatures)')
console.log('2. Add new content without modifying existing revisions')
console.log('3. Maintain a complete history of document changes')
console.log('4. Stack multiple revisions on top of each other')
