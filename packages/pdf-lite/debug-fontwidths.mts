import { PdfDocument } from './src/index.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    
    for (const [name, font] of page.fontMap) {
        console.log(`\n=== Font ${name} ===`)
        console.log('  isUnicode:', font.isUnicode)
        console.log('  metrics.charWidths size:', font.metrics.charWidths.size)
        console.log('  metrics.defaultWidth:', font.metrics.defaultWidth)
        console.log('  metrics.cidWidths:', font.metrics.cidWidths?.length)
        
        if (font.metrics.charWidths.size > 0) {
            const entries = [...font.metrics.charWidths.entries()].slice(0, 10)
            for (const [k, v] of entries) {
                console.log(`    code ${k} -> width ${v}`)
            }
        }
    }
}

main().catch(console.error)
