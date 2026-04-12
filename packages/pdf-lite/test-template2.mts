import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])

console.log('Pages:', doc.pages.count)

for (let p = 0; p < doc.pages.count; p++) {
    const page = doc.pages.toArray()[p]
    console.log(`\nPage ${p}: ${page.contentStreams.length} streams`)
    
    for (let si = 0; si < page.contentStreams.length; si++) {
        const stream = page.contentStreams[si]
        const raw = stream.dataAsString
        
        // Search all raw content for BLOCK
        if (raw.toUpperCase().includes('BLOCK') || raw.toUpperCase().includes('CAPITAL')) {
            console.log(`  Stream ${si}: Found BLOCK/CAPITAL in raw content`)
            const idx = raw.toUpperCase().indexOf('BLOCK')
            if (idx >= 0) {
                console.log(`    Context: ...${raw.substring(Math.max(0, idx - 50), idx + 80)}...`)
            }
            const idx2 = raw.toUpperCase().indexOf('CAPITAL')
            if (idx2 >= 0) {
                console.log(`    Context: ...${raw.substring(Math.max(0, idx2 - 50), idx2 + 80)}...`)
            }
        }
        
        // Show first few text blocks from each stream
        const blocks = stream.textBlocks
        if (blocks.length > 0) {
            console.log(`  Stream ${si}: ${blocks.length} text blocks`)
            for (let b = 0; b < Math.min(blocks.length, 3); b++) {
                console.log(`    Block ${b}: ${JSON.stringify(blocks[b].text?.substring(0, 100))}`)
            }
        }
    }
}
