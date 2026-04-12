import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const pdfPath = './test/unit/fixtures/multi-child-field.pdf'

try {
    console.log('Loading PDF:', pdfPath)
    const buffer = await readFile(pdfPath)
    const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
    
    console.log('✓ PDF loaded successfully')
    console.log('Pages:', doc.pages.length)
    
    for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages.at(i)
        console.log(`\nPage ${i + 1}:`)
        console.log('  Content streams:', page.contentStreams.length)
        
        try {
            const blocks = page.extractTextBlocks()
            console.log('  ✓ Text blocks extracted:', blocks.length)
        } catch (error) {
            console.error('  ✗ Error extracting text blocks:', error.message)
        }
    }
} catch (error) {
    console.error('✗ Error loading PDF:', error.message)
    console.error(error.stack)
}
