import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import { SetFontOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    
    console.log('Page fontMap keys:', [...page.fontMap.keys()])
    
    // Check R9 segments' Tf ops
    const r9 = regrouped[9]
    for (const seg of r9.getSegments().slice(0, 3)) {
        const tf = seg.ops.find(o => o instanceof SetFontOp)
        if (tf) {
            console.log(`  Tf: fontName="${tf.fontName}" fontSize=${tf.fontSize} raw="${tf.toString().trim()}"`)
        }
    }
    
    // Also check the original raw blocks
    console.log('\nOriginal B4 raw ops:')
    const b4 = blocks[4]
    for (const op of b4.ops) {
        if (op instanceof SetFontOp) {
            console.log(`  Tf: fontName="${op.fontName}" fontSize=${op.fontSize} raw="${op.toString().trim()}"`)
        }
    }
}

main().catch(console.error)
