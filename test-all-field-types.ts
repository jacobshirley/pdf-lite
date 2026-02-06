import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import { PdfAcroFormField } from './packages/pdf-lite/src/acroform/acroform.js'
import { PdfName } from './packages/pdf-lite/src/core/objects/pdf-name.js'
import { PdfString } from './packages/pdf-lite/src/core/objects/pdf-string.js'
import { PdfNumber } from './packages/pdf-lite/src/core/objects/pdf-number.js'
import { PdfDictionary } from './packages/pdf-lite/src/core/objects/pdf-dictionary.js'
import fs from 'fs/promises'

console.log('Creating comprehensive test PDF with all field types...\n')

// Start with the template PDF
const pdfBytes = await fs.readFile(
    './packages/pdf-lite/test/unit/fixtures/template.pdf',
)
const document = await PdfDocument.fromBytes([pdfBytes])

const acroform = await document.acroForm.read()

// 1. TEXT FIELD - Regular
const textField = acroform.fields.find((f) => f.name === 'Client Name')
if (textField) {
    textField.value = 'John Doe'
    console.log('✓ Text field: "John Doe"')
}

// 2. TEXT FIELD - Comb
const combField = acroform.fields.find((f) => f.name === 'N')
if (combField) {
    combField.value = '12345'
    console.log('✓ Comb field: "12345" (distributed across cells)')
}

// 3. CHECKBOX - Let's create one or find if exists
// Look for a button field
let checkboxField = acroform.fields.find(
    (f) => f.fieldType === 'Btn' && !((f.flags & 32768) !== 0),
)
if (!checkboxField) {
    // Create a new checkbox field for demonstration
    checkboxField = new PdfAcroFormField({ form: acroform })
    checkboxField.set('FT', new PdfName('Btn'))
    checkboxField.name = 'TestCheckbox'
    checkboxField.rect = [50, 700, 70, 720]
    checkboxField.set('DA', new PdfString('/Helv 12 Tf 0 g'))
    acroform.fields.push(checkboxField)
}
checkboxField.checked = true
console.log('✓ Checkbox: checked')

// 4. RADIO BUTTON - Create if doesn't exist
let radioField = acroform.fields.find(
    (f) => f.fieldType === 'Btn' && (f.flags & 32768) !== 0,
)
if (!radioField) {
    radioField = new PdfAcroFormField({ form: acroform })
    radioField.set('FT', new PdfName('Btn'))
    radioField.name = 'TestRadio'
    radioField.rect = [50, 650, 70, 670]
    radioField.set('DA', new PdfString('/Helv 12 Tf 0 g'))
    radioField.set('Ff', new PdfNumber(32768)) // Radio flag
    acroform.fields.push(radioField)
}
radioField.checked = true
console.log('✓ Radio button: selected')

// 5. CHOICE FIELD (Dropdown) - Create if doesn't exist
let choiceField = acroform.fields.find((f) => f.fieldType === 'Ch')
if (!choiceField) {
    choiceField = new PdfAcroFormField({ form: acroform })
    choiceField.set('FT', new PdfName('Ch'))
    choiceField.name = 'TestDropdown'
    choiceField.rect = [50, 600, 200, 620]
    choiceField.set('DA', new PdfString('/Helv 12 Tf 0 g'))
    acroform.fields.push(choiceField)
}
choiceField.value = 'Option 1'
console.log('✓ Dropdown: "Option 1"')

// Generate appearances for all fields
console.log('\nGenerating appearances...')
let successCount = 0
for (const field of acroform.fields) {
    if (field.value || field.checked) {
        const success = field.generateAppearance()
        if (success) {
            successCount++
            console.log(`  ✓ ${field.name} (${field.fieldType})`)
        }
    }
}

console.log(`\nGenerated ${successCount} appearances`)

acroform.needAppearances = false

await document.acroForm.write(acroform)
await fs.writeFile('./test-all-field-types.pdf', document.toBytes())

console.log('\n✅ Created test-all-field-types.pdf')
console.log('\nThis PDF demonstrates:')
console.log('  1. Regular text field with value')
console.log('  2. Comb field with digits distributed')
console.log('  3. Checked checkbox')
console.log('  4. Selected radio button')
console.log('  5. Dropdown with selected value')
console.log('\nAll with proper appearance generation!')
