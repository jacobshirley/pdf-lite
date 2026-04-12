import { PdfDocument, TextBlock } from './src/index.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]
const blocks = page.extractTextBlocks()

// B4[0] is the problem segment - "as my Intermediary..." rendered under TT0
// Let's find it
for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi]
    const segs = b.getSegments()
    for (let si = 0; si < segs.length; si++) {
        const s = segs[si]
        const wtm = s.getWorldTransform()
        if (Math.abs(wtm.f - 543.7) < 1) {
            console.log(`B${bi}[${si}] y=${wtm.f.toFixed(1)}`)
            console.log(`  font: ${s.font.fontName} (${s.font.fontType})`)
            console.log(`  text: "${s.text.substring(0, 60)}"`)
            console.log(`  advance: ${s.getTextAdvance().toFixed(2)}`)
            console.log(`  fontSize: ${s.fontSize}`)
            
            // Check the raw string operand
            const showOp = s.ops.find((o: any) => o.constructor.name === 'ShowTextOp') as any
            if (showOp) {
                const raw = showOp.toString().substring(0, 200)
                console.log(`  showOp: ${raw}`)
                const operand = showOp.stringOperand
                console.log(`  operand type: ${operand?.constructor?.name}`)
                if (operand) {
                    const rawValue = operand.value
                    console.log(`  operand value length: ${rawValue.length}`)
                    // Show first 30 byte values
                    const bytes = []
                    for (let i = 0; i < Math.min(rawValue.length, 30); i++) {
                        bytes.push(rawValue.charCodeAt(i))
                    }
                    console.log(`  bytes: [${bytes.join(', ')}]`)
                    
                    // Show glyph codes extracted
                    const codes = s.font.extractGlyphCodes(operand)
                    console.log(`  glyphCodes (${codes.length}): [${codes.slice(0, 20).join(', ')}]`)
                    
                    // Width per code
                    for (const code of codes.slice(0, 20)) {
                        const w = s.font.getCharacterWidth(code, 1)
                        console.log(`    code=${code} (0x${code.toString(16)}) w=${w}`)
                    }
                }
            }
        }
    }
}
