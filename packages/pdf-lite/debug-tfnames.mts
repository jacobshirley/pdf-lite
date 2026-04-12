import { PdfDocument } from './src/index.js'
import { SetFontOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    
    console.log('fontMap keys:', [...page.fontMap.keys()])
    
    // Collect all unique Tf font names from raw blocks
    const tfNames = new Set<string>()
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        for (const seg of b.getSegments()) {
            const tf = seg.ops.find(o => o instanceof SetFontOp) as SetFontOp | undefined
            if (tf) {
                tfNames.add(tf.fontName)
            }
        }
    }
    console.log('All Tf font names in content:', [...tfNames])
    
    // Check which don't have fontMap entries
    for (const name of tfNames) {
        const font = page.fontMap.get(name)
        console.log(`  ${name}: ${font ? font.fontName : 'NOT FOUND'}`)
    }
    
    // Check segments that use missing fonts
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        for (const seg of b.getSegments()) {
            const tf = seg.ops.find(o => o instanceof SetFontOp) as SetFontOp | undefined
            if (tf && !page.fontMap.has(tf.fontName)) {
                console.log(`\nB${i}: seg with unknown font "${tf.fontName}" text="${seg.text.substring(0, 40)}"`)
                // Check if this font name exists elsewhere
                const prevTf = seg.prev?.ops.find(o => o instanceof SetFontOp) as SetFontOp | undefined
                console.log(`  prev Tf: ${prevTf?.fontName ?? 'none'}`)
                break
            }
        }
    }
}

main().catch(console.error)
