import { PdfDocument } from './src/index.js'
import * as fs from 'fs'

const buf = fs.readFileSync('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buf)])
const page = [...doc.pages][0]

const fontMap = page.fontMap
for (const [name, font] of fontMap.entries()) {
    if (font.fontName.includes('SC700')) {
        console.log(`Font: ${name} -> ${font.fontName}`)
        
        // Check font descriptor
        const desc = (font as any).content?.get?.('FontDescriptor')
        console.log('FontDescriptor ref:', desc?.toString?.()?.substring(0, 50))
        
        const resolved = desc?.resolve?.()
        if (resolved) {
            const dict = resolved.content
            console.log('Descriptor keys:', [...(dict?.keys?.() ?? [])])
            console.log('MissingWidth:', dict?.get?.('MissingWidth')?.toString?.())
            console.log('AvgWidth:', dict?.get?.('AvgWidth')?.toString?.())
            console.log('StemV:', dict?.get?.('StemV')?.toString?.())
            console.log('Flags:', dict?.get?.('Flags')?.toString?.())
        }
        
        // Check the font's metrics object
        const metrics = (font as any).metrics
        console.log('\nMetrics type:', metrics?.constructor?.name)
        console.log('Metrics defaultWidth:', metrics?.defaultWidth)
        console.log('Metrics charWidths size:', metrics?.charWidths?.size)
        if (metrics?.charWidths?.size) {
            const entries = [...metrics.charWidths.entries()].sort((a: any, b: any) => a[0] - b[0])
            for (const [k, v] of entries.slice(0, 20)) {
                console.log(`  ${k} (${String.fromCharCode(k)}): ${v}`)
            }
        }
    }
}
