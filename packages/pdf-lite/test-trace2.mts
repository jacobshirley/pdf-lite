import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const buffer = await readFile('./test/unit/fixtures/multi-child-field.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])

const page = doc.pages.toArray()[0]
const stream = page.contentStreams[0]
const raw = stream.dataAsString

// Find "BLOCK" or closing parenthesis patterns
const lines = raw.split('\n')
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('BLOCK') || lines[i].includes('CAPITAL')) {
        console.log(`Line ${i}: ${lines[i]}`)
    }
}

// Also look for escaped parens
console.log('\n=== Lines with \\) ===')
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('\\)')) {
        console.log(`Line ${i}: ${lines[i].substring(0, 150)}`)
    }
}

// Look at the text blocks — show raw ops
console.log('\n=== Text Blocks with raw ops ===')
const blocks = stream.textBlocks
for (let b = 0; b < Math.min(blocks.length, 3); b++) {
    const block = blocks[b]
    console.log(`\nBlock ${b}: text = ${JSON.stringify(block.text)}`)
    const segs = block.getSegments()
    console.log(`  segments: ${segs.length}`)
    for (let s = 0; s < segs.length; s++) {
        const seg = segs[s]
        console.log(`  seg ${s}: text=${JSON.stringify(seg.text)}`)
        for (const op of seg.ops) {
            const name = op.constructor.name
            const rawStr = op.raw
            if (name.includes('Show') || name.includes('Text')) {
                console.log(`    ${name}: raw=${JSON.stringify(rawStr.substring(0, 120))}`)
            }
        }
    }
}
