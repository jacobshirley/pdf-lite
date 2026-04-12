import { PdfDocument } from './src/index.js'
import { TextBlock, Text } from './src/graphics/pdf-content-stream.js'
import { ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    const regrouped = TextBlock.regroupTextBlocks(blocks)

    // Check R8 and R9 in detail
    for (const ri of [8, 9, 10]) {
        const r = regrouped[ri]
        console.log(`\nR${ri}: "${r.text.substring(0, 40)}"`)
        const seg = r.getSegments()[0]
        const font = seg.font
        console.log('  font.isUnicode:', font.isUnicode, 'font.resourceName:', font.resourceName)
        
        for (const op of seg.ops) {
            if (op instanceof ShowTextOp) {
                const operand = op.stringOperand
                if (operand) {
                    console.log('  ShowTextOp operand type:', operand.constructor.name)
                    const codes = font.extractGlyphCodes(operand)
                    console.log('  glyphCodes count:', codes.length, 'first 5:', codes.slice(0, 5))
                    
                    // Check widths
                    let widthTotal = 0
                    for (const code of codes.slice(0, 5)) {
                        const w = font.getCharacterWidth(code, 1)
                        const rawW = font.getRawCharacterWidth(code)
                        console.log(`    code=${code} rawW=${rawW} scaledW=${w}`)
                        widthTotal += w ?? 0.6
                    }
                    console.log(`  first 5 width total: ${widthTotal}`)
                }
            }
            if (op instanceof ShowTextArrayOp) {
                console.log('  ShowTextArrayOp segments:', op.segments.length)
                const seg0 = op.segments[0]
                if (seg0 && typeof seg0 !== 'number') {
                    console.log('  seg0 type:', seg0.constructor.name)
                    const codes = font.extractGlyphCodes(seg0)
                    console.log('  glyphCodes count:', codes.length, 'first 5:', codes.slice(0, 5))
                    for (const code of codes.slice(0, 5)) {
                        const rawW = font.getRawCharacterWidth(code)
                        console.log(`    code=${code} rawW=${rawW}`)
                    }
                }
            }
        }
    }
}

main().catch(console.error)
