import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const pdfPath = './test/unit/fixtures/multi-child-field.pdf'

try {
    console.log('Loading PDF:', pdfPath)
    const buffer = await readFile(pdfPath)
    const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
    
    console.log('✓ PDF loaded successfully')
    console.log('doc:', !!doc)
    console.log('doc.root:', !!doc.root)
    if (doc.root) {
        console.log('doc.root.content:', doc.root.content)
        console.log('doc.root.content keys:', Array.from(doc.root.content.keys()))
        const pagesEntry = doc.root.content.get('Pages')
        console.log('Pages entry:', pagesEntry)
        console.log('Pages entry type:', pagesEntry?.constructor.name)
    }
    console.log('doc.pages getter:', doc.pages)
} catch (error) {
    console.error('✗ Error loading PDF:', error.message)
    console.error(error.stack)
}
