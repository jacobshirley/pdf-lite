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

describe('XFA', () => {
    it('should be able to read XFA forms as XML', async () => {
        // Load the PDF with XFA form
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        document.setPassword('')

        // Check that document has XFA forms
        const hasXfa = await document.acroForm.xfa.hasXfaForms()
        expect(hasXfa).toBe(true)

        // Read the XFA form data as XML
        const xmlContent = await document.acroForm.xfa.readXml()
        expect(xmlContent).toBeDefined()
        expect(xmlContent).not.toBeNull()

        // Verify it's valid XML with XFA namespace
        expect(xmlContent).toContain('<xfa:datasets')
        expect(xmlContent).toContain(
            'xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/"',
        )
        expect(xmlContent).toContain('<xfa:data')
        expect(xmlContent).toContain('</xfa:data')
        // Note: The closing tag may have whitespace/newlines in the XML formatting
        expect(xmlContent).toMatch(/<\/xfa:datasets\s*>/)
    })

    it('should be able to fill XFA forms', async () => {
        // Load the PDF with XFA form
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        document.setPassword('')

        expect(await document.acroForm.xfa.hasXfaForms()).toBe(true)

        // Read the original XML content
        const originalXml = await document.acroForm.xfa.readXml()
        expect(originalXml).toBeDefined()
        expect(originalXml).not.toBeNull()

        // Parse and verify we can find a field to modify
        // The test PDF contains Polish tax form fields
        expect(originalXml).toContain('COMPANY NAME')
        expect(originalXml).toContain('etd:PelnaNazwa')
        expect(originalXml).toContain('<P_41')

        // Simulate filling a field by modifying the XML
        // Replace the company name in the actual data section (not the schema)
        // The XML has newlines, so we need to account for formatting
        const modifiedXml = originalXml!.replace(
            />COMPANY NAME</,
            '>NEW COMPANY NAME LLC<',
        )

        // Verify the modification
        expect(modifiedXml).toContain('NEW COMPANY NAME LLC')
        expect(modifiedXml).not.toEqual(originalXml)

        // Write the modified XML back to the document
        await document.acroForm.xfa.writeXml(modifiedXml)

        await server.commands.writeFile(
            './test/unit/tmp/modifiedAdobeLivecycle.pdf',
            document.toBase64(),
            { encoding: 'base64' },
        )

        const rereadDocument = await PdfDocument.fromBytes([document.toBytes()])
        rereadDocument.setPassword('')

        // Read it back to verify the changes were applied
        const updatedXml = await rereadDocument.acroForm.xfa.readXml()
        expect(updatedXml).toContain('NEW COMPANY NAME LLC')

        rereadDocument.toString() // Ensure no errors on toString
    })
})
