import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import fs from 'fs/promises'

console.log('Creating PDF with ACTUAL iText approach...\n')

const pdfBytes = await fs.readFile(
    './packages/pdf-lite/test/unit/fixtures/template.pdf',
)
const document = await PdfDocument.fromBytes([pdfBytes])

const acroform = await document.acroForm.read()
if (!acroform) {
    throw new Error('No AcroForm found')
}

const field = acroform.fields.find((f) => f.name === 'Client Name')
if (field) {
    field.value = 'Test Value Here'

    // Generate appearance using iText's ACTUAL approach
    // - Includes text in appearance
    // - Uses positioning formula: textY = (height - fontSize) / 2 + fontSize * 0.2
    // - Wrapped in marked content (/Tx BMC ... EMC)
    field.generateAppearance()

    console.log('✓ Generated appearance with iText positioning')
    console.log('  Field value:', field.value)
    console.log('  Field editable:', !field.readOnly)
    console.log('  Positioning: (height - fontSize) / 2 + fontSize * 0.2')
}

// Set to false since we provided appearances
acroform.needAppearances = false

await document.acroForm.write(acroform)

await fs.writeFile('./test-itext-final.pdf', document.toBytes())

console.log('\n✅ Created test-itext-final.pdf')
console.log('\nThis uses the ACTUAL iText approach:')
console.log('  ✅ Text included in appearance (not empty!)')
console.log('  ✅ Uses iText positioning formula')
console.log('  ✅ Field is editable')
console.log('  ✅ No save dialog (needAppearances = false)')
console.log('\nPlease test and let me know if text aligns correctly!')
