import { PdfDocument } from './src/index.js'
import { PdfContentStreamTokeniser } from './src/graphics/tokeniser.js'
import { BeginTextOp, ShowTextOp } from './src/graphics/ops/text.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const streams = page.contentStreams
const combined = streams.map(s => s.dataAsString).join('\n')

// Find the raw string for BT#5's first show op
const ops = PdfContentStreamTokeniser.tokenise(combined)
let btCount = 0
for (const op of ops) {
    if (op instanceof BeginTextOp) btCount++
    if (btCount === 5 && op instanceof ShowTextOp) {
        const raw = op.raw
        console.log('Raw op string length:', raw.length)
        console.log('Raw op (first 200 chars):', raw.substring(0, 200))
        
        // Show the raw bytes around position where \r appears
        // The CID for 'e' is 0x0048, then next should be 0x000D
        // In the raw string: \000H then \000\r or \000\015
        const idx = raw.indexOf('H\\000')
        if (idx > 0) {
            console.log('\nRaw around "H\\000" at idx', idx)
            console.log('Chars:', raw.substring(idx - 5, idx + 20))
            console.log('Char codes:', [...raw.substring(idx - 5, idx + 20)].map(c => c.charCodeAt(0)))
        }
        
        // Search for \r in the raw
        for (let i = 0; i < raw.length; i++) {
            if (raw.charCodeAt(i) === 0x0d) {
                console.log(`\nFound CR at position ${i}`)
                console.log('Context:', [...raw.substring(Math.max(0, i - 5), i + 5)].map(c => `${c.charCodeAt(0).toString(16)}`))
            }
        }
        break
    }
}
