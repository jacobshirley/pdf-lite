import { PdfDocument, TextBlock } from './src/index.js'
import { ShowTextOp } from './src/graphics/ops/text.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const blocks = page.extractTextBlocks()

for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]
    const segs = b.getSegments()
    for (let si = 0; si < segs.length; si++) {
        const s = segs[si]
        const wtm = s.getWorldTransform()
        if (Math.abs(wtm.f - 543.7) < 1) {
            const showOp = s.ops.find((o: any) => o instanceof ShowTextOp) as ShowTextOp | undefined
            if (showOp) {
                const operand = showOp.stringOperand!
                const raw = operand.raw
                console.log(`Raw bytes (${raw.length}):`)
                const lines = []
                for (let i = 0; i < raw.length; i += 2) {
                    const hi = raw[i]
                    const lo = raw[i + 1]
                    lines.push(`  [${i}] hi=0x${hi?.toString(16).padStart(2,'0')} lo=0x${lo?.toString(16).padStart(2,'0')} → 0x${((hi << 8) | (lo ?? 0)).toString(16).padStart(4,'0')}`)
                }
                for (const l of lines.slice(0, 40)) console.log(l)
                if (lines.length > 40) console.log(`  ... (${lines.length} total pairs)`)
                
                // Check the heuristic
                let allEvenZero = true
                for (let i = 0; i < raw.length; i += 2) {
                    if (raw[i] !== 0) {
                        console.log(`\nHeuristic fails at byte[${i}] = 0x${raw[i].toString(16)} (${raw[i]})`)
                        allEvenZero = false
                        break
                    }
                }
                if (allEvenZero) console.log('\nHeuristic: all even bytes are 0x00 ✓')
            }
        }
    }
}
