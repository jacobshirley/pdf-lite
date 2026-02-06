import { PdfDocument } from './packages/pdf-lite/src/pdf/pdf-document.js'
import { PdfAcroFormField } from './packages/pdf-lite/src/acroform/acroform.js'
import { PdfName } from './packages/pdf-lite/src/core/objects/pdf-name.js'
import { PdfString } from './packages/pdf-lite/src/core/objects/pdf-string.js'
import { PdfNumber } from './packages/pdf-lite/src/core/objects/pdf-number.js'
import fs from 'fs/promises'

console.log('Creating test PDF with checkboxes and radio buttons...\n')

const pdfBytes = await fs.readFile(
    './packages/pdf-lite/test/unit/fixtures/template.pdf',
)
const document = await PdfDocument.fromBytes([pdfBytes])
const acroform = await document.acroForm.read()

console.log('CHECKBOXES:\n')

// Checkbox 1: Unchecked
const checkbox1 = new PdfAcroFormField({ form: acroform })
checkbox1.set('FT', new PdfName('Btn'))
checkbox1.name = 'AcceptTerms'
checkbox1.rect = [50, 750, 70, 770]
checkbox1.set('DA', new PdfString('/Helv 12 Tf 0 g'))
checkbox1.checked = false
acroform.fields.push(checkbox1)
console.log('☐ Accept Terms (unchecked)')

// Checkbox 2: Checked
const checkbox2 = new PdfAcroFormField({ form: acroform })
checkbox2.set('FT', new PdfName('Btn'))
checkbox2.name = 'Subscribe'
checkbox2.rect = [50, 700, 70, 720]
checkbox2.set('DA', new PdfString('/Helv 12 Tf 0 g'))
checkbox2.checked = true
acroform.fields.push(checkbox2)
console.log('☑️ Subscribe to Newsletter (checked)')

// Checkbox 3: Checked (larger)
const checkbox3 = new PdfAcroFormField({ form: acroform })
checkbox3.set('FT', new PdfName('Btn'))
checkbox3.name = 'Agree'
checkbox3.rect = [50, 650, 80, 680]
checkbox3.set('DA', new PdfString('/Helv 12 Tf 0 g'))
checkbox3.checked = true
acroform.fields.push(checkbox3)
console.log('☑️ I Agree (checked, larger box)')

console.log('\nRADIO BUTTONS:\n')

// Radio button group - Option 1 (selected)
const radio1 = new PdfAcroFormField({ form: acroform })
radio1.set('FT', new PdfName('Btn'))
radio1.name = 'PaymentMethod_Credit'
radio1.rect = [50, 600, 70, 620]
radio1.set('DA', new PdfString('/Helv 12 Tf 0 g'))
radio1.set('Ff', new PdfNumber(32768)) // Radio button flag (bit 15)
radio1.checked = true
acroform.fields.push(radio1)
console.log('🔘 Credit Card (selected)')

// Radio button group - Option 2 (unselected)
const radio2 = new PdfAcroFormField({ form: acroform })
radio2.set('FT', new PdfName('Btn'))
radio2.name = 'PaymentMethod_PayPal'
radio2.rect = [50, 550, 70, 570]
radio2.set('DA', new PdfString('/Helv 12 Tf 0 g'))
radio2.set('Ff', new PdfNumber(32768))
radio2.checked = false
acroform.fields.push(radio2)
console.log('⚪ PayPal (unselected)')

// Radio button group - Option 3 (unselected)
const radio3 = new PdfAcroFormField({ form: acroform })
radio3.set('FT', new PdfName('Btn'))
radio3.name = 'PaymentMethod_Bank'
radio3.rect = [50, 500, 70, 520]
radio3.set('DA', new PdfString('/Helv 12 Tf 0 g'))
radio3.set('Ff', new PdfNumber(32768))
radio3.checked = false
acroform.fields.push(radio3)
console.log('⚪ Bank Transfer (unselected)')

console.log('\n📝 Generating appearances...')

// Generate appearances for all button fields
for (const field of acroform.fields) {
    if (field.fieldType === 'Btn') {
        const success = field.generateAppearance()
        console.log(`  ${success ? '✓' : '✗'} ${field.name}`)
    }
}

acroform.needAppearances = false
await document.acroForm.write(acroform)
await fs.writeFile('./test-buttons-only.pdf', document.toBytes())

console.log('\n✅ Created test-buttons-only.pdf')
console.log('\nThis PDF shows:')
console.log('  • Checkboxes (checked and unchecked)')
console.log('  • Radio buttons (one selected, others unselected)')
console.log('  • All with proper appearance generation!')
