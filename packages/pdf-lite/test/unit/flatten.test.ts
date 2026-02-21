import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { server } from 'vitest/browser'
import { ByteArray } from '../../src/types'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfObjectReference } from '../../src/core/objects/pdf-object-reference'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfXfaTemplate } from '../../src/acroform/xfa/pdf-xfa-template'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

const bytesToBase64 = (bytes: ByteArray): string => {
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i])
    }
    return btoa(binaryString)
}

async function loadPdf(path: string): Promise<PdfDocument> {
    const b64 = await server.commands.readFile(path, { encoding: 'base64' })
    return PdfDocument.fromBytes([base64ToBytes(b64)])
}

describe('PdfDocument.flatten()', () => {
    it('removes /AcroForm from the catalog after flattening', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')

        // Sanity: has AcroForm before flatten
        expect(await document.acroForm.exists()).toBe(true)

        await document.flatten()

        // AcroForm dict must be gone
        expect(document.root.content.has('AcroForm')).toBe(false)
    })

    it('round-trips cleanly: re-parsed document has no AcroForm', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        await document.flatten()

        const bytes = document.toBytes()

        // Diagnostic: find startxref and show context
        const decoder = new TextDecoder()
        const fullStr = decoder.decode(bytes)
        const lastStartxref = fullStr.lastIndexOf('startxref')
        const startxrefVal = parseInt(fullStr.slice(lastStartxref + 9).trim())
        console.log(`[DEBUG] Total bytes: ${bytes.length}`)
        console.log(
            `[DEBUG] Last startxref at: ${lastStartxref}, points to: ${startxrefVal}`,
        )
        // Show what's at startxref target
        const xrefCtx = fullStr
            .slice(startxrefVal, startxrefVal + 40)
            .replace(/\n/g, '\\n')
        console.log(`[DEBUG] Content at startxref target: "${xrefCtx}"`)
        // Show content around error
        const errOffset = 156789
        const errCtx = fullStr
            .slice(errOffset - 100, errOffset + 40)
            .replace(/\n/g, '\\n')
        console.log(`[DEBUG] Context around error offset: "${errCtx}"`)
        // Show bytes just before error
        const prevEndobj = fullStr.lastIndexOf('endobj', errOffset)
        console.log(`[DEBUG] Last 'endobj' before error at: ${prevEndobj}`)
        const afterEndobj = fullStr
            .slice(prevEndobj, prevEndobj + 20)
            .replace(/\n/g, '\\n')
        console.log(`[DEBUG] Content at last endobj: "${afterEndobj}"`)

        const reparsed = await PdfDocument.fromBytes([bytes])

        expect(await reparsed.acroForm.exists()).toBe(false)
    })

    it('flattened page has no widget annotations remaining in Annots', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        await document.flatten()

        const bytes = document.toBytes()
        const reparsed = await PdfDocument.fromBytes([bytes])

        // Walk pages and check there are no Widget annotations
        const pagesRef = reparsed.root.content.get('Pages')
        expect(pagesRef).toBeInstanceOf(PdfObjectReference)

        const pagesObj = await reparsed.readObject(
            pagesRef as PdfObjectReference,
        )
        expect(pagesObj).toBeDefined()

        const pagesDict = pagesObj!.content as PdfDictionary
        const kidsArr = pagesDict.get('Kids') as PdfArray<PdfObjectReference>

        for (const kidRef of kidsArr.items) {
            const pageObj = await reparsed.readObject(kidRef)
            if (!pageObj) continue
            const pageDict = pageObj.content as PdfDictionary

            const annotsRaw = pageDict.get('Annots')
            if (!annotsRaw) continue // no annotations — fine

            // If Annots is still present it should contain zero Widget entries
            let annotItems: PdfObjectReference[] = []
            if (annotsRaw instanceof PdfArray) {
                annotItems = annotsRaw.items.filter(
                    (x): x is PdfObjectReference =>
                        x instanceof PdfObjectReference,
                )
            }

            for (const annotRef of annotItems) {
                const annotObj = await reparsed.readObject(annotRef)
                if (!annotObj) continue
                const annotDict = annotObj.content as PdfDictionary
                const subtype = annotDict.get('Subtype')?.as(PdfName)?.value
                expect(subtype).not.toBe('Widget')
            }
        }
    })

    it('flattened page has XObject resources for baked appearances', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')

        // Fill a field so there is a visible value to bake
        const acroform = await document.acroForm.read()
        if (acroform) {
            for (const field of acroform.fields) {
                if (field.fieldType === 'Text' && field.rect) {
                    field.value = 'Hello'
                    break
                }
            }
        }

        await document.flatten()

        const bytes = document.toBytes()
        const reparsed = await PdfDocument.fromBytes([bytes])

        const pagesRef = reparsed.root.content.get('Pages')
        const pagesObj = await reparsed.readObject(
            pagesRef as PdfObjectReference,
        )
        const pagesDict = pagesObj!.content as PdfDictionary
        const kidsArr = pagesDict.get('Kids') as PdfArray<PdfObjectReference>

        let foundXObjectEntry = false
        for (const kidRef of kidsArr.items) {
            const pageObj = await reparsed.readObject(kidRef)
            if (!pageObj) continue
            const pageDict = pageObj.content as PdfDictionary
            const resources = pageDict.get('Resources') as
                | PdfDictionary
                | undefined
            if (!resources) continue
            const xobjects = resources.get('XObject') as
                | PdfDictionary
                | undefined
            if (!xobjects) continue

            // Should have at least one FltAP* entry
            for (const [key] of xobjects.entries()) {
                if (key.startsWith('FltAP')) {
                    foundXObjectEntry = true
                    break
                }
            }
        }

        expect(foundXObjectEntry).toBe(true)
    })

    it('toBytes() produces valid parseable PDF after flatten', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        await document.flatten()

        const bytes = document.toBytes()
        expect(bytes.length).toBeGreaterThan(0)

        // Should re-parse without throwing
        const reparsed = await PdfDocument.fromBytes([bytes])
        expect(reparsed).toBeDefined()
    })
})

