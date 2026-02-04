import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'
import { PdfString } from '../../src/core/objects/pdf-string'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfAcroFormField } from '../../src/acroform/acroform'
import { PdfObjectReference } from '../../src/core/objects/pdf-object-reference'
import { PdfDictionary, PdfNumber } from '../../src'
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
        textField!.set('DA', new PdfString('/Helv 12 Tf 0 g'))

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
        textField!.set('DA', new PdfString('/Helv 12 Tf 0 g'))

        // Verify original font name
        expect(textField!.fontName).toBe('Helv')

        // Change the font name
        textField!.fontName = 'Times'

        // Verify DA string is correct after change
        const daAfterChange = textField!.get('DA')?.as(PdfString)?.value
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
        const pages = document.rootDictionary?.get('Pages')
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

        // Create a new field using PdfAcroFormField with visual properties
        const newField = new PdfAcroFormField()
        newField.fieldType = 'Tx' // Text field
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
        const rect = addedField!.get('Rect')?.as(PdfArray<PdfNumber>)
        expect(rect).toBeDefined()
        expect(rect!.items[0].value).toBe(50)
        expect(rect!.items[1].value).toBe(50)
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

        const { PdfAcroForm } = await import('../../src/acroform/acroform')

        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set('Helv', new PdfObjectReference(1, 0))
        drDict.set('Font', fontDict)

        const acroFormDict = new PdfDictionary()
        acroFormDict.set('DR', drDict)

        const acroForm = new PdfAcroForm({
            dict: acroFormDict,
            document: mockDocument,
        })

        const field = new PdfAcroFormField({ form: acroForm })
        field.set('T', new PdfString('PriceField'))
        field.set('DA', new PdfString('/Helv 12 Tf'))
        field.set('V', new PdfString(new Uint8Array([160, 53, 48]))) // Euro + "50"

        acroForm.fields.push(field)
        await acroForm.getFontEncodingMap('Helv')

        expect(field.value).toBe('€50')
    })

    it('should decode UTF-16BE encoded field values correctly', async () => {
        const { PdfAcroForm } = await import('../../src/acroform/acroform')

        const acroForm = new PdfAcroForm({
            dict: new PdfDictionary(),
        })

        const field = new PdfAcroFormField({ form: acroForm })
        field.set('T', new PdfString('TextField'))

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
        field.set('V', new PdfString(utf16Bytes))

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

        const { PdfAcroForm } = await import('../../src/acroform/acroform')

        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set('Helv', new PdfObjectReference(1, 0))
        drDict.set('Font', fontDict)

        const acroFormDict = new PdfDictionary()
        acroFormDict.set('DR', drDict)

        const acroForm = new PdfAcroForm({
            dict: acroFormDict,
            document: mockDocument,
        })

        await acroForm.getFontEncodingMap('Helv')

        const field = new PdfAcroFormField({ form: acroForm })
        field.set('DA', new PdfString('/Helv 12 Tf'))
        field.set(
            'V',
            new PdfString(
                new Uint8Array([
                    0xfe, 0xff, 0x00, 0x54, 0x00, 0x65, 0x00, 0x78, 0x00, 0x74,
                ]),
            ),
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

        const { PdfAcroForm } = await import('../../src/acroform/acroform')

        const drDict = new PdfDictionary()
        const fontDict = new PdfDictionary()
        fontDict.set('Helv', new PdfObjectReference(1, 0))
        drDict.set('Font', fontDict)

        const acroFormDict = new PdfDictionary()
        acroFormDict.set('DR', drDict)

        const acroForm = new PdfAcroForm({
            dict: acroFormDict,
            document: mockDocument,
        })

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

        // Generate appearance for editable field (iText approach)
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

        // Appearance stream should contain marked content and text (iText format)
        const readOnlyStreamContent = appearance!.rawAsString
        expect(readOnlyStreamContent).toContain('/Tx BMC') // marked content start
        expect(readOnlyStreamContent).toContain('EMC') // marked content end
        expect(readOnlyStreamContent).toContain('BT') // text block
        expect(readOnlyStreamContent).toContain('ET')
        expect(readOnlyStreamContent).toContain('(Test Value) Tj') // text content
        expect(readOnlyStreamContent).toContain('Td') // text position operator
    })

    it.only('should automatically write appearance when form is saved', async () => {
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

        console.log(acroform.exportData())

        const textField = acroform.fields.find((f) => f.name === 'Client Name')
        expect(textField).toBeDefined()

        textField!.value = 'Test Value Here'

        const numberField = acroform.fields.find((f) => f.name === 'N')
        expect(numberField).toBeDefined()

        numberField!.value = '123'

        // Field should remain editable
        expect(textField!.readOnly).toBe(false)

        // Write the form - this should automatically create the appearance indirect object
        await document.acroForm.write(acroform)

        // Check that the appearance was set
        const apDict = textField!.get('AP')?.as(PdfDictionary)
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
            'Client Name': 'Jane Doe',
            N: '9876543210',
        }

        acroform.importData(valuesToSet)

        // Generate empty appearances for editable text fields (iText approach)
        for (const field of acroform.fields) {
            if (field.fieldType === 'Tx' && field.value && field.rect) {
                field.generateAppearance()
            }
        }

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

            const apDict = field?.get('AP')?.as(PdfDictionary)
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

    it('should return false for non-text field types', async () => {
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

        const buttonField = new PdfAcroFormField()
        buttonField.fieldType = 'Btn'
        buttonField.rect = [100, 100, 150, 120]

        const success = buttonField.generateAppearance()
        expect(success).toBe(false)
    })

    it('should return false when field has no rectangle', async () => {
        const textField = new PdfAcroFormField()
        textField.fieldType = 'Tx'
        textField.set('DA', new PdfString('/Helv 12 Tf 0 g'))
        textField.value = 'Test'

        const success = textField.generateAppearance()
        expect(success).toBe(false)
    })

    it('should return false when field has no default appearance', async () => {
        const textField = new PdfAcroFormField()
        textField.fieldType = 'Tx'
        textField.rect = [100, 100, 300, 120]
        textField.value = 'Test'

        const success = textField.generateAppearance()
        expect(success).toBe(false)
    })
})
