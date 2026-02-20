import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'
import { PdfString } from '../../src/core/objects/pdf-string'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfAcroForm } from '../../src/acroform/acroform'
import { PdfTextFormField } from '../../src/acroform/fields/pdf-text-form-field'
import { PdfButtonFormField } from '../../src/acroform/fields/pdf-button-form-field'
import { PdfChoiceFormField } from '../../src/acroform/fields/pdf-choice-form-field'
import { PdfObjectReference } from '../../src/core/objects/pdf-object-reference'
import {
    PdfDictionary,
    PdfNumber,
    PdfIndirectObject,
    PdfStream,
} from '../../src'
import { PdfName } from '../../src/core/objects/pdf-name'
import {
    buildEncodingMap,
    decodeWithFontEncoding,
} from '../../src/utils/decodeWithFontEncoding'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

const bytesToBase64 = (bytes: ByteArray): string => {
    let binary = ''
    const len = bytes.length
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}

async function loadFont(path: string): Promise<ByteArray> {
    const base64 = await server.commands.readFile(path, { encoding: 'base64' })
    return base64ToBytes(base64)
}

describe('AcroForm', () => {
    it('should be able to read AcroForm field values', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])

        // Check that document has AcroForm
        const hasAcroForm = await document.acroForm.exists()
        expect(hasAcroForm).toBe(true)

        // Read all field values
        const acroform = await document.acroForm.read()
        const fieldValues = acroform?.exportData()
        expect(fieldValues).toEqual({
            'Client Name': '',
            N: '1234567890',
            'Onboarding Name': '',
            'Tel  Email': 'test@test.com',
            'as my Intermediary in respect of the Import One Stop Shop IOSS':
                'TEST',
            'date 1': '',
            'date 2': '',
            undefined_2: '123456',
            'with effect from': '',
        })
    })

    it('should be able to set multiple field values at once', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        // Get original field values
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }
        const originalValues = await acroform.exportData()
        const fieldNames = Object.keys(originalValues)
        expect(fieldNames.length).toBeGreaterThan(0)

        const valuesToSet: Record<string, string> = {}
        for (let i = 0; i < fieldNames.length; i++) {
            valuesToSet[fieldNames[i]] = `Value ${i + 1}`
        }

        acroform.importData(valuesToSet)
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read them back to verify
        const updatedAcroform = await newDocument.acroForm.read()
        const updatedValues = updatedAcroform?.exportData()!
        for (const [fieldName, expectedValue] of Object.entries(valuesToSet)) {
            expect(updatedValues[fieldName]).toBe(expectedValue)
        }
    })

    it('should be able to handle exotic character field values', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])

        const exoticValues: Record<string, string> = {
            'Client Name': 'PROSZĘ',
        }

        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }
        acroform.importData(exoticValues)
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read them back to verify
        const updatedAcroform = await newDocument.acroForm.read()
        const updatedValues = updatedAcroform?.exportData()!
        for (const [fieldName, expectedValue] of Object.entries(exoticValues)) {
            expect(updatedValues[fieldName]).toBe(expectedValue)
        }
    })

    it('should be able to change field font properties', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])

        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        // Find a text field to modify
        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        // Set a proper default appearance string first to ensure we have a valid DA
        textField!.defaultAppearance = '/Helv 12 Tf 0 g'

        // Now change the font size
        textField!.fontSize = 20

        textField!.value = 'Test Font Size Change'

        // Verify the fontSize was set correctly before writing
        expect(textField!.fontSize).toBe(20)

        // Mark as needing appearance updates
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read them back to verify font size changed
        const updatedAcroform = await newDocument.acroForm.read()
        const updatedField = updatedAcroform?.fields.find(
            (f) => f.name === 'Client Name',
        )

        // Verify the font size was persisted correctly
        expect(updatedField?.fontSize).toBe(20)
    })

    it('should be able to change field font name', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])

        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        // Find a text field to modify
        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        // Set a proper default appearance string first
        textField!.defaultAppearance = '/Helv 12 Tf 0 g'

        // Verify original font name
        expect(textField!.fontName).toBe('Helv')

        // Change the font name
        textField!.fontName = 'Times'

        // Verify DA string is correct after change
        const daAfterChange = textField!.defaultAppearance
        expect(daAfterChange).toBe('/Times 12 Tf 0 g')

        // Verify the fontName was set correctly before writing
        expect(textField!.fontName).toBe('Times')
        // Verify font size is preserved
        expect(textField!.fontSize).toBe(12)

        // Mark as needing appearance updates
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read them back to verify font name changed
        const updatedAcroform = await newDocument.acroForm.read()
        const updatedField = updatedAcroform?.fields.find(
            (f) => f.name === 'Client Name',
        )

        // Verify the font name was persisted correctly
        expect(updatedField?.fontName).toBe('Times')
        // Verify font size was preserved
        expect(updatedField?.fontSize).toBe(12)
    })

    it('should be able to import a font file and use it in an AcroForm', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])

        // Load and parse the Helvetica TTF font file
        const fontData = await loadFont(
            './test/unit/fixtures/fonts/helvetica.ttf',
        )

        // Embed the custom font using the new embedFromFile API
        const font = await document.fonts.embedFromFile(fontData, {
            fontName: 'Helvetica-Custom',
        })

        // Verify the font was embedded correctly
        expect(font).toBeDefined()
        expect(font.fontName).toBe('Helvetica-Custom')
        expect(font.resourceName).toMatch(/^F\d+$/)
        expect(font.toString()).toBe(font.resourceName)

        // Get the AcroForm and modify a field to use the custom font
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        // Find a text field to modify
        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        // Set the field to use the custom imported font using the new .font property
        textField!.font = font
        textField!.fontSize = 14
        textField!.value = 'Testing Custom Helvetica Font'

        // Verify the field is using the custom font
        expect(textField!.fontName).toBe(font.resourceName)
        // Note: font property getter may not be implemented, so we only check fontName
        expect(textField!.fontSize).toBe(14)

        // Mark as needing appearance updates
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        // Serialize and reparse the document
        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Verify the custom font is still embedded and the field uses it
        const updatedAcroform = await newDocument.acroForm.read()
        const updatedField = updatedAcroform?.fields.find(
            (f) => f.name === 'Client Name',
        )

        // Verify the field still uses the custom font after reloading
        expect(updatedField?.fontName).toBe(font.resourceName)
        expect(updatedField?.fontSize).toBe(14)
        expect(updatedField?.value).toBe('Testing Custom Helvetica Font')
    })

    it('should be able to add fields to an existing form', async () => {
        // Load the PDF with AcroForm
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])

        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        // Get initial field count
        const initialFieldCount = acroform.fields.length
        expect(initialFieldCount).toBeGreaterThan(0)

        // Get the first page to place the new field on
        const pages = document.root.content.get('Pages')
        expect(pages).toBeDefined()

        const pagesRef = pages instanceof PdfObjectReference ? pages : null
        expect(pagesRef).toBeDefined()

        const pagesObj = await document.readObject({
            objectNumber: pagesRef!.objectNumber,
            generationNumber: pagesRef!.generationNumber,
        })

        // Get the Kids array - need to handle the case where it might be a reference
        const kids = pagesObj?.content.as(PdfDictionary).get('Kids')
        let kidsArray: PdfArray<PdfObjectReference>

        if (kids instanceof PdfObjectReference) {
            const kidsObj = await document.readObject({
                objectNumber: kids.objectNumber,
                generationNumber: kids.generationNumber,
            })
            kidsArray = kidsObj!.content as PdfArray<PdfObjectReference>
        } else {
            kidsArray = kids!.as(PdfArray<PdfObjectReference>)
        }

        expect(kidsArray).toBeDefined()
        expect(kidsArray!.items.length).toBeGreaterThan(0)

        const firstPageRef = kidsArray!.items[0]
        const firstPageObj = await document.readObject({
            objectNumber: firstPageRef.objectNumber,
            generationNumber: firstPageRef.generationNumber,
        })
        expect(firstPageObj).toBeDefined()

        // Create a new field using PdfTextFormField with visual properties
        const newField = new PdfTextFormField()
        newField.fieldType = 'Text' // Text field
        newField.name = 'New Test Field'
        newField.value = 'New Field Value'
        newField.defaultValue = 'New Field Value'
        newField.fontName = 'Helv'
        newField.fontSize = 12

        // Set the field's position on the page (x1, y1, x2, y2)
        // Place it at coordinates [50, 50, 300, 70] - lower left of page
        newField.rect = [50, 50, 300, 70]

        // Set the parent page reference
        newField.parentRef = firstPageObj!.reference

        // Set as annotation widget
        newField.isWidget = true

        // Add the new field to the form
        acroform.fields.push(newField)

        // Verify the field was added
        expect(acroform.fields.length).toBe(initialFieldCount + 1)

        // Write the form and save
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read back and verify the new field exists
        const updatedAcroform = await newDocument.acroForm.read()
        expect(updatedAcroform).toBeDefined()
        expect(updatedAcroform!.fields.length).toBe(initialFieldCount + 1)

        // Find the new field by name
        const addedField = updatedAcroform!.fields.find(
            (f) => f.name === 'New Test Field',
        )
        expect(addedField).toBeDefined()
        expect(addedField!.value).toBe('New Field Value')

        // Verify the field has positioning information
        const rect = addedField!.rect!
        expect(rect).toBeDefined()
        expect(rect[0]).toBe(50)
        expect(rect[1]).toBe(50)
    })

    describe('Font Encoding', () => {
        it('should build encoding map from Differences array', () => {
            // Create a Differences array: [160 /Euro 164 /currency]
            const differences = new PdfArray([
                new PdfNumber(160),
                new PdfName('Euro'),
                new PdfNumber(164),
                new PdfName('currency'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            expect(encodingMap?.size).toBe(2)
            expect(encodingMap?.get(160)).toBe('\u20AC') // Euro symbol
            expect(encodingMap?.get(164)).toBe('\u00A4') // Currency symbol
        })

        it('should build encoding map with consecutive glyph names', () => {
            // Create a Differences array: [128 /bullet /dagger /daggerdbl]
            const differences = new PdfArray([
                new PdfNumber(128),
                new PdfName('bullet'),
                new PdfName('dagger'),
                new PdfName('daggerdbl'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            expect(encodingMap?.size).toBe(3)
            expect(encodingMap?.get(128)).toBe('\u2022') // Bullet
            expect(encodingMap?.get(129)).toBe('\u2020') // Dagger
            expect(encodingMap?.get(130)).toBe('\u2021') // Double dagger
        })

        it('should handle unknown glyph names gracefully', () => {
            // Create a Differences array with unknown glyph
            const differences = new PdfArray([
                new PdfNumber(160),
                new PdfName('Euro'),
                new PdfName('UnknownGlyph'),
                new PdfNumber(164),
                new PdfName('currency'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            // Should only have 2 mappings (Euro at 160 and currency at 164)
            // UnknownGlyph at 161 should be skipped
            expect(encodingMap?.size).toBe(2)
            expect(encodingMap?.get(160)).toBe('\u20AC')
            expect(encodingMap?.get(161)).toBeUndefined()
            expect(encodingMap?.get(164)).toBe('\u00A4')
        })

        it('should return null for empty Differences array', () => {
            const differences = new PdfArray([])
            const encodingMap = buildEncodingMap(differences)
            expect(encodingMap).toBeNull()
        })

        it('should decode bytes with custom font encoding', () => {
            // Create encoding map with Euro at byte 160
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro

            // Test string with Euro symbol: byte 160 + "2"
            const bytes = new Uint8Array([160, 50]) // 50 = '2'
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('€2')
        })

        it('should decode bytes without encoding map using PDFDocEncoding', () => {
            // Test with null encoding map (should fall back to PDFDocEncoding)
            const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
            const result = decodeWithFontEncoding(bytes, null)

            expect(result).toBe('Hello')
        })

        it('should fall back to PDFDocEncoding for unmapped bytes', () => {
            // Create encoding map with only Euro
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro

            // Mix of mapped (160) and unmapped bytes (72='H', 101='e')
            const bytes = new Uint8Array([72, 160, 101]) // "H" + Euro + "e"
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('H€e')
        })

        it('should handle special characters from PDFDocEncoding range', () => {
            // Create encoding map with Euro at 160
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC')

            // Byte 0x80 (128) = bullet in PDFDocEncoding
            const bytes = new Uint8Array([128, 160, 50]) // bullet + Euro + "2"
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('•€2') // Bullet + Euro + "2"
        })

        it('should decode multiple currency symbols', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro
            encodingMap.set(164, '\u00A4') // Generic currency
            encodingMap.set(165, '\u00A5') // Yen

            const bytes = new Uint8Array([160, 32, 164, 32, 165]) // Euro + space + currency + space + yen
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('€ ¤ ¥')
        })

        it('should handle accented characters from encoding map', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(200, '\u00C9') // Eacute
            encodingMap.set(201, '\u00E9') // eacute

            const bytes = new Uint8Array([200, 116, 201]) // É + t + é
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('Été')
        })

        it('should handle ligatures from encoding map', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(150, '\uFB01') // fi ligature
            encodingMap.set(151, '\uFB02') // fl ligature

            const bytes = new Uint8Array([150, 110, 100, 151, 121]) // fi + n + d + fl + y
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('ﬁndﬂy')
        })
    })
})

describe('AcroForm Parent/Child Field Inheritance', () => {
    it('should inherit value from parent field', () => {
        // Create parent field with FT, DA, and V
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'
        parentField.content.set('V', new PdfString('Parent Value'))

        // Create child widget (no FT, DA, or V of its own)
        const childField = new PdfTextFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]
        childField.isWidget = true

        // Child should inherit value from parent
        expect(childField.value).toBe('Parent Value')
        // Child should inherit fieldType from parent
        expect(childField.fieldType).toBe('Text')
        // Child should inherit DA from parent
        expect(childField.defaultAppearance).toBe('/Helv 12 Tf 0 g')
    })

    it('should set value on parent when child is updated', () => {
        // Create parent field
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'

        // Create child widget
        const childField = new PdfTextFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]
        childField.isWidget = true

        // Setting value on child should store V on parent
        childField.value = 'New Value'

        expect(parentField.value).toBe('New Value')
        expect(childField.value).toBe('New Value')
    })

    it('should generate appearance for child widget using inherited DA', () => {
        const acroForm = new PdfAcroForm()

        // Create parent field with FT and DA but no Rect
        const parentField = new PdfTextFormField({ form: acroForm })
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'

        // Create child widget with Rect but no FT or DA
        const childField = new PdfTextFormField({ form: acroForm })
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]
        childField.isWidget = true

        childField.value = 'Test'

        const success = childField.generateAppearance()
        expect(success).toBe(true)

        const appearance = childField.getAppearanceStream()
        expect(appearance).toBeDefined()
        expect(appearance!.rawAsString).toContain('(Test) Tj')
    })

    it('should read value back correctly after write with parent/child fields', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        // Set values using importData
        acroform.importData({
            'Client Name': 'Test Client',
            N: '9999',
        })

        await document.acroForm.write(acroform)

        // Read back and verify
        const newDocumentBytes = document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])
        const updatedAcroform = await newDocument.acroForm.read()
        const exportedData = updatedAcroform?.exportData()!

        expect(exportedData['Client Name']).toBe('Test Client')
        expect(exportedData['N']).toBe('9999')
    })

    it('should inherit flags from parent field', () => {
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'
        parentField.multiline = true
        parentField.readOnly = true

        const childField = new PdfTextFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]

        expect(childField.multiline).toBe(true)
        expect(childField.readOnly).toBe(true)
        expect(childField.flags).toBe(parentField.flags)
    })

    it('should inherit fontSize and fontName from parent DA', () => {
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 14 Tf 0 g'

        const childField = new PdfTextFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]

        expect(childField.fontSize).toBe(14)
        expect(childField.fontName).toBe('Helv')
    })

    it('should inherit quadding from parent field', () => {
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'
        parentField.quadding = 1 // centered

        const childField = new PdfTextFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]

        expect(childField.quadding).toBe(1)
    })

    it('should inherit defaultValue from parent field', () => {
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'
        parentField.defaultValue = 'Default'

        const childField = new PdfTextFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]

        expect(childField.defaultValue).toBe('Default')
    })

    it('should inherit options from parent for choice fields', () => {
        const parentField = new PdfChoiceFormField()
        parentField.fieldType = 'Choice'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'
        parentField.options = ['A', 'B', 'C']

        const childField = new PdfChoiceFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 300, 120]

        expect(childField.options).toEqual(['A', 'B', 'C'])
    })

    it('should inherit checked state from parent for button fields', () => {
        const parentField = new PdfButtonFormField()
        parentField.fieldType = 'Button'
        parentField.checked = true

        const childField = new PdfButtonFormField()
        childField.parent = parentField
        childField.rect = [100, 100, 120, 120]

        expect(childField.checked).toBe(true)
    })

    it('should share value across sibling widgets', () => {
        // Create parent field
        const parentField = new PdfTextFormField()
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'

        // Create two child widgets
        const child1 = new PdfTextFormField()
        child1.parent = parentField
        child1.rect = [100, 100, 300, 120]

        const child2 = new PdfTextFormField()
        child2.parent = parentField
        child2.rect = [100, 200, 300, 220]

        // Set value on child1
        child1.value = 'Shared Value'

        // Both children and parent should see the value
        expect(parentField.value).toBe('Shared Value')
        expect(child1.value).toBe('Shared Value')
        expect(child2.value).toBe('Shared Value')
    })

    it('should generate appearances for all sibling widgets when value is set', () => {
        const acroForm = new PdfAcroForm()

        // Create parent field with FT and DA but no Rect
        const parentField = new PdfTextFormField({ form: acroForm })
        parentField.fieldType = 'Text'
        parentField.defaultAppearance = '/Helv 12 Tf 0 g'

        // Create two child widgets
        const child1 = new PdfTextFormField({ form: acroForm })
        child1.parent = parentField
        child1.rect = [100, 100, 300, 120]

        const child2 = new PdfTextFormField({ form: acroForm })
        child2.parent = parentField
        child2.rect = [100, 200, 300, 220]

        // Register fields in the form so children getter works
        acroForm.fields.push(parentField, child1, child2)

        // Verify children are resolved
        expect(parentField.children).toHaveLength(2)

        // Set value on child1 — should trigger appearance on both children
        child1.value = 'Test'

        expect(child1.getAppearanceStream()).toBeDefined()
        expect(child2.getAppearanceStream()).toBeDefined()

        // Both should contain the text
        expect(child1.getAppearanceStream()!.rawAsString).toContain('(Test) Tj')
        expect(child2.getAppearanceStream()!.rawAsString).toContain('(Test) Tj')
    })
})

