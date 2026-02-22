// PDF creation from scratch example

import { writeFileSync } from 'fs'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

// Create the document
const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create a page using the new API
const page = document.pages.create({ width: 612, height: 792 })

// Add font to page resources
const fontDict = new PdfDictionary()
fontDict.set('F1', font.reference)
page.resources.set('Font', fontDict)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})
document.add(contentStream)

// Add content stream to page
page.addContentStream(contentStream.reference)

// Commit changes and write to file
await document.commit()

const file = `${import.meta.dirname}/tmp/created.pdf`
console.log(`Writing PDF to: ${file}`)
console.log('Pages in document:', document.pages.count())
console.log('Page dimensions:', page.getDimensions())

await writeFileSync(`${file}`, document.toBytes())
