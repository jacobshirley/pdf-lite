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
        })

        it('should have Linearized key set to 1', () => {
            const linDict = new LinearizationDictionary({
                fileLength: 1000,
                hintStreamOffset: 100,
                hintStreamLength: 50,
                firstPageObjectNumber: 5,
                endOfFirstPage: 500,
                pageCount: 2,
                xrefStreamOffset: 900,
            })

            const linearized = linDict.get('Linearized') as PdfNumber
            expect(linearized).toBeDefined()
            expect(linearized.value).toBe(1)
        })

        it('should allow updating file length', () => {
            const linDict = new LinearizationDictionary({
                fileLength: 1000,
                hintStreamOffset: 100,
                hintStreamLength: 50,
                firstPageObjectNumber: 5,
                endOfFirstPage: 500,
                pageCount: 2,
                xrefStreamOffset: 900,
            })

            linDict.fileLength = 2000
            expect(linDict.fileLength).toBe(2000)
        })

        it('should serialize correctly', () => {
            const linDict = new LinearizationDictionary({
                fileLength: 100,
                hintStreamOffset: 10,
                hintStreamLength: 5,
                firstPageObjectNumber: 3,
                endOfFirstPage: 50,
                pageCount: 1,
                xrefStreamOffset: 90,
            })

            const serialized = linDict.toString()
            expect(serialized).toContain('Linearized')
            expect(serialized).toContain('1')
            expect(serialized).toContain('100')
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

        it('should get page count', async () => {
            const document = await createTestDocument()
            const params = new LinearizationParams(document)

            const pageCount = params.getPageCount()
            expect(pageCount).toBe(1)
        })

        it('should get first page reference', async () => {
            const document = await createTestDocument()
            const params = new LinearizationParams(document)

            const firstPageRef = params.getFirstPageRef()
            expect(firstPageRef).toBeDefined()
            expect(firstPageRef?.objectNumber).toBeGreaterThan(0)
        })

        it('should get first page objects', async () => {
            const document = await createTestDocument()
            const params = new LinearizationParams(document)

            const firstPageObjects = params.getFirstPageObjects()
            expect(firstPageObjects.size).toBeGreaterThan(0)
        })

        it('should get catalog and page tree objects', async () => {
            const document = await createTestDocument()
            const params = new LinearizationParams(document)

            const catalogObjects = params.getCatalogAndPageTreeObjects()
            expect(catalogObjects.size).toBeGreaterThanOrEqual(2) // catalog + pages
        })
    })

    describe('HintTableGenerator', () => {
        it('should generate hint stream', () => {
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

            expect(hintStream).toBeDefined()
            expect(hintStream).toBeInstanceOf(PdfStream)
        })

        it('should have valid length in header', () => {
            const generator = new HintTableGenerator()
            const pageObjects = [
                new PdfIndirectObject({ content: new PdfDictionary() }),
            ]
            const pageByteOffsets = [1000]

            const hintStream = generator.generateHintStream(
                pageObjects,
                pageByteOffsets,
            )

            const length = hintStream.header.get('Length') as PdfNumber
            expect(length).toBeDefined()
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

        it('should create a linearizer instance', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            expect(linearizer).toBeDefined()
        })

        it('should linearize a document', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()

            expect(linearizedDoc).toBeDefined()
            expect(linearizedDoc).toBeInstanceOf(PdfDocument)
        })

        it('should have linearization dictionary as first object', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()

            const firstObject = linearizedDoc.revisions[0].objects[0]
            expect(firstObject).toBeDefined()
            expect(firstObject).toBeInstanceOf(PdfIndirectObject)

            const indirectObj = firstObject as PdfIndirectObject
            expect(indirectObj.content).toBeInstanceOf(PdfDictionary)

            const content = indirectObj.content as PdfDictionary
            const linearized = content.get('Linearized') as PdfNumber
            expect(linearized).toBeDefined()
            expect(linearized.value).toBe(1)
        })

        it('should detect linearized documents', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            // Original document should not be linearized
            expect(PdfLinearizer.isLinearized(document)).toBe(false)

            // Linearized document should be detected
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

        it('should preserve page count in linearization dictionary', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()

            const firstObject = linearizedDoc.revisions[0]
                .objects[0] as PdfIndirectObject
            const linDict = firstObject.content as LinearizationDictionary

            expect(linDict.pageCount).toBe(1)
        })

        it('should set correct first page object number', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()

            const firstObject = linearizedDoc.revisions[0]
                .objects[0] as PdfIndirectObject
            const linDict = firstObject.content as LinearizationDictionary

            expect(linDict.firstPageObjectNumber).toBeGreaterThan(0)
        })

        it('should generate expected string representation of linearized PDF', async () => {
            const document = await createTestDocument()
            const linearizer = new PdfLinearizer(document)

            const linearizedDoc = linearizer.linearize()

            // Get the string representation of the linearized PDF
            const pdfString = linearizedDoc.toString()

            // Verify it contains expected PDF structure
            expect(pdfString).toContain('%PDF-')
            expect(pdfString).toContain('Linearized')
            expect(pdfString).toContain('%%EOF')

            // Inline snapshot test to show what the linearized PDF looks like as a string
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
    })
})
