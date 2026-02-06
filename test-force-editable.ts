import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import fs from 'fs/promises'

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

    // EXPERIMENTAL: Generate appearance for editable field
    // This attempts to match Acrobat's text positioning
    field.generateAppearance({ forceEditable: true })
}

// Set to false since we're providing appearances
acroform.needAppearances = false

await document.acroForm.write(acroform)

await fs.writeFile('./test-force-editable.pdf', document.toBytes())
console.log('✓ Created test-force-editable.pdf')
console.log('  - Text should be visible immediately')
console.log('  - Field should be editable')
console.log('  - No save dialog')
console.log('  - Test if text alignment is acceptable when clicked')
