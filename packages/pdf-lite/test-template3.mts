import { readFile } from 'fs/promises'
import { PdfDocument } from './src/pdf/pdf-document.ts'

const buffer = await readFile('./test/unit/fixtures/template.pdf')
const doc = await PdfDocument.fromBytes([new Uint8Array(buffer)])

const page = doc.pages.toArray()[0]
for (let si = 0; si < page.contentStreams.length; si++) {
    const stream = page.contentStreams[si]
    const blocks = stream.textBlocks
    if (blocks.length > 0) {
        console.log(`=== Stream ${si}: ${blocks.length} blocks ===`)
        blocks.forEach((tb, i) => console.log(`  ${i}: ${JSON.stringify(tb.text)}`))
    }
}
