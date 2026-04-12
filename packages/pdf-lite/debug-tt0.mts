import { PdfDocument } from './src/index.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    
    const font = page.fontMap.get('TT0')!
    console.log('TT0 font name:', font.fontName)
    console.log('TT0 isUnicode:', font.isUnicode)
    console.log('TT0 firstChar:', font.firstChar)
    console.log('TT0 widths length:', font.widths?.length)
    
    // Show non-zero widths only
    const widths = font.widths ?? []
    const firstChar = font.firstChar ?? 0
    let nonZero = 0
    for (let i = 0; i < widths.length; i++) {
        if (widths[i] !== 0) {
            console.log(`  code ${firstChar + i}: width=${widths[i]}`)
            nonZero++
        }
    }
    console.log(`Non-zero widths: ${nonZero} out of ${widths.length}`)
    
    // Show what charWidths map has
    console.log('\ncharWidths from metrics:')
    for (const [k, v] of font.metrics.charWidths) {
        if (v !== 0) console.log(`  code ${k}: ${v}`)
    }

    // Check getRawCharacterWidth for a few codes
    for (const code of [55, 75, 76, 86, 3, 32, 68, 72, 85]) {
        const raw = font.getRawCharacterWidth(code)
        console.log(`  getRawCharacterWidth(${code})=${raw}`)
    }
}

main().catch(console.error)
