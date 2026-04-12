import { readFile } from 'fs/promises'
import { pdfReader } from './dist/index.js'

const pdfPath = process.argv[2] || './test/fixtures/multi-child-field.pdf'

try {
    const buffer = await readFile(pdfPath)
    const doc = await pdfReader(buffer)
    
    console.log(`\nPDF: ${pdfPath}`)
    console.log(`Pages: ${doc.pages.length}\n`)
    
    for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages.at(i)
        const blocks = page.extractTextBlocks()
        
        console.log(`Page ${i + 1}: ${blocks.length} text blocks`)
        
        for (const block of blocks) {
            const text = block.text.trim()
            if (text) {
                console.log(`  - "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`)
            }
        }
        console.log()
    }
} catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
}
