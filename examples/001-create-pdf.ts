// PDF creation from scratch example

import { writeFileSync } from 'fs'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfPage } from 'pdf-lite/pdf/pdf-page'
import { PdfPages } from 'pdf-lite/pdf/pdf-pages'

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

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create a page using PdfPage
const page = new PdfPage()
page.mediaBox = [0, 0, 612, 792]
page.contents = contentStream.reference
page.resources = resources.reference
document.add(page)

// Create pages collection using PdfPages
const pages = new PdfPages()
pages.kids = new PdfArray([page.reference])
pages.count = 1
page.parent = pages.reference
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)
document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

document.add(contentStream)
await document.finalize()

const file = `${import.meta.dirname}/tmp/created.pdf`
console.log(`Writing PDF to: ${file}`)

await writeFileSync(`${file}`, document.toBytes())
