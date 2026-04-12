import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import { SetFontOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    
    // B4 and B10 (raw blocks with garbled text)
    for (const bi of [4, 10]) {
        const b = blocks[bi]
        console.log(`\n=== B${bi}: "${b.text.substring(0, 40)}" ===`)
        const segs = b.getSegments()
        for (let i = 0; i < segs.length; i++) {
            const seg = segs[i]
            const tf = seg.ops.find(o => o instanceof SetFontOp) as SetFontOp | undefined
            const hasPrev = !!seg.prev
            let prevWithTf = seg.prev
            while (prevWithTf && !prevWithTf.ops.find(o => o instanceof SetFontOp)) {
                prevWithTf = prevWithTf.prev
            }
            const prevTf = prevWithTf?.ops.find(o => o instanceof SetFontOp) as SetFontOp | undefined
            console.log(`  seg[${i}]: text="${seg.text.substring(0, 20)}" Tf=${tf?.fontName ?? 'none'} prev=${hasPrev} prevTf=${prevTf?.fontName ?? 'none'} font=${seg.font.fontName}`)
        }
    }
}

main().catch(console.error)
