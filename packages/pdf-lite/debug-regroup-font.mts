import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import { SetFontOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    
    // Check RAW B4 segments
    console.log('=== RAW B4 segments ===')
    const b4 = blocks[4]
    console.log('B4 page:', b4.page?.constructor.name)
    for (const seg of b4.getSegments().slice(0, 3)) {
        const tf = seg.ops.find(o => o instanceof SetFontOp)
        if (tf) {
            const fontName = tf.fontName
            const font = seg.font
            console.log(`  seg font: resourceName="${font.resourceName}" fontName="${font.fontName}" isUnicode=${font.isUnicode} (Tf says "${fontName}")`)
            console.log(`    page?`, !!seg.page, 'fontMap lookup:', seg.page?.fontMap.get(fontName)?.fontName)
        }
    }
    
    // Check regrouped
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    console.log('\n=== OVERFLOW SEGMENTS ===')
    for (const ri of [8, 10, 19]) {
        if (ri >= regrouped.length) continue
        const r = regrouped[ri]
        const seg = r.getSegments()[0]
        const tf = seg.ops.find(o => o instanceof SetFontOp); 
        if (tf) {
            const font = seg.font
            console.log(`R${ri}: Tf="${tf.fontName}" font="${font.fontName}" isUnicode=${font.isUnicode} resourceName="${font.resourceName}" charWidths=${font.metrics.charWidths.size}`)
        }
    }
}

main().catch(console.error)
