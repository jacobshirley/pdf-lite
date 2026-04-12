import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import { SetFontOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    
    for (const ri of [8, 19]) {
        if (ri >= regrouped.length) continue
        const r = regrouped[ri]
        console.log(`\nR${ri}: text="${r.text.substring(0, 40)}"`)
        for (const seg of r.getSegments().slice(0, 2)) {
            const tf = seg.ops.find(o => o instanceof SetFontOp) as SetFontOp | undefined
            const font = seg.font
            console.log(`  Tf="${tf?.fontName}" font="${font.fontName}" isUnicode=${font.isUnicode} resourceName="${font.resourceName}" charWidths=${font.metrics.charWidths.size}`)
            console.log(`  page fontMap lookup for "${tf?.fontName}":`, page.fontMap.get(tf?.fontName ?? '')?.fontName)
        }
    }
}

main().catch(console.error)
