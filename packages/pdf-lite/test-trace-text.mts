import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const pdfPath = './test/unit/fixtures/multi-child-field.pdf'
const buffer = await readFile(pdfPath)
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])

const pages = doc.pages.toArray()
const page = pages[0]

for (const stream of page.contentStreams) {
    // Get the raw decompressed content
    const raw = stream.dataAsString
    
    // Find the first BT...ET block
    const btIndex = raw.indexOf('BT')
    const etIndex = raw.indexOf('ET', btIndex)
    if (btIndex !== -1 && etIndex !== -1) {
        const firstBlock = raw.slice(btIndex, etIndex + 2)
        console.log('=== First BT...ET block (raw) ===')
        console.log(firstBlock)
        console.log()
    }
    
    // Now check what text extraction gives us
    const blocks = stream.textBlocks
    if (blocks.length > 0) {
        const block = blocks[0]
        console.log('=== Block 0 ===')
        console.log('text:', JSON.stringify(block.text))
        console.log('segments:', block.getSegments().length)
        for (let i = 0; i < Math.min(block.getSegments().length, 5); i++) {
            const seg = block.getSegments()[i]
            console.log(`  seg ${i} text:`, JSON.stringify(seg.text))
            console.log(`  seg ${i} ops:`)
            for (const op of seg.ops) {
                console.log(`    ${op.constructor.name}: ${JSON.stringify(op.raw)}`)
            }
        }
    }
}
