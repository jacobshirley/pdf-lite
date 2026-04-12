import { PdfDocument, TextBlock } from './src/index.js'
import { PdfContentStreamTokeniser } from './src/graphics/tokeniser.js'
import { BeginTextOp, EndTextOp, SetFontOp, ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const streams = page.contentStreams
const combined = streams.map(s => s.dataAsString).join('\n')
const ops = PdfContentStreamTokeniser.tokenise(combined)

// Trace all Tf ops and BT/ET boundaries 
let btCount = 0
let inTextBlock = false
let lastTf = ''
for (let i = 0; i < ops.length; i++) {
    const op = ops[i]
    if (op instanceof SetFontOp) {
        lastTf = op.toString().trim()
        if (!inTextBlock) {
            console.log(`[${i}] Tf OUTSIDE BT: ${lastTf}`)
        }
    }
    if (op instanceof BeginTextOp) {
        btCount++
        if (btCount >= 3 && btCount <= 8) {
            console.log(`\n[${i}] BT #${btCount}, lastTf="${lastTf}"`)
        }
        inTextBlock = true
    }
    if (op instanceof EndTextOp) {
        if (btCount >= 3 && btCount <= 8) {
            console.log(`[${i}] ET #${btCount}, lastTf="${lastTf}"`)
        }
        inTextBlock = false
    }
    // Show Tf inside BT blocks 3-8
    if (inTextBlock && op instanceof SetFontOp && btCount >= 3 && btCount <= 8) {
        console.log(`[${i}] Tf inside BT#${btCount}: ${op.toString().trim()}`)
    }
    if (inTextBlock && (op instanceof ShowTextOp || op instanceof ShowTextArrayOp) && btCount >= 3 && btCount <= 8) {
        const text = (op as any).text?.substring?.(0, 40) ?? op.toString().substring(0, 40)
        console.log(`[${i}] Show inside BT#${btCount}: ${text}`)
    }
}
