import { describe, expect, it } from 'vitest'
import {
    LinearizationDictionary,
    LinearizationParams,
    HintTableGenerator,
    PdfLinearizer,
} from '../../src/linearization'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfNumber } from '../../src/core/objects/pdf-number'
import { PdfStream } from '../../src/core/objects/pdf-stream'

describe('Linearization', () => {
    describe('LinearizationDictionary', () => {
        it('should create a linearization dictionary with correct parameters', () => {
            const linDict = new LinearizationDictionary({
                fileLength: 71443,
                hintStreamOffset: 548,
                hintStreamLength: 187,
                firstPageObjectNumber: 36,
                endOfFirstPage: 2636,
                pageCount: 1,
                xrefStreamOffset: 71078,
            })

            expect(linDict.fileLength).toBe(71443)
            expect(linDict.hintStreamOffset).toBe(548)
            expect(linDict.hintStreamLength).toBe(187)
            expect(linDict.firstPageObjectNumber).toBe(36)
            expect(linDict.endOfFirstPage).toBe(2636)
            expect(linDict.pageCount).toBe(1)
            expect(linDict.xrefStreamOffset).toBe(71078)

            // Verify Linearized key is set to 1
            const linearized = linDict.get('Linearized') as PdfNumber
            expect(linearized.value).toBe(1)
        })
    })

    describe('LinearizationParams', () => {
        async function createTestDocument(): Promise<PdfDocument> {
            const document = new PdfDocument()

            // Create a simple PDF with one page
            const page = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            page.content.set('Type', new PdfName('Page'))
            page.content.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            )
            await document.commit(page)

            const pages = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            pages.content.set('Type', new PdfName('Pages'))
            pages.content.set('Kids', new PdfArray([page.reference]))
            pages.content.set('Count', new PdfNumber(1))
            await document.commit(pages)

            const catalog = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            catalog.content.set('Type', new PdfName('Catalog'))
            catalog.content.set('Pages', pages.reference)
            await document.commit(catalog)

            document.latestRevision.trailerDict.set('Root', catalog.reference)

            return document
        }

        it('should extract linearization parameters from document', async () => {
            const document = await createTestDocument()
            const params = new LinearizationParams(document)

            // Test page count extraction
            const pageCount = params.getPageCount()
            expect(pageCount).toBe(1)

            // Test first page reference extraction
            const firstPageRef = params.getFirstPageRef()
            expect(firstPageRef).toBeDefined()
            expect(firstPageRef?.objectNumber).toBeGreaterThan(0)

            // Test first page objects collection
            const firstPageObjects = params.getFirstPageObjects()
            expect(firstPageObjects.size).toBeGreaterThan(0)

            // Test catalog and page tree objects collection
            const catalogObjects = params.getCatalogAndPageTreeObjects()
            expect(catalogObjects.size).toBeGreaterThanOrEqual(2)
        })
    })

    describe('HintTableGenerator', () => {
        it('should generate hint stream with valid structure', () => {
            const generator = new HintTableGenerator()
            const pageObjects = [
                new PdfIndirectObject({ content: new PdfDictionary() }),
                new PdfIndirectObject({ content: new PdfDictionary() }),
            ]
            const pageByteOffsets = [1000, 2000]

            const hintStream = generator.generateHintStream(
                pageObjects,
                pageByteOffsets,
            )

            expect(hintStream).toBeInstanceOf(PdfStream)
            const length = hintStream.header.get('Length') as PdfNumber
            expect(length.value).toBeGreaterThan(0)
        })
    })

    describe('PdfLinearizer', () => {
        async function createTestDocument(): Promise<PdfDocument> {
            const document = new PdfDocument()

            // Create content stream
            const contentStream = new PdfIndirectObject({
                content: new PdfStream({
                    header: new PdfDictionary(),
                    original: 'BT /F1 24 Tf 100 700 Td (Test) Tj ET',
                }),
            })
            await document.commit(contentStream)

            // Create page
            const page = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            page.content.set('Type', new PdfName('Page'))
            page.content.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            )
            page.content.set(
                'Contents',
                new PdfArray([contentStream.reference]),
            )
            await document.commit(page)

            const pages = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            pages.content.set('Type', new PdfName('Pages'))
            pages.content.set('Kids', new PdfArray([page.reference]))
            pages.content.set('Count', new PdfNumber(1))
            await document.commit(pages)

            const catalog = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            catalog.content.set('Type', new PdfName('Catalog'))
            catalog.content.set('Pages', pages.reference)
            await document.commit(catalog)

            document.latestRevision.trailerDict.set('Root', catalog.reference)

            return document
        }

        it('should linearize document with correct structure', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()

            // Verify linearization dictionary is first object
            const firstObject = linearizedDoc.revisions[0].objects[0]
            expect(firstObject).toBeInstanceOf(PdfIndirectObject)

            const indirectObj = firstObject as PdfIndirectObject
            const content = indirectObj.content as PdfDictionary
            const linearized = content.get('Linearized') as PdfNumber
            expect(linearized.value).toBe(1)
        })

        it('should detect linearized documents', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            expect(PdfLinearizer.isLinearized(document)).toBe(false)

            const linearizedDoc = linearizer.linearize()
            expect(PdfLinearizer.isLinearized(linearizedDoc)).toBe(true)
        })

        it('should throw error for invalid document structure', () => {
            const document = new PdfDocument()
            const linearizer = new PdfLinearizer(document)

            expect(() => linearizer.linearize()).toThrow(
                'Cannot linearize document: invalid page structure',
            )
        })

        it('should generate expected string representation of linearized PDF', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()
            const pdfString = linearizedDoc.toString()

            // Verify it contains expected PDF structure
            expect(pdfString).toContain('%PDF-')
            expect(pdfString).toContain('Linearized')
            expect(pdfString).toContain('%%EOF')

            // Inline snapshot showing complete linearized PDF structure
            expect(pdfString).toMatchInlineSnapshot(`
              "%PDF-2.0
              1 0 obj
              << /Linearized 1 /L 3524 /H [ 548 187 ] /O 3 /E 2636 /N 1 /T 3324 >>
              endobj
              3 0 obj
              << /Type /Page /MediaBox [ 0 0 612 792 ] /Contents [ 2 0 R ] >>
              endobj
              5 0 obj
              << /Type /Catalog /Pages 4 0 R >>
              endobj
              4 0 obj
              << /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
              endobj
              2 0 obj
              << /Length 36 >>stream
              BT /F1 24 Tf 100 700 Td (Test) Tj ETendstream
              endobj
              1 0 obj
              << /Type /XRef /W [ 1 2 1 ] /Index [ 1 5 ] /Size 6 /Length 20 /Root 5 0 R >>stream
                	  ]  ¬  ç endstream
              endobj
              1 0 obj
              << /Type /XRef /W [ 1 2 1 ] /Index [ 1 5 ] /Size 6 /Length 20 >>stream
              l   ]  Ý  ¬ endstream
              endobj
              startxref
              492
              %%EOF
              "
            `)
        })

        it('should linearize multi-page documents correctly', async () => {
            const document = new PdfDocument()

            // Create content streams for two pages
            const contentStream1 = new PdfIndirectObject({
                content: new PdfStream({
                    header: new PdfDictionary(),
                    original: 'BT /F1 24 Tf 100 700 Td (Page 1) Tj ET',
                }),
            })
            await document.commit(contentStream1)

            const contentStream2 = new PdfIndirectObject({
                content: new PdfStream({
                    header: new PdfDictionary(),
                    original: 'BT /F1 24 Tf 100 700 Td (Page 2) Tj ET',
                }),
            })
            await document.commit(contentStream2)

            // Create pages
            const page1 = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            page1.content.set('Type', new PdfName('Page'))
            page1.content.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            )
            page1.content.set('Contents', contentStream1.reference)
            await document.commit(page1)

            const page2 = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            page2.content.set('Type', new PdfName('Page'))
            page2.content.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            )
            page2.content.set('Contents', contentStream2.reference)
            await document.commit(page2)

            const pages = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            pages.content.set('Type', new PdfName('Pages'))
            pages.content.set(
                'Kids',
                new PdfArray([page1.reference, page2.reference]),
            )
            pages.content.set('Count', new PdfNumber(2))
            await document.commit(pages)

            const catalog = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            catalog.content.set('Type', new PdfName('Catalog'))
            catalog.content.set('Pages', pages.reference)
            await document.commit(catalog)

            document.latestRevision.trailerDict.set('Root', catalog.reference)

            // Linearize the document
            const linearizer = new PdfLinearizer(document)
            const linearizedDoc = linearizer.linearize()

            // Verify linearization
            expect(PdfLinearizer.isLinearized(linearizedDoc)).toBe(true)

            // Verify linearization dictionary has correct page count
            const firstObject = linearizedDoc.revisions[0]
                .objects[0] as PdfIndirectObject
            const linDict = firstObject.content as PdfDictionary
            const pageCount = linDict.get('N') as PdfNumber
            expect(pageCount.value).toBe(2)
        })

        it('should linearize documents with resources', async () => {
            const document = new PdfDocument()

            // Create a font object
            const font = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            font.content.set('Type', new PdfName('Font'))
            font.content.set('Subtype', new PdfName('Type1'))
            font.content.set('BaseFont', new PdfName('Helvetica'))
            await document.commit(font)

            // Create resources dictionary
            const resources = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            const fontDict = new PdfDictionary()
            fontDict.set('F1', font.reference)
            resources.content.set('Font', fontDict)
            await document.commit(resources)

            // Create content stream
            const contentStream = new PdfIndirectObject({
                content: new PdfStream({
                    header: new PdfDictionary(),
                    original: 'BT /F1 24 Tf 100 700 Td (Hello) Tj ET',
                }),
            })
            await document.commit(contentStream)

            // Create page with resources
            const page = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            page.content.set('Type', new PdfName('Page'))
            page.content.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            )
            page.content.set('Contents', contentStream.reference)
            page.content.set('Resources', resources.reference)
            await document.commit(page)

            const pages = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            pages.content.set('Type', new PdfName('Pages'))
            pages.content.set('Kids', new PdfArray([page.reference]))
            pages.content.set('Count', new PdfNumber(1))
            await document.commit(pages)

            const catalog = new PdfIndirectObject({
                content: new PdfDictionary(),
            })
            catalog.content.set('Type', new PdfName('Catalog'))
            catalog.content.set('Pages', pages.reference)
            await document.commit(catalog)

            document.latestRevision.trailerDict.set('Root', catalog.reference)

            // Linearize the document
            const linearizer = new PdfLinearizer(document)
            const linearizedDoc = linearizer.linearize()

            // Verify linearization
            expect(PdfLinearizer.isLinearized(linearizedDoc)).toBe(true)

            // Verify the linearized document contains the font and resources
            const pdfString = linearizedDoc.toString()
            expect(pdfString).toContain('/Type /Font')
            expect(pdfString).toContain('/BaseFont /Helvetica')
        })

        it('should place first page objects before other objects in linearized output', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()
            const objects = linearizedDoc.revisions[0].objects

            // Find the linearization dictionary (should be first)
            const firstObj = objects[0] as PdfIndirectObject
            const linDict = firstObj.content as PdfDictionary
            expect(linDict.get('Linearized')).toBeDefined()

            // Find the page object (should be after linearization dict)
            const pageObj = objects.find((obj) => {
                if (obj instanceof PdfIndirectObject) {
                    const content = obj.content
                    if (content instanceof PdfDictionary) {
                        const type = content.get('Type')
                        return type instanceof PdfName && type.value === 'Page'
                    }
                }
                return false
            })
            expect(pageObj).toBeDefined()

            // Page should come before catalog in the object ordering
            const pageIndex = objects.indexOf(pageObj!)
            const catalogObj = objects.find((obj) => {
                if (obj instanceof PdfIndirectObject) {
                    const content = obj.content
                    if (content instanceof PdfDictionary) {
                        const type = content.get('Type')
                        return (
                            type instanceof PdfName && type.value === 'Catalog'
                        )
                    }
                }
                return false
            })

            const catalogIndex = objects.indexOf(catalogObj!)

            // First page objects should come before catalog
            expect(pageIndex).toBeLessThan(catalogIndex)
        })
    })
})
