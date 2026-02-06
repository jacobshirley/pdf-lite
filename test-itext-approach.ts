import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import fs from 'fs/promises'

console.log('Creating PDF with iText-style empty appearance...\n')

// Load your PDF
const pdfBytes = await fs.readFile(
    './packages/pdf-lite/test/unit/fixtures/template.pdf',
)
const document = await PdfDocument.fromBytes([pdfBytes])

const acroform = await document.acroForm.read()
if (!acroform) {
    throw new Error('No AcroForm found')
}

// Fill the form
const field = acroform.fields.find((f) => f.name === 'Client Name')
if (field) {
    field.value = 'Test Value Here'

    // Generate empty appearance (iText approach)
    // This creates an appearance with just /Tx BMC EMC
    field.generateAppearance()

    console.log('✓ Generated empty marked content appearance')
    console.log('  Field value:', field.value)
    console.log('  Field editable:', !field.readOnly)
}

// Set to false since we provided an appearance
acroform.needAppearances = false

await document.acroForm.write(acroform)

await fs.writeFile('./test-itext-approach.pdf', document.toBytes())

console.log('\n✅ Created test-itext-approach.pdf')
console.log('\nExpected behavior:')
console.log('  ✅ Text visible immediately (viewer renders it)')
console.log('  ✅ Field is editable (not read-only)')
console.log('  ✅ No save dialog (appearance exists, needAppearances = false)')
console.log(
    '  ✅ No text overlap (appearance is empty, viewer handles positioning)',
)
console.log('\nThis is the iText approach!')
