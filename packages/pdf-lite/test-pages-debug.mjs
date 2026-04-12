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
            console.log('    Stream type:', stream.constructor.name)
            console.log('    Has data:', !!stream.data)
            console.log('    Data length:', stream.data?.length || 'N/A')
            
            try {
                const dataStr = stream.dataAsString
                console.log('    dataAsString length:', dataStr?.length || 'N/A')
                if (dataStr) {
                    console.log('    First 200 chars:', dataStr.substring(0, 200))
                }
            } catch (error) {
                console.error('    ✗ Error getting dataAsString:', error.message)
            }
            
            try {
                const blocks = stream.textBlocks
                console.log('    Text blocks:', blocks.length)
                if (blocks.length > 0) {
                    console.log('    First block text:', blocks[0].text)
                }
            } catch (error) {
                console.error('    ✗ Error getting text blocks:', error.message)
            }
        }
    }
} catch (error) {
    console.error('✗ Error loading PDF:', error.message)
    console.error(error.stack)
}
