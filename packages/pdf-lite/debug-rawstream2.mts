import { PdfDocument } from './src/pdf/pdf-document.js'
import { readFile } from 'fs/promises'
import { PdfContentStreamTokeniser } from './src/graphics/tokeniser.js'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
const page = doc.pages.get(0)

// Get raw content stream bytes
const cs = page.contentStreams[0]
const raw = cs.dataAsString!

// Find BT/ET blocks in raw stream
const lines = raw.split('\n')
let btCount = 0
let inBT = false
let btStart = 0

// Find BT block 3 and 4 (0-indexed)
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === 'BT') {
        if (btCount >= 3 && btCount <= 5) {
            console.log(`\n=== BT #${btCount} at line ${i} ===`)
        }
        btStart = i
        inBT = true
        btCount++
    }
    if (inBT && btCount >= 4 && btCount <= 6) {
        // Print first 30 lines of BT blocks 3-5
        if (i - btStart < 30) {
            console.log(`  ${i}: ${lines[i].substring(0, 120)}`)
        }
    }
    if (line === 'ET') {
        inBT = false
        if (btCount >= 4 && btCount <= 6) {
            console.log(`  ${i}: ET`)
            // Print a few lines after ET
            for (let k = 1; k <= 3 && i+k < lines.length; k++) {
                console.log(`  ${i+k}: ${lines[i+k].substring(0, 120)}`)
            }
        }
    }
}
