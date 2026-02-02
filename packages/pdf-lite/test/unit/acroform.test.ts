import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'
import { PdfString } from '../../src/core/objects/pdf-string'
import { parseFont } from '../../src/fonts/parsers/font-parser'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
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
        const hasAcroForm = await document.acroForm.hasAcroForm()
        expect(hasAcroForm).toBe(true)

        // Read all field values
        const acroform = await document.acroForm.getAcroForm()
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
        const acroform = await document.acroForm.getAcroForm()
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
        const updatedAcroform = await newDocument.acroForm.getAcroForm()
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

        const acroform = await document.acroForm.getAcroForm()
        if (!acroform) {
            throw new Error('No AcroForm found in the document')
        }
        acroform.importData(exoticValues)
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read them back to verify
        const updatedAcroform = await newDocument.acroForm.getAcroForm()
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

        const acroform = await document.acroForm.getAcroForm()
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
        const updatedAcroform = await newDocument.acroForm.getAcroForm()
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

        const acroform = await document.acroForm.getAcroForm()
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
        const updatedAcroform = await newDocument.acroForm.getAcroForm()
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
        const acroform = await document.acroForm.getAcroForm()
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
        expect(textField!.font?.resourceName).toBe(font.resourceName)
        expect(textField!.fontSize).toBe(14)

        // Mark as needing appearance updates
        acroform.needAppearances = true
        await document.acroForm.write(acroform)

        // Serialize and reparse the document
        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Verify the custom font is still embedded and the field uses it
        const updatedAcroform = await newDocument.acroForm.getAcroForm()
        const updatedField = updatedAcroform?.fields.find(
            (f) => f.name === 'Client Name',
        )

        // Verify the field still uses the custom font after reloading
        expect(updatedField?.fontName).toBe(font.resourceName)
        expect(updatedField?.fontSize).toBe(14)
        expect(updatedField?.value).toBe('Testing Custom Helvetica Font')
    })
})
