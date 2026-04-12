import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])

const page = doc.pages.toArray()[0]

for (const stream of page.contentStreams) {
    const raw = stream.dataAsString

    // Find BLOCK CAPITALS in raw content
    const lines = raw.split('\n')
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toUpperCase().includes('BLOCK') || lines[i].toUpperCase().includes('CAPITAL')) {
            console.log(`Line ${i}: ${lines[i].substring(0, 200)}`)
        }
    }

    console.log('\n=== Text Blocks containing BLOCK or CAPITAL ===')
    const blocks = stream.textBlocks
    for (let b = 0; b < blocks.length; b++) {
        const block = blocks[b]
        const text = block.text
        if (text.toUpperCase().includes('BLOCK') || text.toUpperCase().includes('CAPITAL')) {
            console.log(`Block ${b}: text = ${JSON.stringify(text)}`)
            const segs = block.getSegments()
            for (let s = 0; s < segs.length; s++) {
                const seg = segs[s]
                console.log(`  seg ${s}: text=${JSON.stringify(seg.text)}`)
                for (const op of seg.ops) {
                    const name = op.constructor.name
                    console.log(`    ${name}: raw=${JSON.stringify(op.raw.substring(0, 150))}`)
                }
            }
        }
    }
}