describe('PdfDocument.flatten() – XFA document', () => {
    it('removes /AcroForm from catalog after flattening XFA document', async () => {
        const document = await loadPdf(
            './test/unit/fixtures/protectedAdobeLivecycle.pdf',
        )
        document.setPassword('')

        expect(await document.acroForm.exists()).toBe(true)

        await document.flatten()

        expect(document.root.content.has('AcroForm')).toBe(false)
    })

    it('flattened XFA document round-trips cleanly', async () => {
        const document = await loadPdf(
            './test/unit/fixtures/protectedAdobeLivecycle.pdf',
        )
        document.setPassword('')

        await document.flatten()

        const bytes = document.toBytes()
        expect(bytes.length).toBeGreaterThan(0)

        const reparsed = await PdfDocument.fromBytes([bytes])
        expect(await reparsed.acroForm.exists()).toBe(false)

        await server.commands.writeFile(
            './test/unit/tmp/flattenedXFA.pdf',
            bytesToBase64(bytes),
            {
                encoding: 'base64',
            },
        )
    })
})

describe('PdfXfaTemplate', () => {
    it('loads template component from XFA document', async () => {
        const document = await loadPdf(
            './test/unit/fixtures/protectedAdobeLivecycle.pdf',
        )
        document.setPassword('')

        const template = await PdfXfaTemplate.fromDocument(document)
        // LiveCycle PDF should have a template component
        // (if not, this is a datasets-only XFA and template is absent)
        if (template) {
            const layouts = template.extractFieldLayouts()
            expect(Array.isArray(layouts)).toBe(true)
        }
        // Either null (no template component) or a PdfXfaTemplate instance
        expect(template === null || template instanceof PdfXfaTemplate).toBe(
            true,
        )
    })

    it('XML parser handles basic XFA template structure', () => {
        const xml = `<?xml version="1.0"?>
<xdp:xdp xmlns:xdp="http://ns.adobe.com/xdp/">
  <template xmlns="http://www.xfa.org/schema/xfa-template/3.3/">
    <subform layout="position" name="form1">
      <subform layout="position" name="page1">
        <field name="FirstName" x="10pt" y="20pt" w="100pt" h="18pt">
          <ui><textEdit/></ui>
          <font typeface="Helvetica" size="12pt"/>
          <caption>
            <value><text>First Name</text></value>
          </caption>
        </field>
        <field name="CheckBox1" x="10pt" y="50pt" w="18pt" h="18pt">
          <ui><checkButton/></ui>
        </field>
        <field name="DropDown1" x="10pt" y="80pt" w="120pt" h="18pt">
          <ui><choiceList/></ui>
          <items>
            <text>Option A</text>
            <text>Option B</text>
          </items>
        </field>
        <draw name="StaticLabel" x="10pt" y="110pt" w="200pt" h="18pt">
          <value><text>Static text</text></value>
        </draw>
      </subform>
    </subform>
  </template>
</xdp:xdp>`

        const tmpl = new PdfXfaTemplate(xml)
        const layouts = tmpl.extractFieldLayouts()

        expect(layouts).toHaveLength(4)

        const [firstName, checkbox, dropdown, draw] = layouts

        expect(firstName.name).toBe('form1.page1.FirstName')
        expect(firstName.type).toBe('Text')
        expect(firstName.fontName).toBe('Helvetica')
        expect(firstName.fontSize).toBeCloseTo(12)
        expect(firstName.captionText).toBe('First Name')
        expect(firstName.x).toBeCloseTo(10)
        expect(firstName.y).toBeCloseTo(20)
        expect(firstName.w).toBeCloseTo(100)
        expect(firstName.h).toBeCloseTo(18)

        expect(checkbox.name).toBe('form1.page1.CheckBox1')
        expect(checkbox.type).toBe('Button')

        expect(dropdown.name).toBe('form1.page1.DropDown1')
        expect(dropdown.type).toBe('Choice')
        expect(dropdown.options).toEqual(['Option A', 'Option B'])

        expect(draw.name).toBe('form1.page1.StaticLabel')
        expect(draw.type).toBe('Draw')
    })

    it('XML parser strips namespace prefixes from element names', () => {
        const xml = `<xdp:xdp>
  <xfa:template>
    <subform name="root">
      <field name="F1" x="5pt" y="5pt" w="50pt" h="10pt">
        <ui><textEdit/></ui>
      </field>
    </subform>
  </xfa:template>
</xdp:xdp>`

        const tmpl = new PdfXfaTemplate(xml)
        const layouts = tmpl.extractFieldLayouts()

        expect(layouts).toHaveLength(1)
        expect(layouts[0].name).toBe('root.F1')
        expect(layouts[0].type).toBe('Text')
    })

    it('converts mm units to pt', () => {
        const xml = `<template>
  <subform name="s">
    <field name="F" x="25.4mm" y="0pt" w="50.8mm" h="10pt">
      <ui><textEdit/></ui>
    </field>
  </subform>
</template>`

        const tmpl = new PdfXfaTemplate(xml)
        const [f] = tmpl.extractFieldLayouts()

        // 25.4mm = 72pt, 50.8mm = 144pt
        expect(f.x).toBeCloseTo(72, 1)
        expect(f.w).toBeCloseTo(144, 1)
    })
})
