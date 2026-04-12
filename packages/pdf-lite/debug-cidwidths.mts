import { PdfDocument } from './src/index.js'
import { PdfDictionary, PdfArray, PdfObjectReference, PdfNumber, PdfName } from './src/core/index.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    
    for (const [name, font] of page.fontMap) {
        if (!font.isUnicode) continue
        console.log(`\n=== Font ${name} ===`)
        const dict = font.content as PdfDictionary
        console.log('  dict keys:', [...dict.keys()].map(k => k.value))
        
        const descRef = dict.get('DescendantFonts')
        console.log('  DescendantFonts type:', descRef?.constructor.name)
        
        if (descRef instanceof PdfArray) {
            console.log('  descFonts items:', descRef.items.length)
            const cidFontRef = descRef.items[0]
            console.log('  cidFontRef type:', cidFontRef?.constructor.name)
            if (cidFontRef instanceof PdfObjectReference) {
                const cidFont = cidFontRef.resolve()
                console.log('  cidFont resolved:', cidFont?.constructor.name)
                const cidFontDict = cidFont?.content as PdfDictionary | undefined
                if (cidFontDict) {
                    console.log('  cidFontDict keys:', [...cidFontDict.keys()].map(k => k.value))
                    const dw = cidFontDict.get('DW')
                    console.log('  DW:', dw instanceof PdfNumber ? dw.value : dw)
                    const w = cidFontDict.get('W')
                    console.log('  W type:', w?.constructor.name)
                    if (w instanceof PdfArray) {
                        console.log('  W items count:', w.items.length)
                        console.log('  W first 10:', w.items.slice(0, 10).map(i => `${i.constructor.name}:${i instanceof PdfNumber ? i.value : i instanceof PdfArray ? '[...]' : '?'}`))
                    } else if (w instanceof PdfObjectReference) {
                        const wResolved = w.resolve()
                        console.log('  W ref resolved:', wResolved?.content?.constructor.name)
                        if (wResolved?.content instanceof PdfArray) {
                            console.log('  W items count:', wResolved.content.items.length)
                        }
                    }
                }
            }
        } else if (descRef instanceof PdfObjectReference) {
            console.log('  DescendantFonts is a ref — resolving')
            const resolved = descRef.resolve()
            console.log('  resolved type:', resolved?.content?.constructor.name)
        }
    }
}

main().catch(console.error)
