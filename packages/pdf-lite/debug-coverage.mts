import { PdfDocument, TextBlock } from './src/index.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const blocks = page.extractTextBlocks()
const regrouped = TextBlock.regroupTextBlocks(blocks)

// First: dump all raw blocks in the y=480-600 range
console.log('=== RAW BLOCKS (y=480-600) ===')
for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]
    const segs = b.getSegments()
    for (let si = 0; si < segs.length; si++) {
        const s = segs[si]
        const wtm = s.getWorldTransform()
        if (wtm.f > 480 && wtm.f < 600) {
            const tf = s.ops.find((o: any) => o.constructor.name === 'SetFontOp') as any
            let prevTfName = 'none'
            let walk = s.prev
            let depth = 0
            while (walk && depth < 15) {
                const ptf = walk.ops.find((o: any) => o.constructor.name === 'SetFontOp') as any
                if (ptf) { prevTfName = `prev[${depth}]:${ptf.fontName}`; break }
                depth++; walk = walk.prev
            }
            console.log(`B${bi}[${si}] y=${wtm.f.toFixed(1)} x=${wtm.e.toFixed(1)} Tf=${tf?.fontName ?? 'none'} prevTf=${prevTfName} font=${s.font.fontName} text="${s.text.substring(0,60)}"`)
        }
    }
}

// Regrouped
console.log('\n=== REGROUPED (y=480-600) ===')
for (let ri = 0; ri < regrouped.length; ri++) {
    const rb = regrouped[ri]
    const bbox = rb.getWorldBoundingBox()
    if (bbox.y > 480 && bbox.y < 600) {
        console.log(`\nR${ri} y=${bbox.y.toFixed(1)} w=${bbox.width.toFixed(1)} x=${bbox.x.toFixed(1)}`)
        const segs = rb.getSegments()
        for (const s of segs) {
            const tf = s.ops.find((o: any) => o.constructor.name === 'SetFontOp') as any
            const wtm = s.getWorldTransform()
            console.log(`  seg: y=${wtm.f.toFixed(1)} Tf=${tf?.fontName ?? 'none'} font=${s.font.fontName} adv=${s.getTextAdvance().toFixed(2)} text="${s.text.substring(0,60)}"`)
        }
    }
}

// Also show page dimensions
const mediaBox = page.mediaBox
console.log(`\nPage mediaBox: ${mediaBox}`)
