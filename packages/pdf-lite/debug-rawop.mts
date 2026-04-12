import { PdfDocument } from './src/index.js'
import { PdfContentStreamTokeniser } from './src/graphics/tokeniser.js'
import { BeginTextOp, EndTextOp, SetFontOp, ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const streams = page.contentStreams
const combined = streams.map(s => s.dataAsString).join('\n')
const ops = PdfContentStreamTokeniser.tokenise(combined)

// Show ops 60-72 (BT#5 area)
let btCount = 0
for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (op instanceof BeginTextOp) btCount++
    if (btCount === 5 && i >= 60 && i <= 75) {
        console.log(`[${i}] ${op.constructor.name}: ${op.toString().substring(0, 120)}`)
    }
}
