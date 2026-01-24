import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
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
        const fieldValues = await document.acroForm.getFieldValues()
        expect(fieldValues).toBeDefined()
        expect(typeof fieldValues).toBe('object')
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
        const originalValues = await document.acroForm.getFieldValues()
        const fieldNames = Object.keys(originalValues ?? {})
        expect(fieldNames.length).toBeGreaterThan(0)

        const valuesToSet: Record<string, string> = {}
        for (let i = 0; i < fieldNames.length; i++) {
            valuesToSet[fieldNames[i]] = `Value ${i + 1}`
        }

        await document.acroForm.setFieldValues(valuesToSet)

        const newDocumentBytes = await document.toBytes()
        const newDocument = await PdfDocument.fromBytes([newDocumentBytes])

        // Read them back to verify
        const updatedValues = (await newDocument.acroForm.getFieldValues())!
        for (const [fieldName, expectedValue] of Object.entries(valuesToSet)) {
            expect(updatedValues[fieldName]).toBe(expectedValue)
        }
    })
})
