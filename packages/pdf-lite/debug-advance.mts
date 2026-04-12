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

    // Pick R9: an overflow block
    const r9 = regrouped[9]
    console.log('R9 text:', JSON.stringify(r9.text.substring(0, 50)))
    
    const seg = r9.getSegments()[0]
    const font = seg.font
    const fontSize = seg.fontSize
    console.log('fontSize:', fontSize, 'isUnicode:', font.isUnicode)
    
    for (const op of seg.ops) {
        if (op instanceof ShowTextOp) {
            const rawText = op.text
            console.log('\nShowTextOp raw text:', JSON.stringify(rawText.substring(0, 30)))
            console.log('raw text length:', rawText.length)
            
            // measure character by character
            let total = 0
            for (let i = 0; i < Math.min(rawText.length, 5); i++) {
                const ch = rawText[i]
                const code = ch.charCodeAt(0)
                const w = font.getCharacterWidth(code, fontSize)
                console.log(`  char[${i}]: code=${code} (${JSON.stringify(ch)}) width=${w} fallback=${fontSize * 0.6}`)
                total += w ?? fontSize * 0.6
            }
            console.log('  first 5 chars total advance:', total)
        }
        if (op instanceof ShowTextArrayOp) {
            console.log('\nShowTextArrayOp segments:', op.segments.length)
            for (let s = 0; s < Math.min(op.segments.length, 3); s++) {
                const segment = op.segments[s]
                if (typeof segment === 'number') {
                    console.log(`  kern: ${segment}`)
                } else {
                    const decoded = font.decode(segment)
                    console.log(`  string segment: raw=${JSON.stringify(segment.value?.substring(0, 15) ?? '')} decoded=${JSON.stringify(decoded.substring(0, 15))} len=${decoded.length}`)
                    for (let i = 0; i < Math.min(decoded.length, 3); i++) {
                        const ch = decoded[i]
                        const code = ch.charCodeAt(0)
                        const w = font.getCharacterWidth(code, fontSize)
                        console.log(`    char[${i}]: code=${code} (${JSON.stringify(ch)}) width=${w}`)
                    }
                }
            }
        }
    }
}

main().catch(console.error)
