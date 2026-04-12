import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const blocks = page.extractTextBlocks()

// Find blocks/segments containing "Intermediary" or "TAIN"
for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]
    const segs = b.getSegments()
    for (let si = 0; si < segs.length; si++) {
        const s = segs[si]
        const t = s.text
        if (t && (t.includes('ntermediary') || t.includes('TAIN'))) {
            const wtm = s.getWorldTransform()
            const bbox = s.getLocalBoundingBox()
            const adv = s.getTextAdvance()
            console.log(`B${bi} seg[${si}] text="${t}"`)
            console.log(`  font=${s.font.fontName} fontSize=${s.fontSize}`)
            console.log(`  wtm: a=${wtm.a} b=${wtm.b} c=${wtm.c} d=${wtm.d} e=${wtm.e.toFixed(2)} f=${wtm.f.toFixed(2)}`)
            console.log(`  bbox: x=${bbox.x.toFixed(2)} y=${bbox.y.toFixed(2)} w=${bbox.width.toFixed(2)} h=${bbox.height.toFixed(2)}`)
            console.log(`  textAdvance=${adv.toFixed(2)}`)

            const tf = s.ops.find((o: any) => o.constructor.name === 'SetFontOp')
            console.log(`  hasTf=${!!tf} tfFont=${tf?.fontName ?? 'none'}`)

            let walk = s.prev
            let depth = 0
            while (walk && depth < 5) {
                const wtf = walk.ops.find((o: any) => o.constructor.name === 'SetFontOp')
                if (wtf) {
                    console.log(`  prev[${depth}] Tf=${wtf.fontName} text="${walk.text.substring(0, 30)}"`)
                    break
                }
                depth++
                walk = walk.prev
            }
            if (!walk || depth >= 5) console.log(`  no Tf in prev chain (depth=${depth})`)
        }
    }
}

// Regroup and check
const regrouped = TextBlock.regroupTextBlocks(blocks as any)
console.log('\n=== After regrouping ===')
for (let ri = 0; ri < regrouped.length; ri++) {
    const rb = regrouped[ri]
    const segs = rb.getSegments()
    for (const s of segs) {
        const t = s.text
        if (t && (t.includes('ntermediary') || t.includes('TAIN'))) {
            const wtm = s.getWorldTransform()
            const bbox = s.getLocalBoundingBox()
            const adv = s.getTextAdvance()
            const blockBbox = rb.getLocalBoundingBox()
            console.log(`R${ri} text="${t}"`)
            console.log(`  font=${s.font.fontName} fontSize=${s.fontSize}`)
            console.log(`  segBbox: w=${bbox.width.toFixed(2)} h=${bbox.height.toFixed(2)}`)
            console.log(`  textAdvance=${adv.toFixed(2)}`)
            console.log(`  blockBbox: x=${blockBbox.x.toFixed(2)} y=${blockBbox.y.toFixed(2)} w=${blockBbox.width.toFixed(2)} h=${blockBbox.height.toFixed(2)}`)
        }
    }
}