describe('AcroForm Field Value Decoding with Custom Encoding', () => {
    it('should decode field values with custom Euro encoding', async () => {
        // Create a mock document with font encoding
        const mockDocument = {
            async readObject({ objectNumber }: { objectNumber: number }) {
                if (objectNumber === 1) {
                    const fontDict = new PdfDictionary()
                    fontDict.set('Type', new PdfName('Font'))
                    fontDict.set('BaseFont', new PdfName('Helvetica'))
                    fontDict.set('Encoding', new PdfObjectReference(2, 0))
                    return { content: fontDict } as any
                } else if (objectNumber === 2) {
                    const encodingDict = new PdfDictionary()
                    encodingDict.set('Type', new PdfName('Encoding'))
                    const differences = new PdfArray([
                        new PdfNumber(160),
                        new PdfName('Euro'),
                    ])
                    encodingDict.set('Differences', differences)
                    return { content: encodingDict } as any
                }
                return null
            },
        } as any

        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set('Helv', new PdfObjectReference(1, 0))
        drDict.set('Font', fontDict)

        const acroFormDict = new PdfDictionary()
        acroFormDict.set('DR', drDict)

        const acroForm = new PdfAcroForm({
            document: mockDocument,
        })
        acroForm.defaultResources = drDict

        const field = new PdfTextFormField({ form: acroForm })
        field.name = 'PriceField'
        field.defaultAppearance = '/Helv 12 Tf'
        field.value = '\xA050' // Byte 160 (0xA0) should map to Euro symbol

        acroForm.fields.push(field)
        await acroForm.getFontEncodingMap('Helv')

        expect(field.value).toBe('€50')
    })

    it('should decode UTF-16BE encoded field values correctly', async () => {
        const acroForm = new PdfAcroForm()

        const field = new PdfTextFormField({ form: acroForm })
        field.name = 'UTF16Field'
        field.defaultAppearance = '/Helv 12 Tf'

        const utf16Bytes = new Uint8Array([
            0xfe,
            0xff, // BOM
            0x00,
            0x48, // H
            0x00,
            0x65, // e
            0x00,
            0x6c, // l
            0x00,
            0x6c, // l
            0x00,
            0x6f, // o
        ])
        field.value = new PdfString(utf16Bytes)

        expect(field.value).toBe('Hello')
    })

    it('should prioritize UTF-16BE over custom font encoding', async () => {
        const mockDocument = {
            async readObject({ objectNumber }: { objectNumber: number }) {
                if (objectNumber === 1) {
                    const fontDict = new PdfDictionary()
                    fontDict.set('Encoding', new PdfObjectReference(2, 0))
                    return { content: fontDict } as any
                } else if (objectNumber === 2) {
                    const encodingDict = new PdfDictionary()
                    const differences = new PdfArray([
                        new PdfNumber(160),
                        new PdfName('Euro'),
                    ])
                    encodingDict.set('Differences', differences)
                    return { content: encodingDict } as any
                }
                return null
            },
        } as any

        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set('Helv', new PdfObjectReference(1, 0))
        drDict.set('Font', fontDict)

        const acroFormDict = new PdfDictionary()
        acroFormDict.set('DR', drDict)

        const acroForm = new PdfAcroForm()

        await acroForm.getFontEncodingMap('Helv')

        const field = new PdfTextFormField({ form: acroForm })
        field.defaultAppearance = '/Helv 12 Tf'
        field.value = new PdfString(
            new Uint8Array([
                0xfe, 0xff, 0x00, 0x54, 0x00, 0x65, 0x00, 0x78, 0x00, 0x74,
            ]),
        )

        expect(field.value).toBe('Text')
    })

    it('should cache font encoding maps for performance', async () => {
        const readObjectCalls: number[] = []
        const mockDocument = {
            async readObject({ objectNumber }: { objectNumber: number }) {
                readObjectCalls.push(objectNumber)

                if (objectNumber === 1) {
                    const fontDict = new PdfDictionary()
                    fontDict.set('Encoding', new PdfObjectReference(2, 0))
                    return { content: fontDict } as any
                } else if (objectNumber === 2) {
                    const encodingDict = new PdfDictionary()
                    const differences = new PdfArray([
                        new PdfNumber(160),
                        new PdfName('Euro'),
                    ])
                    encodingDict.set('Differences', differences)
                    return { content: encodingDict } as any
                }
                return null
            },
        } as any

        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set('Helv', new PdfObjectReference(1, 0))
        drDict.set('Font', fontDict)

        const acroFormDict = new PdfDictionary()
        acroFormDict.set('DR', drDict)

        const acroForm = new PdfAcroForm({
            document: mockDocument,
        })
        acroForm.defaultResources = drDict

        await acroForm.getFontEncodingMap('Helv')
        const firstCallCount = readObjectCalls.length

        await acroForm.getFontEncodingMap('Helv')
        const secondCallCount = readObjectCalls.length

        expect(secondCallCount).toBe(firstCallCount)
        expect(acroForm.fontEncodingMaps.has('Helv')).toBe(true)
        expect(acroForm.fontEncodingMaps.get('Helv')?.get(160)).toBe('\u20AC')
    })
})

