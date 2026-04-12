import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import { ShowTextOp, ShowTextArrayOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const blocks = page.extractTextBlocks()
    const regrouped = TextBlock.regroupTextBlocks(blocks)

    // Check font F1 properties
    const r9 = regrouped[9]
    const seg = r9.getSegments()[0]
    const font = seg.font
    console.log('F1 props:')
    console.log('  isUnicode:', font.isUnicode)
    console.log('  resourceName:', font.resourceName)
    console.log('  firstChar:', font.firstChar)
    console.log('  widths (length):', font.widths?.length)
    console.log('  widths first 10:', font.widths?.slice(0, 10))
    console.log('  metrics.defaultWidth:', font.metrics?.defaultWidth)
    console.log('  encodingMap size:', font.encodingMap?.size)

    // Check a few specific codes R9 uses
    for (const code of [55, 75, 76, 86, 3]) {
        const metricsW = font.metrics.getCharWidth(code)
        const firstChar = font.firstChar ?? 0
        const widthsW = font.widths ? font.widths[code - firstChar] : undefined
        const rawW = font.getRawCharacterWidth(code)
        console.log(`  code ${code}: metricsW=${metricsW} widthsW=${widthsW} rawW=${rawW}`)
    }
}

main().catch(console.error)
