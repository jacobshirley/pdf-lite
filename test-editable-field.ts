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

    // For EDITABLE field: DON'T call generateAppearance
    // Just set needAppearances to true
}

acroform.needAppearances = true

await document.acroForm.write(acroform)

await fs.writeFile('./test-editable.pdf', document.toBytes())
console.log(
    '✓ Created test-editable.pdf - text should be visible and editable, no overlap!',
)