describe('AcroForm Appearance Generation', () => {
    it('should generate appearance stream for text field', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        // Ensure the field has a rect (should already exist in template)
        const rect = textField!.rect
        expect(rect).toBeDefined()
        expect(rect!.length).toBe(4)

        textField!.value = 'Test Value'

        const successEditable = textField!.generateAppearance()
        expect(successEditable).toBe(true)

        // Appearance should be created with text in marked content
        let appearance = textField!.getAppearanceStream()
        expect(appearance).toBeDefined()
        const streamContent = appearance!.rawAsString
        expect(streamContent).toContain('/Tx BMC')
        expect(streamContent).toContain('EMC')
        expect(streamContent).toContain('BT') // Text rendering included
        expect(streamContent).toContain('(Test Value) Tj')

        // Generate appearance with makeReadOnly: true
        const successReadOnly = textField!.generateAppearance({
            makeReadOnly: true,
        })
        expect(successReadOnly).toBe(true)
        expect(textField!.readOnly).toBe(true) // Field should now be read-only

        // Now appearance should be created for read-only field
        appearance = textField!.getAppearanceStream()
        expect(appearance).toBeDefined()
        expect(appearance!.header.get('Type')?.as(PdfName)?.value).toBe(
            'XObject',
        )
        expect(appearance!.header.get('Subtype')?.as(PdfName)?.value).toBe(
            'Form',
        )

        const bbox = appearance!.header.get('BBox')?.as(PdfArray<PdfNumber>)
        expect(bbox).toBeDefined()
        expect(bbox!.items[0].value).toBe(0)
        expect(bbox!.items[1].value).toBe(0)

        // BBox width and height should match the field's rect dimensions
        const width = rect![2] - rect![0]
        const height = rect![3] - rect![1]
        expect(bbox!.items[2].value).toBe(width)
        expect(bbox!.items[3].value).toBe(height)

        const readOnlyStreamContent = appearance!.rawAsString
        expect(readOnlyStreamContent).toContain('/Tx BMC') // marked content start
        expect(readOnlyStreamContent).toContain('EMC') // marked content end
        expect(readOnlyStreamContent).toContain('BT') // text block
        expect(readOnlyStreamContent).toContain('ET')
        expect(readOnlyStreamContent).toContain('(Test Value) Tj') // text content
        expect(readOnlyStreamContent).toContain('Td') // text position operator
    })

    it('should automatically write appearance when form is saved', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        acroform.importData({
            'Client Name': 'Initial Value',
            N: '456',
        })

        // Write the form - this should automatically create the appearance indirect object
        await document.acroForm.write(acroform)

        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        // Check that the appearance was set
        const apDict = textField!.appearanceStreamDict
        expect(apDict).toBeDefined()

        const normalAppearance = apDict!.get('N')?.as(PdfObjectReference)
        expect(normalAppearance).toBeDefined()
        expect(normalAppearance!.objectNumber).toBeGreaterThan(0)

        await server.commands.writeFile(
            './test/unit/tmp/form-with-auto-appearance.pdf',
            bytesToBase64(document.toBytes()),
            { encoding: 'base64' },
        )
    })

    it('should not prompt to save when appearances are generated', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        const valuesToSet: Record<string, string> = {
            'Client Name': 'Jane Doe PROSZĘ',
            N: '9876543210',
            'date 1': '10012024',
        }

        acroform.importData(valuesToSet)
        acroform.needAppearances = false
        await document.acroForm.write(acroform)

        const newDocumentBytes = document.toBytes()

        await server.commands.writeFile(
            './test/unit/tmp/form-with-appearances.pdf',
            bytesToBase64(newDocumentBytes),
            { encoding: 'base64' },
        )

        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        const updatedAcroform = await newDocument.acroForm.read()
        expect(updatedAcroform).toBeDefined()
        expect(updatedAcroform!.needAppearances).toBe(false)

        for (const [fieldName, expectedValue] of Object.entries(valuesToSet)) {
            const field = updatedAcroform!.fields.find(
                (f) => f.name === fieldName,
            )
            expect(field?.value).toBe(expectedValue)

            const apDict = field?.appearanceStreamDict
            expect(apDict).toBeDefined()
            expect(apDict?.get('N')).toBeDefined()
        }
    })

    it('should escape special characters in field values', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        textField!.value = 'Test (with) special\\characters'

        // Generate appearance with makeReadOnly to verify text escaping
        // (editable fields don't include text in appearance to avoid double-text issue)
        const success = textField!.generateAppearance({ makeReadOnly: true })
        expect(success).toBe(true)

        const appearance = textField!.getAppearanceStream()
        expect(appearance).toBeDefined()

        const streamContent = appearance!.rawAsString
        expect(streamContent).toContain('\\(')
        expect(streamContent).toContain('\\)')
        expect(streamContent).toContain('\\\\')
    })

    it('should generate appearance for button fields', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/template.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }

        const buttonField = new PdfButtonFormField({ form: acroform })
        buttonField.fieldType = 'Button'
        buttonField.rect = [100, 100, 150, 120]
        buttonField.checked = true

        const success = buttonField.generateAppearance()
        expect(success).toBe(true)
        expect(buttonField.getAppearanceStream()).toBeDefined()
    })

    it('should return false when field has no rectangle', async () => {
        const textField = new PdfTextFormField()
        textField.fieldType = 'Text'
        textField.defaultAppearance = '/Helv 12 Tf 0 g'
        textField.value = 'Test'

        const success = textField.generateAppearance()
        expect(success).toBe(false)
    })

    it('should return false when field has no default appearance', async () => {
        const textField = new PdfTextFormField()
        textField.fieldType = 'Text'
        textField.rect = [100, 100, 300, 120]
        textField.value = 'Test'

        const success = textField.generateAppearance()
        expect(success).toBe(false)
    })

    it('should create and fill all field types with appearances', async () => {
        // Helper to create page
        const createPage = (
            contentStreamRef: PdfObjectReference,
            fontRef: PdfObjectReference,
        ): PdfIndirectObject<PdfDictionary> => {
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

            // Add Resources dictionary with font
            const resourcesDict = new PdfDictionary()
            const fontDict = new PdfDictionary()
            fontDict.set('Helv', fontRef)
            resourcesDict.set('Font', fontDict)
            pageDict.set('Resources', resourcesDict)

            return new PdfIndirectObject({ content: pageDict })
        }

        // Helper to create pages collection
        const createPages = (
            pages: PdfIndirectObject<PdfDictionary>[],
        ): PdfIndirectObject<PdfDictionary> => {
            const pagesDict = new PdfDictionary()
            pagesDict.set('Type', new PdfName('Pages'))
            pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
            pagesDict.set('Count', new PdfNumber(pages.length))
            return new PdfIndirectObject({ content: pagesDict })
        }

        // Helper to create catalog
        const createCatalog = (
            pagesRef: PdfObjectReference,
        ): PdfIndirectObject<PdfDictionary> => {
            const catalogDict = new PdfDictionary()
            catalogDict.set('Type', new PdfName('Catalog'))
            catalogDict.set('Pages', pagesRef)
            return new PdfIndirectObject({ content: catalogDict })
        }

        // ============================================
        // PART 1: Create PDF with empty AcroForm
        // ============================================
        const document = new PdfDocument()

        // Create font
        const font = new PdfIndirectObject({
            content: (() => {
                const fontDict = new PdfDictionary()
                fontDict.set('Type', new PdfName('Font'))
                fontDict.set('Subtype', new PdfName('Type1'))
                fontDict.set('BaseFont', new PdfName('Helvetica'))
                return fontDict
            })(),
        })
        document.add(font)

        // Create empty content stream
        const contentStream = new PdfIndirectObject({
            content: new PdfStream({
                header: new PdfDictionary(),
                original: '',
            }),
        })
        document.add(contentStream)

        // Create page
        const page = createPage(contentStream.reference, font.reference)
        document.add(page)

        // Create pages collection
        const pages = createPages([page])
        page.content.set('Parent', pages.reference)
        document.add(pages)

        // Create catalog
        const catalog = createCatalog(pages.reference)

        // Create AcroForm
        const acroForm = new PdfDictionary()
        acroForm.set('Fields', new PdfArray([]))

        // Default resources for the form (font)
        const formResources = new PdfDictionary()
        const formFontDict = new PdfDictionary()
        const helveticaFont = new PdfDictionary()
        helveticaFont.set('Type', new PdfName('Font'))
        helveticaFont.set('Subtype', new PdfName('Type1'))
        helveticaFont.set('BaseFont', new PdfName('Helvetica'))
        const helveticaFontObj = new PdfIndirectObject({
            content: helveticaFont,
        })
        document.add(helveticaFontObj)
        formFontDict.set('Helv', helveticaFontObj.reference)
        formResources.set('Font', formFontDict)
        acroForm.set('DR', formResources)
        acroForm.set('DA', new PdfString('/Helv 12 Tf 0 g'))

        const acroFormObj = new PdfIndirectObject({ content: acroForm })
        document.add(acroFormObj)
        catalog.content.set('AcroForm', acroFormObj.reference)

        document.add(catalog)
        document.trailerDict.set('Root', catalog.reference)

        // Commit the basic structure first
        await document.commit()

        const acroform = await document.acroForm.read()
        if (!acroform) {
            throw new Error('No AcroForm found')
        }

        // Get page reference from the loaded document
        const catalogRef = document.trailerDict.get(
            'Root',
        ) as PdfObjectReference
        const catalogObj = await document.readObject({
            objectNumber: catalogRef.objectNumber,
            generationNumber: catalogRef.generationNumber,
        })
        const catalogDict = catalogObj!.content.as(PdfDictionary)
        const pagesRef = catalogDict.get('Pages') as PdfObjectReference
        const pagesObj = await document.readObject({
            objectNumber: pagesRef.objectNumber,
            generationNumber: pagesRef.generationNumber,
        })
        const pagesDict = pagesObj!.content.as(PdfDictionary)
        const kidsArray = pagesDict
            .get('Kids')!
            .as(PdfArray<PdfObjectReference>)
        const firstPageRef = kidsArray.items[0]

        // 1. Regular text field
        const textField = new PdfTextFormField({ form: acroform })
        textField.fieldType = 'Text'
        textField.name = 'RegularText'
        textField.rect = [50, 750, 300, 770]
        textField.defaultAppearance = '/Helv 12 Tf 0 g'
        textField.isWidget = true
        textField.parentRef = firstPageRef
        textField.value = 'Regular Text Value'
        acroform.fields.push(textField)

        // 2. Comb field
        const combField = new PdfTextFormField({ form: acroform })
        combField.fieldType = 'Text'
        combField.name = 'CombField'
        combField.rect = [50, 700, 250, 720]
        combField.defaultAppearance = '/Helv 12 Tf 0 g'
        combField.combField = true
        combField.maxLen = 8
        combField.isWidget = true
        combField.parentRef = firstPageRef
        combField.value = '12345678'
        acroform.fields.push(combField)

        // 3. Multiline text field
        const multilineField = new PdfTextFormField({ form: acroform })
        multilineField.fieldType = 'Text'
        multilineField.name = 'MultilineText'
        multilineField.rect = [50, 600, 300, 680]
        multilineField.defaultAppearance = '/Helv 12 Tf 0 g'
        multilineField.multiline = true
        multilineField.isWidget = true
        multilineField.parentRef = firstPageRef
        multilineField.value = 'Line 1\nLine 2\nLine 3'
        acroform.fields.push(multilineField)

        // 4. Checkbox (unchecked)
        const checkboxUnchecked = new PdfButtonFormField({ form: acroform })
        checkboxUnchecked.fieldType = 'Button'
        checkboxUnchecked.name = 'CheckboxUnchecked'
        checkboxUnchecked.rect = [50, 550, 70, 570]
        checkboxUnchecked.defaultAppearance = '/Helv 12 Tf 0 g'
        checkboxUnchecked.isWidget = true
        checkboxUnchecked.parentRef = firstPageRef
        checkboxUnchecked.checked = false
        acroform.fields.push(checkboxUnchecked)

        // 5. Checkbox (checked)
        const checkboxChecked = new PdfButtonFormField({ form: acroform })
        checkboxChecked.fieldType = 'Button'
        checkboxChecked.name = 'CheckboxChecked'
        checkboxChecked.rect = [100, 550, 120, 570]
        checkboxChecked.defaultAppearance = '/Helv 12 Tf 0 g'
        checkboxChecked.isWidget = true
        checkboxChecked.parentRef = firstPageRef
        checkboxChecked.checked = true
        acroform.fields.push(checkboxChecked)

        // 6. Choice/Dropdown field
        const choiceField = new PdfChoiceFormField({ form: acroform })
        choiceField.fieldType = 'Choice'
        choiceField.name = 'DropdownField'
        choiceField.rect = [50, 450, 250, 470]
        choiceField.defaultAppearance = '/Helv 11 Tf 0 g'
        choiceField.combo = true // Combo flag = dropdown
        choiceField.options = ['Option 1', 'Selected Option', 'Option 3']
        choiceField.isWidget = true
        choiceField.parentRef = firstPageRef
        choiceField.value = 'Selected Option'
        acroform.fields.push(choiceField)

        // 7. List box (Choice field without Combo flag)
        const listField = new PdfChoiceFormField({ form: acroform })
        listField.fieldType = 'Choice'
        listField.name = 'ListField'
        listField.rect = [50, 350, 250, 430]
        listField.defaultAppearance = '/Helv 11 Tf 0 g'
        // No Combo flag = list box
        listField.options = ['List Item 1', 'List Item 2', 'List Item 3']
        listField.isWidget = true
        listField.parentRef = firstPageRef
        listField.value = 'List Item 2'
        acroform.fields.push(listField)

        // 8. Radio button group
        // Note: In PDF, radio buttons that are mutually exclusive should share the same parent field
        // For now, we'll create them as separate fields but with proper Radio flag
        // TODO: Implement proper parent/child radio button group structure
        const radioButton1 = new PdfButtonFormField({ form: acroform })
        radioButton1.fieldType = 'Button'
        radioButton1.name = 'RadioButton1'
        radioButton1.rect = [50, 300, 70, 320]
        radioButton1.defaultAppearance = '/Helv 12 Tf 0 g'
        radioButton1.radio = true
        radioButton1.noToggleToOff = true
        radioButton1.isWidget = true
        radioButton1.parentRef = firstPageRef
        radioButton1.checked = false
        acroform.fields.push(radioButton1)

        // 9. Radio button group (selected)
        const radioButton2 = new PdfButtonFormField({ form: acroform })
        radioButton2.fieldType = 'Button'
        radioButton2.name = 'RadioButton2'
        radioButton2.rect = [100, 300, 120, 320]
        radioButton2.defaultAppearance = '/Helv 12 Tf 0 g'
        radioButton2.radio = true
        radioButton2.noToggleToOff = true
        radioButton2.isWidget = true
        radioButton2.parentRef = firstPageRef
        radioButton2.checked = true
        acroform.fields.push(radioButton2)

        // Generate appearances for all fields
        const textSuccess = textField.generateAppearance()
        const combSuccess = combField.generateAppearance()
        const multilineSuccess = multilineField.generateAppearance()
        const checkboxUncheckedSuccess = checkboxUnchecked.generateAppearance()
        const checkboxCheckedSuccess = checkboxChecked.generateAppearance()
        const choiceSuccess = choiceField.generateAppearance()
        const listSuccess = listField.generateAppearance()
        const radio1Success = radioButton1.generateAppearance()
        const radio2Success = radioButton2.generateAppearance()

        // Verify all generated successfully
        expect(textSuccess).toBe(true)
        expect(combSuccess).toBe(true)
        expect(multilineSuccess).toBe(true)
        expect(checkboxUncheckedSuccess).toBe(true)
        expect(checkboxCheckedSuccess).toBe(true)
        expect(choiceSuccess).toBe(true)
        expect(listSuccess).toBe(true)
        expect(radio1Success).toBe(true)
        expect(radio2Success).toBe(true)

        // Verify appearance streams exist
        expect(textField.getAppearanceStream()).toBeDefined()
        expect(combField.getAppearanceStream()).toBeDefined()
        expect(multilineField.getAppearanceStream()).toBeDefined()
        expect(checkboxUnchecked.getAppearanceStream()).toBeDefined()
        expect(checkboxChecked.getAppearanceStream()).toBeDefined()
        expect(choiceField.getAppearanceStream()).toBeDefined()
        expect(listField.getAppearanceStream()).toBeDefined()
        expect(radioButton1.getAppearanceStream()).toBeDefined()
        expect(radioButton2.getAppearanceStream()).toBeDefined()

        // Verify appearance content
        const checkboxStream =
            checkboxChecked.getAppearanceStream()!.rawAsString
        expect(checkboxStream).toContain('ZaDb') // ZapfDingbats font for checkmark

        const multilineStream =
            multilineField.getAppearanceStream()!.rawAsString
        expect(multilineStream).toContain('Line 1')
        expect(multilineStream).toContain('Line 2')

        // Verify radio button appearance (selected one should have filled circle)
        const radioStream = radioButton2.getAppearanceStream()!.rawAsString
        expect(radioStream.length).toBeGreaterThan(0) // Should have content for selected state

        await server.commands.writeFile(
            './test/unit/tmp/all-field-types-v1.pdf',
            bytesToBase64(document.toBytes()),
            { encoding: 'base64' },
        )

        acroform.needAppearances = false
        await document.acroForm.write(acroform)

        // Save to file
        await server.commands.writeFile(
            './test/unit/tmp/all-field-types-v2.pdf',
            bytesToBase64(document.toBytes()),
            { encoding: 'base64' },
        )
    })
})

