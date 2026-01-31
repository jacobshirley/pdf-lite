// PDF linearization example
// Demonstrates creating a linearized PDF for fast web viewing

import { writeFileSync } from 'fs'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfLinearizer } from 'pdf-lite/linearization/pdf-linearizer'
import fs from 'fs/promises'

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })

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

// Step 1: Create a regular PDF document
console.log('Step 1: Creating a regular PDF document...')
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources
const resources = createResources(font.reference)
document.add(resources)

// Create content stream for the first page
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (First Page - Linearized PDF) Tj ET',
    }),
})

// Create the first page
const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.add(page)

// Create pages collection
const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)
document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)
document.add(contentStream)

await document.commit()

// Save the regular (non-linearized) PDF
const regularPdfPath = `${tmpFolder}/regular.pdf`
writeFileSync(regularPdfPath, document.toBytes())
console.log(`Regular PDF saved to: ${regularPdfPath}`)

// Step 2: Linearize the PDF document
console.log('\nStep 2: Linearizing the PDF document...')
console.log('What is linearization?')
console.log('- Linearization reorganizes PDF objects for fast web viewing')
console.log(
    '- The first page can be displayed while the rest is still downloading',
)
console.log('- Enables progressive rendering for better user experience\n')

// Create a linearizer
const linearizer = new PdfLinearizer(document)

// Linearize the document
const linearizedDoc = linearizer.linearize()

// Save the linearized PDF
const linearizedPdfPath = `${tmpFolder}/linearized.pdf`
writeFileSync(linearizedPdfPath, linearizedDoc.toBytes())
console.log(`Linearized PDF saved to: ${linearizedPdfPath}`)

// Step 3: Verify the linearization
console.log('\nStep 3: Verifying linearization...')

// Check if the document is linearized
const isLinearized = PdfLinearizer.isLinearized(linearizedDoc)
console.log(`Is linearized: ${isLinearized ? 'Yes' : 'No'}`)

// Check if the original document is linearized
const isOriginalLinearized = PdfLinearizer.isLinearized(document)
console.log(
    `Original document linearized: ${isOriginalLinearized ? 'Yes' : 'No'}`,
)

// Get linearization parameters
if (isLinearized && linearizedDoc.revisions.length > 0) {
    const firstObject = linearizedDoc.revisions[0].objects[0]
    if (firstObject instanceof PdfIndirectObject) {
        const linDict = firstObject.content as PdfDictionary
        console.log('\nLinearization dictionary parameters:')
        console.log(`- File length: ${linDict.get('L')}`)
        console.log(`- Page count: ${linDict.get('N')}`)
        console.log(`- First page object: ${linDict.get('O')}`)
        console.log(`- Linearized flag: ${linDict.get('Linearized')}`)
    }
}

// Step 4: Compare file sizes
console.log('\nStep 4: Comparing file sizes...')
const regularStats = await fs.stat(regularPdfPath)
const linearizedStats = await fs.stat(linearizedPdfPath)

console.log(`Regular PDF size: ${regularStats.size} bytes`)
console.log(`Linearized PDF size: ${linearizedStats.size} bytes`)
console.log(
    `Size difference: ${Math.abs(linearizedStats.size - regularStats.size)} bytes`,
)

console.log('\n=== Summary ===')
console.log('PDF Linearization benefits:')
console.log('1. Faster initial page display for web viewing')
console.log('2. Progressive rendering (first page while downloading)')
console.log('3. Improved user experience for large documents')
console.log('4. Optimized object ordering for efficient access')
console.log('\nLinearization structure:')
console.log('- Linearization dictionary (first object)')
console.log('- First page objects (for quick rendering)')
console.log('- Catalog and page tree')
console.log('- Remaining objects')
