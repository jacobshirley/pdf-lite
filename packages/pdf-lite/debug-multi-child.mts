import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import fs from 'fs'

const pdf = PdfDocument.fromBytes(fs.readFileSync('test/unit/fixtures/multi-child-field.pdf'))
const page = pdf.pages[0]
const blocks = page.extractTextBlocks()

console.log(`=== RAW BLOCKS: ${blocks.length} ===`)
for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const segs = b.getSegments()
    const bbox = b.getWorldBoundingBox()
    console.log(`Block ${i}: "${b.text}" (${segs.length} segs)`)
    console.log(`  WorldBBox: x=${bbox.x.toFixed(1)} y=${bbox.y.toFixed(1)} w=${bbox.width.toFixed(1)} h=${bbox.height.toFixed(1)}`)
    for (let j = 0; j < segs.length; j++) {
        const s = segs[j]
        const stm = s.getWorldTransform()
        const sb = s.getWorldBoundingBox()
        console.log(`  Seg ${j}: "${s.text}" font=${s.fontSize}         console.log(`  Seg ${j}: "${s.text}" font=${s.fontSize}         console.log(`  Seg ${j}: "${s.text}" font=${s.fo1)        console.log(`  Seg ${j}: "${s.teoFixe        console.log(`  Seg ${j}: "${s.text}" font=${s.fontSize}}
        console.lo===        console.lo===        console.lo===        console.lo===        console.lo===        cgr        console.lo===  th}        console.lo===        console.ed.l        console.lo===        console.lo===      st s        console.lo===        console.= b.g        console.lo===           console.lo===        b.te        console.lo===        consolesole.        console.lo===        console.lo===        console.lo=== w        console.lo===        console.lo===        console.lo===        console.lo===        console.lo===        cgr        consolesegs[j]
        const stm = s.getWorldTransform()
        console.log(`         console.log(`         console.ze}         console.log(`         console.l(1)},${stm.c.toFixed(1)},${stm.d.toFixed(1)},${stm.e.toFixed(1)},${stm.f.toFixed(1)}]`)
    }
    if (segs.length > 3) console.log(`  ... ${segs.length - 3} more segs`)
}
