import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const pdfPath = './test/unit/fixtures/multi-child-field.pdf'

try {
    console.log('Loading PDF:', pdfPath)
    const buffer = await readFile(pdfPath)
    const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
    
    console.log('✓ PDF loaded successfully')
    console.log('Pages count:', doc.pages.count)
    
    if (doc.pages.count > 0) {
        const pages = doc.pages.toArray()
        const page = pages[0]
        console.log(`\nPage 1:`)
        console.log('  Content streams:', page.contentStreams.length)
        
        for (let i = 0; i < page.contentStreams.length; i++) {
            const stream = page.contentStreams[i]
            console.log(`\n  Stream ${i}:`)
            
            const blocks = stream.textBlocks
            console.log('    Text blocks:', blocks.length)
            
            for (let j = 0; j < Math.min(blocks.length, 20); j++) {
                const block = blocks[j]
                console.log(`      Block ${j}: "${block.text}"`)
            }
        }
    }
} catch (error) {
    console.error('✗ Error loading PDF:', error.message)
    console.error(error.stack)
}
