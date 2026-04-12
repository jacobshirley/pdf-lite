import { PdfDocument } from './src/index.js'
import { PdfContentStreamTokeniser } from './src/graphics/tokeniser.js'
import fs from 'fs'

async function main() {
    const data = fs.readFileSync('test/unit/fixtures/template.pdf')
    const pdf = await PdfDocument.fromBytes([data])
    const page = [...pdf.pages][0]
    const streams = page.contentStreams
    
    // Get the raw content and find the BT blocks
    const content = streams[0].dataAsString
    
    // Find all Tf ops and their positions relative to BT/ET
    const lines = content.split('\n')
    let inBT = false
    let btCount = 0
    let lastTfBeforeBT = ''
    let lastTf = ''
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.match(/\/\w+\s+\d+\s+Tf/)) {
            lastTf = line
            if (!inBT) {
                lastTfBeforeBT = line
            }
        }
        if (line === 'BT') {
            inBT = true
            btCount++
            console.log(`BT #${btCount} at line ${i + 1}, lastTf="${lastTf}"`)
        }
        if (line === 'ET') {
            inBT = false
        }
    }
}

main().catch(console.error)
