import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    
    // Check which font R8, R9, R10, R18, R19 use
    for (const ri of [8, 9, 10, 18, 19]) {
        if (ri >= regrouped.length) continue
        const r = regrouped[ri]
        const seg = r.getSegments()[0]
        const font = seg.font
        console.log(`R${ri}: font=${font.resourceName} fontName=${font.fontName} isUnicode=${font.isUnicode}`)
        console.log(`  charWidths size: ${font.metrics.charWidths.size}`)
    }
}

main().catch(console.error)
