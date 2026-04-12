import { PdfDocument } from './src/index.js'
import { TextBlock } from './src/graphics/pdf-content-stream.js'
import { ShowTextOp } from './src/graphics/ops/text.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    
    // Get font F1
    console.log('fontMap keys:', [...page.fontMap.keys()])
    const font = page.fontMap.get('F1') ?? page.fontMap.values().next().value!
    console.log('font resourceName:', font.resourceName)
    console.log('F1 isUnicode:', font.isUnicode)
    console.log('F1 firstChar:', font.firstChar)
    console.log('F1 widths length:', font.widths?.length)
    console.log('F1 encodingMap:', font.encodingMap)
    
    // Check the ToUnicode map
    const toUnicode = font.toUnicodeMap
    console.log('F1 toUnicodeMap size:', toUnicode?.size)
    if (toUnicode) {
        // Show first 20 entries
        let count = 0
        for (const [k, v] of toUnicode) {
            if (count++ >= 20) break
            console.log(`  code ${k} -> "${v}" (U+${v.charCodeAt(0).toString(16).padStart(4, '0')})`)
        }
    }

    // Look at font dictionary for Encoding
    const fontDict = font.content
    console.log('\nFont dict keys:', fontDict ? [...fontDict.keys()] : 'none')
    const enc = fontDict?.get('Encoding')
    console.log('Encoding:', enc?.toString()?.substring(0, 200))

    // Check a specific block — R9 has the "This arrangement..." text
    const blocks = page.extractTextBlocks()
    const regrouped = TextBlock.regroupTextBlocks(blocks)
    
    // Find the block with "arrangement" text
    for (let i = 0; i < regrouped.length; i++) {
        const r = regrouped[i]
        const segs = r.getSegments()
        if (segs.length === 0) continue
        const seg0 = segs[0]
        
        for (const op of seg0.ops) {
            if (op instanceof ShowTextOp) {
                const operand = op.stringOperand
                if (!operand) continue
                const codes = font.extractGlyphCodes(operand)
                if (codes.length > 20 && codes.length < 100) {
                    const decoded = op.decodeWithFont(font)
                    console.log(`\nR${i}: decoded="${decoded.substring(0,50)}"`)
                    console.log(`  codes.length=${codes.length}`)
                    // Show first 10 codes with their widths and decoded chars
                    for (let c = 0; c < Math.min(10, codes.length); c++) {
                        const code = codes[c]
                        const rawW = font.getRawCharacterWidth(code)
                        const mapped = toUnicode?.get(code) ?? String.fromCharCode(code)
                        console.log(`  code=${code} width=${rawW} mapped="${mapped}"`)
                    }
                    break
                }
            }
        }
    }
}

main().catch(console.error)
