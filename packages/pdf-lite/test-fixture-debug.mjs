import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const pdfPath = './test/unit/fixtures/multi-child-field.pdf'

try {
    console.log('Loading PDF:', pdfPath)
    const buffer = await readFile(pdfPath)
    const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
    
    console.log('✓ PDF loaded successfully')
    console.log('Pages:', doc.pages?.length)
    
    if (doc.pages && doc.pages.length > 0) {
        const page = doc.pages.at(0)
        console.log(`\nPage 1:`)
        console.log('  Content streams:', page.contentStreams.length)
        
        for (let i = 0; i < page.contentStreams.length; i++) {
            const stream = page.contentStreams[i]
            console.log(`\n  Stream ${i}:`)
            console.log('    Data length:', stream.data.length)
            console.log('    First 200 chars:', stream.dataAsString.substring(0, 200))
            console.log('    Text blocks:', stream.textBlocks.length)
            console.log('    Nodes:', stream.nodes.length)
            console.log('    Node types:', stream.nodes.map(n => n.constructor.name))
        }
    }
} catch (error) {
    console.error('✗ Error loading PDF:', error.message)
    console.error(error.stack)
}
