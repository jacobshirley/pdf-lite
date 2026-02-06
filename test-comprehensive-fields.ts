import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import { PdfAcroFormField } from './packages/pdf-lite/src/acroform/acroform.js'
import { PdfName } from './packages/pdf-lite/src/core/objects/pdf-name.js'
import { PdfString } from './packages/pdf-lite/src/core/objects/pdf-string.js'
import { PdfNumber } from './packages/pdf-lite/src/core/objects/pdf-number.js'
import fs from 'fs/promises'

console.log('Creating comprehensive test PDF...\n')

const pdfBytes = await fs.readFile(
    './packages/pdf-lite/test/unit/fixtures/template.pdf',
)
const document = await PdfDocument.fromBytes([pdfBytes])
const acroform = await document.acroForm.read()

console.log('Setting up all field types:\n')

// 1. Regular text field
const textField = acroform.fields.find((f) => f.name === 'Client Name')
if (textField) {
    textField.value = 'John Doe'
    console.log('✓ Regular text: "John Doe"')
}

// 2. Comb field (digits in cells)
const combField = acroform.fields.find((f) => f.name === 'N')
if (combField) {
    combField.value = '12345'
    console.log('✓ Comb field: "12345"')
}

// 3. Multiline text field
const multilineField = new PdfAcroFormField({ form: acroform })
multilineField.set('FT', new PdfName('Tx'))
multilineField.name = 'MultilineText'
multilineField.rect = [50, 500, 300, 580]
multilineField.set('DA', new PdfString('/Helv 10 Tf 0 g'))
multilineField.set('Ff', new PdfNumber(4096)) // Multiline flag
multilineField.value = 'Line 1\nLine 2\nLine 3'
acroform.fields.push(multilineField)
console.log('✓ Multiline text: 3 lines')

// 4. Checkbox (unchecked)
const checkbox1 = new PdfAcroFormField({ form: acroform })
checkbox1.set('FT', new PdfName('Btn'))
checkbox1.name = 'Checkbox1'
checkbox1.rect = [50, 450, 70, 470]
checkbox1.set('DA', new PdfString('/Helv 12 Tf 0 g'))
checkbox1.checked = false
acroform.fields.push(checkbox1)
console.log('✓ Checkbox (unchecked)')

// 5. Checkbox (checked)
const checkbox2 = new PdfAcroFormField({ form: acroform })
checkbox2.set('FT', new PdfName('Btn'))
checkbox2.name = 'Checkbox2'
checkbox2.rect = [100, 450, 120, 470]
checkbox2.set('DA', new PdfString('/Helv 12 Tf 0 g'))
checkbox2.checked = true
acroform.fields.push(checkbox2)
console.log('✓ Checkbox (checked)')

// 6. Radio button (selected)
const radio1 = new PdfAcroFormField({ form: acroform })
radio1.set('FT', new PdfName('Btn'))
radio1.name = 'Radio1'
radio1.rect = [50, 400, 70, 420]
radio1.set('DA', new PdfString('/Helv 12 Tf 0 g'))
radio1.set('Ff', new PdfNumber(32768)) // Radio flag
radio1.checked = true
acroform.fields.push(radio1)
console.log('✓ Radio button (selected)')

// 7. Radio button (unselected)
const radio2 = new PdfAcroFormField({ form: acroform })
radio2.set('FT', new PdfName('Btn'))
radio2.name = 'Radio2'
radio2.rect = [100, 400, 120, 420]
radio2.set('DA', new PdfString('/Helv 12 Tf 0 g'))
radio2.set('Ff', new PdfNumber(32768))
radio2.checked = false
acroform.fields.push(radio2)
console.log('✓ Radio button (unselected)')

// 8. Dropdown/Choice field
const dropdown = new PdfAcroFormField({ form: acroform })
dropdown.set('FT', new PdfName('Ch'))
dropdown.name = 'Dropdown'
dropdown.rect = [50, 350, 200, 370]
dropdown.set('DA', new PdfString('/Helv 11 Tf 0 g'))
dropdown.value = 'Option A'
acroform.fields.push(dropdown)
console.log('✓ Dropdown: "Option A"')

// Generate appearances
console.log('\n📝 Generating appearances for all fields...')
for (const field of acroform.fields) {
    field.generateAppearance()
}

acroform.needAppearances = false
await document.acroForm.write(acroform)
await fs.writeFile('./test-comprehensive-fields.pdf', document.toBytes())

console.log('\n✅ Created test-comprehensive-fields.pdf')
console.log('\n📋 Field types demonstrated:')
console.log('   1. ✏️  Regular text field')
console.log('   2. 🔢 Comb field (digits in cells)')
console.log('   3. 📝 Multiline text field')
console.log('   4. ☐  Checkbox (unchecked)')
console.log('   5. ☑️  Checkbox (checked)')
console.log('   6. 🔘 Radio button (selected)')
console.log('   7. ⚪ Radio button (unselected)')
console.log('   8. 📋 Dropdown field')
console.log('\nAll with iText-style appearance generation!')
