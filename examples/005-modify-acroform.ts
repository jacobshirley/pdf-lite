// Modifying AcroForms example - Creating and filling PDF form fields

import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfBoolean } from 'pdf-lite/core/objects/pdf-boolean'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import fs from 'fs/promises'

const tmpFolder = `${import.meta.dirname}/tmp`
await fs.mkdir(tmpFolder, { recursive: true })

// Helper function to create a basic page
function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

// Helper function to create pages collection
function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

// Helper function to create catalog
function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

// Helper function to create font
function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

// Helper function to create resources
function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

// Helper function to create a text field widget annotation
function createTextField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    defaultValue: string = '',
): PdfIndirectObject<PdfDictionary> {
    const fieldDict = new PdfDictionary()
    // Annotation properties
    fieldDict.set('Type', new PdfName('Annot'))
    fieldDict.set('Subtype', new PdfName('Widget'))
    // Field type: Text
    fieldDict.set('FT', new PdfName('Tx'))
    // Field name
    fieldDict.set('T', new PdfString(fieldName))
    // Bounding rectangle [x1, y1, x2, y2]
    fieldDict.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    // Annotation flags (4 = print)
    fieldDict.set('F', new PdfNumber(4))
    // Parent page reference
    fieldDict.set('P', pageRef)
    // Default value (if any)
    if (defaultValue) {
        fieldDict.set('V', new PdfString(defaultValue))
        fieldDict.set('DV', new PdfString(defaultValue))
    }
    // Default appearance string (font and size)
    fieldDict.set('DA', new PdfString('/Helv 12 Tf 0 g'))

    return new PdfIndirectObject({ content: fieldDict })
}

// Helper function to create a checkbox field widget annotation
function createCheckboxField(
    fieldName: string,
    pageRef: PdfObjectReference,
    rect: [number, number, number, number],
    checked: boolean = false,
): PdfIndirectObject<PdfDictionary> {
    const fieldDict = new PdfDictionary()
    // Annotation properties
    fieldDict.set('Type', new PdfName('Annot'))
    fieldDict.set('Subtype', new PdfName('Widget'))
    // Field type: Button
    fieldDict.set('FT', new PdfName('Btn'))
    // Field name
    fieldDict.set('T', new PdfString(fieldName))
    // Bounding rectangle
    fieldDict.set(
        'Rect',
        new PdfArray([
            new PdfNumber(rect[0]),
            new PdfNumber(rect[1]),
            new PdfNumber(rect[2]),
            new PdfNumber(rect[3]),
        ]),
    )
    // Annotation flags (4 = print)
    fieldDict.set('F', new PdfNumber(4))
    // Parent page reference
    fieldDict.set('P', pageRef)
    // Value: /Yes for checked, /Off for unchecked
    fieldDict.set('V', new PdfName(checked ? 'Yes' : 'Off'))
    fieldDict.set('AS', new PdfName(checked ? 'Yes' : 'Off'))

    return new PdfIndirectObject({ content: fieldDict })
}

// ============================================
// PART 1: Create a PDF with form fields
// ============================================

const document = new PdfDocument()

// Create font
const font = createFont()
document.add(font)

// Create resources with the font
const resources = createResources(font.reference)
document.add(resources)

// Create content stream with form labels
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: `BT
/F1 18 Tf 72 720 Td (PDF Form Example) Tj
/F1 12 Tf 0 -40 Td (Name:) Tj
0 -30 Td (Email:) Tj
0 -30 Td (Phone:) Tj
0 -30 Td (Subscribe to newsletter:) Tj
ET`,
    }),
})
document.add(contentStream)

// Create page
const page = createPage(contentStream.reference)
page.content.set('Resources', resources.reference)
document.add(page)

// Create form fields
const nameField = createTextField('name', page.reference, [150, 665, 400, 685])
const emailField = createTextField(
    'email',
    page.reference,
    [150, 635, 400, 655],
)
const phoneField = createTextField(
    'phone',
    page.reference,
    [150, 605, 400, 625],
)
const subscribeField = createCheckboxField(
    'subscribe',
    page.reference,
    [200, 575, 215, 590],
)

document.add(nameField)
document.add(emailField)
document.add(phoneField)
document.add(subscribeField)

// Add annotations to page
page.content.set(
    'Annots',
    new PdfArray([
        nameField.reference,
        emailField.reference,
        phoneField.reference,
        subscribeField.reference,
    ]),
)

// Create pages collection
const pages = createPages([page])
page.content.set('Parent', pages.reference)
document.add(pages)

// Create catalog
const catalog = createCatalog(pages.reference)

// Create AcroForm with all fields
const acroForm = new PdfDictionary()
acroForm.set(
    'Fields',
    new PdfArray([
        nameField.reference,
        emailField.reference,
        phoneField.reference,
        subscribeField.reference,
    ]),
)
// NeedAppearances flag tells PDF readers to generate appearance streams
acroForm.set('NeedAppearances', new PdfBoolean(true))

// Default resources for the form (font)
const formResources = new PdfDictionary()
const formFontDict = new PdfDictionary()
const helveticaFont = new PdfDictionary()
helveticaFont.set('Type', new PdfName('Font'))
helveticaFont.set('Subtype', new PdfName('Type1'))
helveticaFont.set('BaseFont', new PdfName('Helvetica'))
formFontDict.set('Helv', helveticaFont)
formResources.set('Font', formFontDict)
acroForm.set('DR', formResources)

const acroFormObj = new PdfIndirectObject({ content: acroForm })
document.add(acroFormObj)
catalog.content.set('AcroForm', acroFormObj.reference)

document.add(catalog)

// Set the catalog as the root
document.trailerDict.set('Root', catalog.reference)

await document.commit()

// Save the empty form
// This demonstrates creating a blank form that users can fill in
await fs.writeFile(`${tmpFolder}/form-empty.pdf`, document.toBytes())
console.log('Created form-empty.pdf with empty form fields')

// ============================================
// PART 2: Fill in the form fields
// ============================================
// This demonstrates how to programmatically fill in form fields.
// We're continuing to use the same document object here, but in a
// real-world scenario, you would typically:
// 1. Read an existing PDF with PdfDocument.fromBytes()
// 2. Find the form fields in the AcroForm dictionary
// 3. Update the field values
// 4. Save the modified PDF

// Update the name field value
nameField.content.set('V', new PdfString('John Doe'))

// Update the email field value
emailField.content.set('V', new PdfString('john.doe@example.com'))

// Update the phone field value
phoneField.content.set('V', new PdfString('+1 (555) 123-4567'))

// Check the subscribe checkbox
subscribeField.content.set('V', new PdfName('Yes'))
subscribeField.content.set('AS', new PdfName('Yes'))

// Commit the changes
await document.commit()

// Save the filled form
await fs.writeFile(`${tmpFolder}/form-filled.pdf`, document.toBytes())
console.log('Created form-filled.pdf with filled form fields')

console.log('\nForm field values:')
console.log('- Name: John Doe')
console.log('- Email: john.doe@example.com')
console.log('- Phone: +1 (555) 123-4567')
console.log('- Subscribe: Yes')
