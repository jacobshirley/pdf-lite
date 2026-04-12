import { PdfDocument } from './src/index.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]

// Dump font info for the font used by "Intermediary TAIN"
const fontMap = page.fontMap
for (const [name, font] of fontMap.entries()) {
    if (font.fontName.includes('SC700') || font.fontName.includes('ArialMT-SC')) {
        console.log(`Font: ${name} -> ${font.fontName}`)
        console.log(`Type: ${font.fontType}`)
        console.log(`Encoding: ${font.encoding}`)
        console.log(`FirstChar: ${(font as any).firstChar}`)
        console.log(`LastChar: ${(font as any).lastChar}`)
        
        // Check widths array
        const widths = (font as any).widths
        if (widths) {
            console.log(`Widths array length: ${widths.length}`)
            console.log(`Widths (first 30):`, widths.slice(0, 30))
        }
        
        // Try charWidths map
        const cw = (font as any).charWidths
        if (cw) {
            console.log(`charWidths type:`, typeof cw, cw instanceof Map ? 'Map' : 'not Map')
            if (cw instanceof Map) {
                console.log(`charWidths size: ${cw.size}`)
                const entries = [...cw.entries()].sort((a: any, b: any) => a[0] - b[0])
                for (const [k, v] of entries) {
                    console.log(`  ${k} (${String.fromCharCode(k)}): ${v}`)
                }
            }
        }

        // Check getRawCharacterWidth for lowercase n
        console.log('\ngetRawCharacterWidth tests:')
        for (const code of [73, 110, 116, 101, 114, 109, 100, 105, 97, 121, 32, 84, 65, 78]) {
            const raw = font.getRawCharacterWidth(code)
            console.log(`  code=${code} (${String.fromCharCode(code)}): raw=${raw}`)
        }
    }
}