describe('AcroForm Field DA Inheritance from Form Level', () => {
    it('should return form-level DA when field has no own DA', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'

        const field = new PdfTextFormField({ form: acroForm })
        // No DA set on field

        expect(field.defaultAppearance).toBe('/Helv 12 Tf 0 g')
    })

    it('should prefer field-level DA over form-level DA', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'

        const field = new PdfTextFormField({ form: acroForm })
        field.defaultAppearance = '/Cour 10 Tf 0 g'

        expect(field.defaultAppearance).toBe('/Cour 10 Tf 0 g')
    })

    it('should prefer parent-level DA over form-level DA', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'

        const parent = new PdfTextFormField({ form: acroForm })
        parent.defaultAppearance = '/Cour 10 Tf 0 g'

        const child = new PdfTextFormField({ form: acroForm })
        child.parent = parent
        // No DA on child

        expect(child.defaultAppearance).toBe('/Cour 10 Tf 0 g')
    })

    it('should return null when no DA at any level', () => {
        const acroForm = new PdfAcroForm()
        // No defaultAppearance on form

        const field = new PdfTextFormField({ form: acroForm })
        // No DA on field

        expect(field.defaultAppearance).toBeNull()
    })

    it('should generate text field appearance using form-level DA fallback', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'

        const field = new PdfTextFormField({ form: acroForm })
        field.rect = [100, 100, 300, 120]
        field.fieldType = 'Text'
        field.value = 'Test'
        // No DA on field — relies on form-level DA

        expect(field.generateAppearance()).toBe(true)
        expect(field.getAppearanceStream()).toBeDefined()
        expect(field.getAppearanceStream()!.rawAsString).toContain('(Test) Tj')
    })

    it('should generate choice field appearance using form-level DA fallback', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'

        const field = new PdfChoiceFormField({ form: acroForm })
        field.rect = [100, 100, 300, 120]
        field.fieldType = 'Choice'
        field.combo = true
        field.options = ['Option A', 'Option B']
        field.value = 'Option A'
        // No DA on field — relies on form-level DA

        expect(field.generateAppearance()).toBe(true)
        expect(field.getAppearanceStream()).toBeDefined()
        expect(field.getAppearanceStream()!.rawAsString).toContain(
            '(Option A) Tj',
        )
    })
})

