import { PdfDocument } from './src/pdf/pdf-document.js'
import { readFile } from 'fs/promises'
import { SetFontOp } from './src/graphics/ops/text.js'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
const page = doc.pages.get(0)
const tbs = page.contentStreams.flatMap(s => s.textBlocks)

// Check what fonts Block 3 uses (the block before Block 4)
console.log('=== Block 3 ===')
const tb3 = tbs[3]
const segs3 = tb3.getSegments()
for (let j = 0; j < segs3.length; j++) {
    const seg = segs3[j]
    const tfOps = seg.ops.filter((op: any) => op instanceof SetFontOp)
    const tfInfo = tfOps.map((op: any) => `/${op.fontName} ${op.fontSize}`).join(', ')
    console.log(`  Seg ${j}: font=${seg.font.resourceName} (${seg.font.fontType}) Tf=[${tfInfo}] text="${seg.text.substring(0, 40)}"`)
}

// Check Block 4 Seg 0's prev chain more deeply
console.log('\n=== Block 4 Seg 0 prev chain ===')
const tb4 = tbs[4]
const seg0 = tb4.getSegments()[0]
let p = seg0.prev
let depth = 0
while (p && depth < 10) {
    const tfOps = p.ops.filter((op: any) => op instanceof SetFontOp)
    const tfInfo = tfOps.map((op: any) => `/${op.fontName} ${op.fontSize}`).join(', ')
    console.log(`  prev[${depth}]: font=${p.font.resourceName} (${p.font.fontType}) Tf=[${tfInfo}] text="${p.text.substring(0, 30)}"`)
    if (tfOps.length > 0) break
    p = p.prev
    depth++
}

// Now check raw content stream around Block 4
console.log('\n=== Raw BT blocks around Block 4 ===')
const cs = page.contentStreams[0]
const allBlocks = cs.textBlocks
for (let i = 3; i <= 5 && i < allBlocks.length; i++) {
    const block = allBlocks[i]
    const segs = block.getSegments()
    console.log(`\nBlock ${i}: ${segs.length} segs`)
    // Get all ops of the block
    const allOps: any[] = []
    for (const seg of segs) {
        allOps.push(...seg.ops)
    }
    const tfOps = allOps.filter((op: any) => op instanceof SetFontOp)
    for (const tf of tfOps) {
        console.log(`  Tf: /${tf.fontName} ${tf.fontSize}`)
    }
}
