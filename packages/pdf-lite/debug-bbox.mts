import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/multi-child-field.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()

    console.log('RAW BLOCKS:', blocks.length)
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        const segs = b.getSegments()
        const bbox = b.getWorldBoundingBox()
        const txt = b.text.substring(0, 60)
        console.log(`B${i}: "${txt}" segs=${segs.length} bbox=[${bbox.x.toFixed(1)},${bbox.y.toFixed(1)},${bbox.width.toFixed(1)},${bbox.height.toFixed(1)}]`)
    }

    console.log('\nREGROUPED:')
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    console.log('count:', regrouped.length)
    for (let i = 0; i < regrouped.length; i++) {
        const b = regrouped[i]
        const segs = b.getSegments()
        const bbox = b.getWorldBoundingBox()
        const txt = b.text.substring(0, 60)
        console.log(`R${i}: "${txt}" segs=${segs.length} bbox=[${bbox.x.toFixed(1)},${bbox.y.toFixed(1)},${bbox.width.toFixed(1)},${bbox.height.toFixed(1)}]`)
    }

    // Detailed look at worst blocks
    console.log('\n=== DETAIL: B1 (h=135) ===')
    const b1 = blocks[1]
    for (const seg of b1.getSegments()) {
        const tm = seg.getWorldTransform()
        const hasTf = seg.ops.some(o => o.constructor.name === 'SetFontOp')
        const opNames = seg.ops.map(o => o.constructor.name).join(',')
        console.log(`  seg: "${seg.text.substring(0,30)}" fs=${seg.fontSize} hasTf=${hasTf} advance=${seg.getTextAdvance().toFixed(1)}`)
        console.log(`    ops: ${opNames}`)
        console.log(`    tm=[${tm.a.toFixed(2)},${tm.b.toFixed(2)},${tm.c.toFixed(2)},${tm.d.toFixed(2)},${tm.e.toFixed(2)},${tm.f.toFixed(2)}]`)
    }

    // Show raw content stream for this block
    console.log('\n=== RAW OPS B1 ===')
    for (const op of b1.ops) {
        console.log(`  ${op.constructor.name}: "${op.toString().substring(0,60)}"`)
    }
}

main().catch(console.error)

main().catch(console.error)
