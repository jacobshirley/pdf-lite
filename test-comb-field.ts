import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import fs from 'fs/promises'

console.log('Testing comb field appearance...\n')

const pdfBytes = await fs.readFile(
    './packages/pdf-lite/test/unit/fixtures/template.pdf',
)
const document = await PdfDocument.fromBytes([pdfBytes])

const acroform = await document.acroForm.read()

// Fill the regular field
const clientName = acroform.fields.find((f) => f.name === 'Client Name')
if (clientName) {
    clientName.value = 'Test Name'
    console.log('✓ Set Client Name:', clientName.value)
}

// Fill the comb field
const nField = acroform.fields.find((f) => f.name === 'N')
if (nField) {
    nField.value = '123'
    console.log('✓ Set N field:', nField.value)
    console.log('  Is comb field:', nField.comb)
    console.log('  MaxLen:', nField.maxLen)
    console.log('  Should distribute "123" across', nField.maxLen, 'cells')
}

acroform.needAppearances = false

await document.acroForm.write(acroform)

await fs.writeFile('./test-comb-field.pdf', document.toBytes())

console.log('\n✅ Created test-comb-field.pdf')
console.log('Open it to verify:')
console.log('  - Client Name shows "Test Name" normally')
console.log('  - N field shows "1 2 3" with each digit in its own cell')
