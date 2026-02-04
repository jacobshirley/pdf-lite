// Example: Fill AcroForm fields with appearance generation
// This demonstrates how to generate appearance streams when filling PDF forms
// to avoid the PDF viewer prompting to save changes

import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })

// For this example, we'll use the form created by 005-modify-acroform.ts
// If you haven't run that example yet, run it first to create the form
const formPath = `${tmpFolder}/form-empty.pdf`

try {
    await fs.access(formPath)
} catch {
    console.error(
        'Form not found. Please run examples/005-modify-acroform.ts first.',
    )
    process.exit(1)
}

// Read the empty form PDF
const emptyFormBytes = await fs.readFile(formPath)
const document = await PdfDocument.fromBytes([emptyFormBytes])

const acroform = await document.acroForm.read()
if (!acroform) {
    throw new Error('No AcroForm found in the document')
}

console.log('Filling form fields with iText-style appearances...\n')

// Fill in the form fields
acroform.importData({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543',
    subscribe: 'Yes',
})

// Generate appearances using iText's approach (empty marked content)
// This provides the best of all worlds: visible, editable, no save dialog, no overlap
for (const field of acroform.fields) {
    if (field.fieldType === 'Tx' && field.value) {
        // Generate empty appearance - viewer will render the text
        field.generateAppearance()
        console.log(
            `✓ Generated appearance for field: ${field.name} = "${field.value}"`,
        )
    }
}

// Set to false since we're providing appearances
acroform.needAppearances = false
console.log('\n✓ Set needAppearances = false')

// Write the form - this automatically creates the appearance indirect objects
await document.acroForm.write(acroform)

// Save the filled form with appearances
const outputPath = `${tmpFolder}/form-with-appearances.pdf`
await fs.writeFile(outputPath, document.toBytes())
console.log(`\n✓ Saved to: ${outputPath}`)

console.log('\n\nResult: The PDF will open without asking to save changes!')
console.log(
    'When you open the PDF, the form fields will display correctly without',
)
console.log('the viewer having to generate appearances on the fly.')
