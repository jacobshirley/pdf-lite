import { PdfDocument } from './src/pdf/pdf-document.js'
import { readFile } from 'fs/promises'
import { ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])
const page = doc.pages.get(0)
const tbs = page.contentStreams.flatMap(s => s.textBlocks)

for (let i = 0; i < tbs.length; i++) {
    const segs = tbs[i].getSegments()
    for (let j = 0; j < segs.length; j++) {
        const seg = segs[j]
        const showOps = seg.ops.filter(
            op => op instanceof ShowTextOp || op instanceof ShowTextArrayOp
        )
        if (showOps.length === 0) continue

        const decoded = seg.text
        // skip short or boring segments
        if (decoded.length < 3) continue

        const font = seg.font
        const firstShow = showOps[0]
        let operandInfo = ''
        if (firstShow instanceof ShowTextOp) {
            const op = firstShow.stringOperand
            if (op) {
                const raw = op.raw
                operandInfo = `raw[0..5]=[${Array.from(raw.slice(0, 6)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(',')}] len=${raw.length}`
            }
        }

        // Flag problematic: decoded text has lots of non-printable or garbled looking chars
        const hasNulls = decoded.includes('\x00')
        const textPreview = decoded.substring(0, 60).replace(/\x00/g, '\\0')

        if (hasNulls || decoded.includes('DVP') || decoded.includes('Intermediary') || i >= 4) {
            console.log(`Block ${i} Seg ${j}: font=${font.resourceName} (${font.fontType}) isUnicode=${font.isUnicode}`)
            console.log(`  text: "${textPreview}"`)
            console.log(`  ${operandInfo}`)
            console.log(`  firstChar=${font.firstChar} lastChar=${font.lastChar}`)
        }
    }
}
