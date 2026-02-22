import { readFileSync, writeFileSync } from 'fs'
import { PdfDocument } from './src/pdf/pdf-document.js'
import { XfaToAcroFormConverter } from './src/acroform/xfa/xfa-to-acroform.js'

async function main() {
    const bytes = readFileSync(
        './test/unit/fixtures/protectedAdobeLivecycle.pdf',
    )
    const doc = await PdfDocument.fromBytes([new Uint8Array(bytes)])
    doc.setPassword('')
    const count = await XfaToAcroFormConverter.convert(doc)
    console.log(`Converted ${count} fields`)
    const output = doc.toBytes()
    writeFileSync('/tmp/xfa-test-output.pdf', Buffer.from(output))
    console.log('Wrote /tmp/xfa-test-output.pdf')
}
main().catch(console.error)
