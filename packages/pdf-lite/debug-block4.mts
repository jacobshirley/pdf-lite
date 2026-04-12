import { PdfDocument } from './src/pdf/pdf-document.js'
import { readFile } from 'fs/promises'
import { SetFontOp, ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
const page = doc.pages.get(0)
const tbs = page.contentStreams.flatMap(s => s.textBlocks)

// Focus on Block 4
const tb4 = tbs[4]
const segs = tb4.getSegments()
console.log(`Block 4 has ${segs.length} segments`)

for (let j = 0; j < Math.min(3, segs.length); j++) {
    const seg = segs[j]
    console.log(`\nSeg ${j}: font=${seg.font.resourceName} (${seg.font.fontType})`)
    console.log(`  ops (${seg.ops.length}):`)
    for (const op of seg.ops) {
        const name = op.constructor.name
        if (op instanceof SetFontOp) {
            console.log(`    ${name}: /${op.fontName} ${op.fontSize} Tf`)
        } else if (op instanceof ShowTextOp || op instanceof ShowTextArrayOp) {
            console.log(`    ${name}: text=${seg.text.substring(0, 40)}`)
        } else {
            console.log(`    ${name}`)
        }
    }
    // Check prev chain
    let p = seg.prev
    let depth = 0
    while (p && depth < 5) {
        const pTf = p.ops.find((x: any) => x instanceof SetFontOp) as SetFontOp | undefined
        if (pTf) {
            console.log(`  prev[${depth}] font: /${pTf.fontName} ${pTf.fontSize} Tf (${p.font.resourceName})`)
            break
        }
        depth++
        p = p.prev
    }
}

// Also check Block 4's BT raw ops
console.log('\n=== Block 4 raw BT ops ===')
const allOps = tb4.textOps
for (const op of allOps) {
    if (op instanceof SetFontOp) {
        console.log(`  Tf: /${op.fontName} ${op.fontSize}`)
    }
}