describe('AcroForm Appearance Stream Font Resources', () => {
    function makeDrFontDict(): PdfDictionary {
        const helvFont = new PdfDictionary()
        helvFont.set('Type', new PdfName('Font'))
        helvFont.set('Subtype', new PdfName('Type1'))
        helvFont.set('BaseFont', new PdfName('Helvetica'))

        const drFontDict = new PdfDictionary()
        drFontDict.set('Helv', helvFont)

        const dr = new PdfDictionary()
        dr.set('Font', drFontDict)
        return dr
    }

    it('should embed DR Font in text field appearance XObject Resources', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'
        acroForm.defaultResources = makeDrFontDict()

        const field = new PdfTextFormField({ form: acroForm })
        field.rect = [100, 100, 300, 120]
        field.fieldType = 'Text'
        field.value = 'Test'

        field.generateAppearance()

        const stream = field.getAppearanceStream()
        expect(stream).toBeDefined()

        const resources = stream!.header.get('Resources')?.as(PdfDictionary)
        expect(resources).toBeDefined()

        const fontDict = resources!.get('Font')?.as(PdfDictionary)
        expect(fontDict).toBeDefined()
        expect(fontDict!.get('Helv')).toBeDefined()
    })

    it('should embed DR Font in choice field appearance XObject Resources', () => {
        const acroForm = new PdfAcroForm()
        acroForm.defaultAppearance = '/Helv 12 Tf 0 g'
        acroForm.defaultResources = makeDrFontDict()

        const field = new PdfChoiceFormField({ form: acroForm })
        field.rect = [100, 100, 300, 120]
        field.fieldType = 'Choice'
        field.combo = true
        field.options = ['Option A', 'Option B']
        field.value = 'Option A'

        field.generateAppearance()

        const stream = field.getAppearanceStream()
        expect(stream).toBeDefined()

        const resources = stream!.header.get('Resources')?.as(PdfDictionary)
        expect(resources).toBeDefined()

        const fontDict = resources!.get('Font')?.as(PdfDictionary)
        expect(fontDict).toBeDefined()
        expect(fontDict!.get('Helv')).toBeDefined()
    })

    it('should generate appearance without Resources when no DR is set', () => {
        const field = new PdfTextFormField()
        field.rect = [100, 100, 300, 120]
        field.defaultAppearance = '/Helv 12 Tf 0 g'
        field.value = 'Test'

        expect(field.generateAppearance()).toBe(true)

        const stream = field.getAppearanceStream()
        expect(stream).toBeDefined()
        // No Resources in XObject is valid — viewer falls back to page resources
        expect(stream!.header.get('Resources')).toBeUndefined()
    })

    it('should always embed ZapfDingbats in button field appearance XObject', () => {
        const field = new PdfButtonFormField()
        field.rect = [100, 100, 120, 120]
        field.fieldType = 'Button'
        field.checked = true

        field.generateAppearance()

        const stream = field.getAppearanceStream()
        expect(stream).toBeDefined()

        const resources = stream!.header.get('Resources')?.as(PdfDictionary)
        expect(resources).toBeDefined()

        const fontDict = resources!.get('Font')?.as(PdfDictionary)
        expect(fontDict).toBeDefined()
        expect(fontDict!.get('ZaDb')).toBeDefined()
    })
})
