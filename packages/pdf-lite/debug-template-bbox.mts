import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()

    // Get page dimensions
    const mediaBox = page.mediaBox
    console.log('Page mediaBox:', mediaBox)

    console.log(`\nRAW BLOCKS: ${blocks.length}`)
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        const bbox = b.getWorldBoundingBox()
        const txt = b.text.substring(0, 50)
        const overflows = bbox.x + bbox.width > (mediaBox?.[2] ?? 595)
        console.log(`B${i}: "${txt}" bbox=[${bbox.x.toFixed(1)},${bbox.y.toFixed(1)},w=${bbox.width.toFixed(1)},h=${bbox.height.toFixed(1)}]${overflows ? ' *** OVERFLOW' : ''}`)
    }

    console.log('\nREGROUPED:')
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    console.log(`count: ${regrouped.length}`)
    for (let i = 0; i < regrouped.length; i++) {
        const b = regrouped[i]
        const bbox = b.getWorldBoundingBox()
        const txt = b.text.substring(0, 50)
        const overflows = bbox.x + bbox.width > (mediaBox?.[2] ?? 595)
        console.log(`R${i}: "${txt}" bbox=[${bbox.x.toFixed(1)},${bbox.y.toFixed(1)},w=${bbox.width.toFixed(1)},h=${bbox.height.toFixed(1)}]${overflows ? ' *** OVERFLOW' : ''}`)
    }

    // Detail overflowing blocks
    console.log('\n=== OVERFLOW DETAILS ===')
    const pageW = mediaBox?.[2] ?? 595
    for (let i = 0; i < regrouped.length; i++) {
        const b = regrouped[i]
        const bbox = b.getWorldBoundingBox()
        if (bbox.x + bbox.width <= pageW) continue
        console.log(`\nR${i}: "${b.text.substring(0,50)}"`)
        for (const seg of b.getSegments()) {
            const tm = seg.getWorldTransform()
            const adv = seg.getTextAdvance()
            const hasTf = seg.ops.some(o => o.constructor.name === 'SetFontOp')
            console.log(`  seg: "${seg.text.substring(0,30)}" fs=${seg.fontSize} hasTf=${hasTf} advance=${adv.toFixed(1)} tm.a=${tm.a.toFixed(2)} tm.d=${tm.d.toFixed(2)} tx=${tm.e.toFixed(1)}`)
            console.log(`    worldW=${(adv * Math.abs(tm.a)).toFixed(1)} worldEndX=${(tm.e + adv * Math.abs(tm.a)).toFixed(1)}`)
        }
    }
}

main().catch(console.error)
