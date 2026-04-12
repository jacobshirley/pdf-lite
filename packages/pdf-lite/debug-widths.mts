import { PdfDocument } from './src/index.js'
import { ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'
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
        if (s.text === 'Intermediary TAIN') {
            const font = s.font
            console.log('Font:', font.fontName)
            console.log('Font type:', font.fontType)
            console.log('ResourceName:', font.resourceName)
            console.log('Encoding:', font.encoding)

            const showOp = s.ops.find((o: any) => o instanceof ShowTextOp) as ShowTextOp | undefined
            const arrayOp = s.ops.find((o: any) => o instanceof ShowTextArrayOp) as any
            
            if (showOp) {
                console.log('ShowTextOp raw:', showOp.toString().substring(0, 200))
                const operand = showOp.stringOperand
                if (operand) {
                    console.log('Operand type:', operand.constructor.name)
                    console.log('Operand raw:', operand.toString().substring(0, 100))
                    const codes = font.extractGlyphCodes(operand)
                    console.log('Glyph codes:', codes)
                    for (const code of codes) {
                        const w = font.getCharacterWidth(code, 1)
                        const raw = font.getRawCharacterWidth(code)
                        console.log(`  code=${code} char=${String.fromCharCode(code)} w=${w} raw=${raw}`)
                    }
                }
            }
            
            if (arrayOp) {
                console.log('ShowTextArrayOp raw:', arrayOp.toString().substring(0, 200))
                for (const segment of arrayOp.segments) {
                    if (typeof segment === 'number') {
                        console.log(`  kern: ${segment}`)
                    } else {
                        console.log(`  str type=${segment.constructor.name} val=${segment.toString().substring(0, 60)}`)
                        const codes = font.extractGlyphCodes(segment)
                        console.log(`  codes:`, codes)
                        for (const code of codes) {
                            const w = font.getCharacterWidth(code, 1)
                            console.log(`    code=${code} w=${w}`)
                        }
                    }
                }
            }

            // Also dump all ops for this segment
            console.log('\nAll ops:')
            for (const op of s.ops) {
                console.log(`  ${op.constructor.name}: ${op.toString().substring(0, 100)}`)
            }
        }
    }
}
