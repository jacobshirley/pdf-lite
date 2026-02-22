import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'
import { PdfXfaTemplate } from '../../src/acroform/xfa/xfa-template'
import { XfaToAcroFormConverter } from '../../src/acroform/xfa/xfa-to-acroform'

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
        const xfaForm = await document.acroForm.getXfa()
        expect(xfaForm).not.toBeNull()
        expect(xfaForm!.datasets).not.toBeNull()

        // Read the XFA form data as XML
        const xmlContent = xfaForm!.datasets!.readXml()
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

        const acroform = await document.acroForm.read()
        const xfaForm = await document.acroForm.getXfa()
        expect(xfaForm).not.toBeNull()
        expect(xfaForm!.datasets).not.toBeNull()

        // Read the original XML content
        const originalXml = xfaForm!.datasets!.readXml()
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

        // Write the modified XML back
        xfaForm!.datasets!.writeXml(modifiedXml)

        // Write the XFA form to the document via the standard acroform write path

        //acroform?.setXfa(xfaForm!)
        await acroform?.write()

        await server.commands.writeFile(
            './test/unit/tmp/modifiedAdobeLivecycle.pdf',
            document.toBase64(),
            { encoding: 'base64' },
        )

        const rereadDocument = await PdfDocument.fromBytes([document.toBytes()])
        rereadDocument.setPassword('')

        // Read it back to verify the changes were applied
        const rereadXfa = await rereadDocument.acroForm.getXfa()
        expect(rereadXfa).not.toBeNull()
        const updatedXml = rereadXfa!.datasets!.readXml()
        expect(updatedXml).toContain('NEW COMPANY NAME LLC')

        rereadDocument.toString() // Ensure no errors on toString
    })

    it('should load XFA template stream', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        document.setPassword('')

        const xfaForm = await document.acroForm.getXfa()
        expect(xfaForm).not.toBeNull()
        expect(xfaForm!.template).not.toBeNull()
        expect(xfaForm!.template).toContain('<template')
    })
})

describe('XFA Template Parsing', () => {
    it('should parse unit measurements correctly', () => {
        // Build a minimal XFA template XML with known measurements
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://www.xfa.org/schema/xfa-template/3.0/">
  <subform name="form1">
    <pageSet>
      <pageArea name="Page1" w="210mm" h="297mm">
        <contentArea w="210mm" h="297mm"/>
      </pageArea>
    </pageSet>
    <subform name="page1">
      <field name="TextField1" x="10mm" y="20mm" w="50mm" h="8mm">
        <ui><textEdit/></ui>
        <value><text>hello</text></value>
      </field>
      <field name="CheckBox1" x="10mm" y="30mm" w="5mm" h="5mm">
        <ui><checkButton/></ui>
      </field>
      <field name="Dropdown1" x="70mm" y="20mm" w="60mm" h="8mm">
        <ui><choiceList open="onEntry"/></ui>
        <items>
          <text>Option A</text>
          <text>Option B</text>
          <text>Option C</text>
        </items>
      </field>
    </subform>
  </subform>
</template>`

        const template = PdfXfaTemplate.parse(xml)
        expect(template.pages.length).toBeGreaterThan(0)

        // Page size: 210mm and 297mm in points
        const page = template.pages[0]
        expect(page.width).toBeCloseTo((210 * 72) / 25.4, 1)
        expect(page.height).toBeCloseTo((297 * 72) / 25.4, 1)

        // Should have 3 fields
        expect(page.fields.length).toBe(3)

        // TextField
        const textField = page.fields.find((f) => f.name === 'TextField1')
        expect(textField).toBeDefined()
        expect(textField!.type).toBe('Tx')
        expect(textField!.value).toBe('hello')
        expect(textField!.w).toBeCloseTo((50 * 72) / 25.4, 1)

        // CheckBox
        const checkBox = page.fields.find((f) => f.name === 'CheckBox1')
        expect(checkBox).toBeDefined()
        expect(checkBox!.type).toBe('Btn')

        // Dropdown
        const dropdown = page.fields.find((f) => f.name === 'Dropdown1')
        expect(dropdown).toBeDefined()
        expect(dropdown!.type).toBe('Ch')
        expect(dropdown!.combo).toBe(true)
        expect(dropdown!.options).toEqual(['Option A', 'Option B', 'Option C'])
    })

    it('should handle Y-flip correctly', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://www.xfa.org/schema/xfa-template/3.0/">
  <subform name="form1">
    <pageSet>
      <pageArea name="Page1" w="612pt" h="792pt">
        <contentArea w="612pt" h="792pt"/>
      </pageArea>
    </pageSet>
    <subform name="page1">
      <field name="TopField" x="72pt" y="0pt" w="100pt" h="20pt">
        <ui><textEdit/></ui>
      </field>
      <field name="BottomField" x="72pt" y="772pt" w="100pt" h="20pt">
        <ui><textEdit/></ui>
      </field>
    </subform>
  </subform>
</template>`

        const template = PdfXfaTemplate.parse(xml)
        const page = template.pages[0]

        // TopField at XFA y=0 → PDF y = 792 - 0 - 20 = 772
        const topField = page.fields.find((f) => f.name === 'TopField')
        expect(topField!.y).toBeCloseTo(772, 1)

        // BottomField at XFA y=772 → PDF y = 792 - 772 - 20 = 0
        const bottomField = page.fields.find((f) => f.name === 'BottomField')
        expect(bottomField!.y).toBeCloseTo(0, 1)
    })

    it('should accumulate nested subform offsets', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://www.xfa.org/schema/xfa-template/3.0/">
  <subform name="form1">
    <pageSet>
      <pageArea name="Page1" w="612pt" h="792pt">
        <contentArea w="612pt" h="792pt"/>
      </pageArea>
    </pageSet>
    <subform name="outer" x="50pt" y="100pt">
      <subform name="inner" x="20pt" y="30pt">
        <field name="NestedField" x="10pt" y="10pt" w="80pt" h="20pt">
          <ui><textEdit/></ui>
        </field>
      </subform>
    </subform>
  </subform>
</template>`

        const template = PdfXfaTemplate.parse(xml)
        const page = template.pages[0]
        const field = page.fields.find((f) => f.name === 'NestedField')
        expect(field).toBeDefined()

        // X should accumulate: 50 + 20 + 10 = 80
        expect(field!.x).toBeCloseTo(80, 1)
    })

    it('should map field types from ui elements', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://www.xfa.org/schema/xfa-template/3.0/">
  <subform name="form1">
    <pageSet>
      <pageArea name="Page1" w="8.5in" h="11in"/>
    </pageSet>
    <subform name="page">
      <field name="TextF" x="0pt" y="0pt" w="100pt" h="20pt">
        <ui><textEdit/></ui>
      </field>
      <field name="NumF" x="0pt" y="30pt" w="100pt" h="20pt">
        <ui><numericEdit/></ui>
      </field>
      <field name="DateF" x="0pt" y="60pt" w="100pt" h="20pt">
        <ui><dateTimeEdit/></ui>
      </field>
      <field name="ChkF" x="0pt" y="90pt" w="20pt" h="20pt">
        <ui><checkButton/></ui>
      </field>
      <field name="ListF" x="0pt" y="120pt" w="100pt" h="60pt">
        <ui><choiceList open="always"/></ui>
      </field>
      <field name="SigF" x="0pt" y="190pt" w="100pt" h="40pt">
        <ui><signature/></ui>
      </field>
      <field name="NoUiF" x="0pt" y="240pt" w="100pt" h="20pt">
      </field>
    </subform>
  </subform>
</template>`

        const template = PdfXfaTemplate.parse(xml)
        const fields = template.allFields

        expect(fields.find((f) => f.name === 'TextF')!.type).toBe('Tx')
        expect(fields.find((f) => f.name === 'NumF')!.type).toBe('Tx')
        expect(fields.find((f) => f.name === 'DateF')!.type).toBe('Tx')
        expect(fields.find((f) => f.name === 'ChkF')!.type).toBe('Btn')
        expect(fields.find((f) => f.name === 'ListF')!.type).toBe('Ch')
        expect(fields.find((f) => f.name === 'ListF')!.combo).toBe(false)
        expect(fields.find((f) => f.name === 'SigF')!.type).toBe('Sig')
        expect(fields.find((f) => f.name === 'NoUiF')!.type).toBe('Tx')
    })

    it('should detect multiline text fields', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<template xmlns="http://www.xfa.org/schema/xfa-template/3.0/">
  <subform name="form1">
    <pageSet>
      <pageArea name="Page1" w="612pt" h="792pt"/>
    </pageSet>
    <subform name="page">
      <field name="MultiF" x="0pt" y="0pt" w="200pt" h="80pt">
        <ui><textEdit multiLine="1"/></ui>
      </field>
      <field name="SingleF" x="0pt" y="100pt" w="200pt" h="20pt">
        <ui><textEdit/></ui>
      </field>
    </subform>
  </subform>
</template>`

        const template = PdfXfaTemplate.parse(xml)
        expect(
            template.allFields.find((f) => f.name === 'MultiF')!.multiline,
        ).toBe(true)
        expect(
            template.allFields.find((f) => f.name === 'SingleF')!.multiline,
        ).toBe(false)
    })
})

describe('XFA to AcroForm Conversion', () => {
    it('should convert XFA form to AcroForm fields', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        document.setPassword('')

        // Verify XFA exists before conversion
        const xfaForm = await document.acroForm.getXfa()
        expect(xfaForm).not.toBeNull()
        expect(xfaForm!.template).not.toBeNull()

        // Parse template to see what fields exist
        const template = PdfXfaTemplate.parse(xfaForm!.template!)
        const templateFieldCount = template.allFields.length

        // Convert XFA to AcroForm
        // Only fields on existing PDF pages are placed (PDF has 1 page,
        // template spans multiple pages in flow layout)
        const fieldCount = await XfaToAcroFormConverter.convert(document)
        expect(fieldCount).toBeGreaterThan(0)
        expect(fieldCount).toBeLessThanOrEqual(templateFieldCount)

        // Write and re-read the document
        const outputBytes = document.toBytes()
        await server.commands.writeFile(
            './test/unit/tmp/xfa-converted.pdf',
            document.toBase64(),
            { encoding: 'base64' },
        )

        const rereadDoc = await PdfDocument.fromBytes([outputBytes])
        rereadDoc.setPassword('')

        // Verify AcroForm fields exist
        const acroform = await rereadDoc.acroForm.read()
        expect(acroform).not.toBeNull()
        expect(acroform!.fields.length).toBeGreaterThan(0)
    })

    it('should merge dataset values into converted fields', async () => {
        const pdfBuffer = base64ToBytes(
            await server.commands.readFile(
                './test/unit/fixtures/protectedAdobeLivecycle.pdf',
                { encoding: 'base64' },
            ),
        )

        const document = await PdfDocument.fromBytes([pdfBuffer])
        document.setPassword('')

        // Convert with dataset merging enabled (default)
        await XfaToAcroFormConverter.convert(document)

        const outputBytes = document.toBytes()
        const rereadDoc = await PdfDocument.fromBytes([outputBytes])
        rereadDoc.setPassword('')

        // Check that field values were transferred
        const acroform = await rereadDoc.acroForm.read()
        expect(acroform).not.toBeNull()

        const values = acroform!.exportData()
        // At least some fields should have values from the dataset
        const nonEmptyValues = Object.entries(values).filter(
            ([, v]) => v && v.trim() !== '',
        )
        expect(nonEmptyValues.length).toBeGreaterThan(0)
    })
})
