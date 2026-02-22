import { describe, it, expect, beforeEach } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document.js'
import { PdfPageManager } from '../../src/pages/pdf-page-manager.js'
import { PdfPage } from '../../src/pages/pdf-page.js'
import { PdfStream } from '../../src/core/objects/pdf-stream.js'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object.js'
import { PdfContentStream } from '../../src/content/pdf-content-stream.js'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary.js'

describe('PdfPageManager', () => {
    let document: PdfDocument
    let manager: PdfPageManager

    beforeEach(() => {
        document = new PdfDocument()
        manager = document.pages
    })

    describe('create', () => {
        it('should create a new page and add to document', () => {
            const page = manager.create({ width: 612, height: 792 })

            expect(page).toBeInstanceOf(PdfPage)
            expect(page.objectNumber).toBeGreaterThan(-1)
            expect(manager.count()).toBe(1)
        })

        it('should create multiple pages', () => {
            manager.create({ width: 612, height: 792 })
            manager.create({ width: 612, height: 792 })
            manager.create({ width: 612, height: 792 })

            expect(manager.count()).toBe(3)
        })

        it('should set parent reference on created page', () => {
            const page = manager.create({ width: 612, height: 792 })

            expect(page.parent).toBeDefined()
        })

        it('should initialize page tree if not present', () => {
            const page = manager.create({ width: 612, height: 792 })

            const catalog = document.root.content
            const pagesRef = catalog.get('Pages')
            expect(pagesRef).toBeDefined()
        })
    })

    describe('get', () => {
        it('should get page by index', () => {
            const page1 = manager.create({ width: 612, height: 792 })
            const page2 = manager.create({ width: 400, height: 600 })

            const retrieved = manager.get(0)
            expect(retrieved).toBeDefined()
            expect(retrieved?.objectNumber).toBe(page1.objectNumber)

            const retrieved2 = manager.get(1)
            expect(retrieved2).toBeDefined()
            expect(retrieved2?.objectNumber).toBe(page2.objectNumber)
        })

        it('should return undefined for invalid index', () => {
            manager.create({ width: 612, height: 792 })

            expect(manager.get(1)).toBeUndefined()
            expect(manager.get(-1)).toBeUndefined()
        })

        it('should return undefined for empty document', () => {
            expect(manager.get(0)).toBeUndefined()
        })
    })

    describe('count', () => {
        it('should return 0 for empty document', () => {
            expect(manager.count()).toBe(0)
        })

        it('should return correct count after adding pages', () => {
            manager.create({ width: 612, height: 792 })
            expect(manager.count()).toBe(1)

            manager.create({ width: 612, height: 792 })
            expect(manager.count()).toBe(2)

            manager.create({ width: 612, height: 792 })
            expect(manager.count()).toBe(3)
        })
    })

    describe('getAll', () => {
        it('should return empty array for empty document', () => {
            const pages = manager.getAll()
            expect(pages).toEqual([])
        })

        it('should return all pages in order', () => {
            const page1 = manager.create({ width: 612, height: 792 })
            const page2 = manager.create({ width: 400, height: 600 })
            const page3 = manager.create({ width: 300, height: 400 })

            const pages = manager.getAll()
            expect(pages).toHaveLength(3)
            expect(pages[0].objectNumber).toBe(page1.objectNumber)
            expect(pages[1].objectNumber).toBe(page2.objectNumber)
            expect(pages[2].objectNumber).toBe(page3.objectNumber)
        })
    })

    describe('remove', () => {
        it('should remove page at index', () => {
            manager.create({ width: 612, height: 792 })
            const page2 = manager.create({ width: 400, height: 600 })
            manager.create({ width: 300, height: 400 })

            const removed = manager.remove(1)
            expect(removed).toBeDefined()
            expect(removed?.objectNumber).toBe(page2.objectNumber)
            expect(manager.count()).toBe(2)
        })

        it('should return undefined for invalid index', () => {
            manager.create({ width: 612, height: 792 })

            expect(manager.remove(5)).toBeUndefined()
            expect(manager.count()).toBe(1)
        })

        it('should remove first page', () => {
            const page1 = manager.create({ width: 612, height: 792 })
            manager.create({ width: 400, height: 600 })

            const removed = manager.remove(0)
            expect(removed?.objectNumber).toBe(page1.objectNumber)
            expect(manager.count()).toBe(1)

            const firstPage = manager.get(0)
            expect(firstPage?.objectNumber).not.toBe(page1.objectNumber)
        })

        it('should remove last page', () => {
            manager.create({ width: 612, height: 792 })
            manager.create({ width: 400, height: 600 })
            const page3 = manager.create({ width: 300, height: 400 })

            const removed = manager.remove(2)
            expect(removed?.objectNumber).toBe(page3.objectNumber)
            expect(manager.count()).toBe(2)
        })
    })

    describe('insert', () => {
        it('should insert page at beginning', () => {
            manager.create({ width: 612, height: 792 })
            manager.create({ width: 612, height: 792 })

            const newPage = new PdfPage({ width: 400, height: 600 })
            manager.insert(0, newPage)

            expect(manager.count()).toBe(3)
            const firstPage = manager.get(0)
            expect(firstPage?.objectNumber).toBe(newPage.objectNumber)
        })

        it('should insert page in middle', () => {
            manager.create({ width: 612, height: 792 })
            manager.create({ width: 612, height: 792 })

            const newPage = new PdfPage({ width: 400, height: 600 })
            manager.insert(1, newPage)

            expect(manager.count()).toBe(3)
            const middlePage = manager.get(1)
            expect(middlePage?.objectNumber).toBe(newPage.objectNumber)
        })

        it('should append if index >= count', () => {
            manager.create({ width: 612, height: 792 })

            const newPage = new PdfPage({ width: 400, height: 600 })
            manager.insert(10, newPage)

            expect(manager.count()).toBe(2)
            const lastPage = manager.get(1)
            expect(lastPage?.objectNumber).toBe(newPage.objectNumber)
        })

        it('should add page to document if not already added', () => {
            const newPage = new PdfPage({ width: 400, height: 600 })
            expect(newPage.objectNumber).toBe(-1)

            manager.insert(0, newPage)

            expect(newPage.objectNumber).toBeGreaterThan(-1)
        })
    })

    describe('iteration', () => {
        it('should iterate over all pages', () => {
            manager.create({ width: 612, height: 792 })
            manager.create({ width: 400, height: 600 })
            manager.create({ width: 300, height: 400 })

            const pages = [...manager]
            expect(pages).toHaveLength(3)

            let count = 0
            for (const page of manager) {
                expect(page).toBeInstanceOf(PdfPage)
                count++
            }
            expect(count).toBe(3)
        })

        it('should iterate over empty document', () => {
            const pages = [...manager]
            expect(pages).toHaveLength(0)
        })
    })

    describe('integration with content and serialization', () => {
        it('should create a PDF document with pages and content', async () => {
            const document = new PdfDocument()

            // Create first page
            const page1 = document.pages.create({ width: 612, height: 792 })
            expect(page1).toBeDefined()
            expect(page1.getDimensions()).toEqual({ width: 612, height: 792 })

            // Create content for first page
            const content1 = new PdfContentStream()
            content1.beginText()
            content1.setFont('Helvetica', 24)
            content1.moveTo(50, 700)
            content1.showLiteralText('Page 1')
            content1.endText()
            content1.build()

            const stream1 = new PdfStream({
                header: new PdfDictionary(),
                original: content1.contentStream,
            })
            const streamObj1 = new PdfIndirectObject({ content: stream1 })
            document.add(streamObj1)
            page1.addContentStream(streamObj1.reference)

            // Create second page with different dimensions
            const page2 = document.pages.create({
                width: 792,
                height: 612,
                rotate: 90,
            })
            expect(page2.getDimensions()).toEqual({ width: 792, height: 612 })
            expect(page2.rotate).toBe(90)

            // Create content for second page
            const content2 = new PdfContentStream()
            content2.beginText()
            content2.setFont('Helvetica', 24)
            content2.moveTo(50, 500)
            content2.showLiteralText('Page 2 (Rotated)')
            content2.endText()
            content2.build()

            const stream2 = new PdfStream({
                header: new PdfDictionary(),
                original: content2.contentStream,
            })
            const streamObj2 = new PdfIndirectObject({ content: stream2 })
            document.add(streamObj2)
            page2.addContentStream(streamObj2.reference)

            // Verify page count
            expect(document.pages.count()).toBe(2)

            // Verify we can retrieve pages
            const retrievedPage1 = document.pages.get(0)
            expect(retrievedPage1).toBeDefined()
            expect(retrievedPage1?.objectNumber).toBe(page1.objectNumber)

            const retrievedPage2 = document.pages.get(1)
            expect(retrievedPage2).toBeDefined()
            expect(retrievedPage2?.objectNumber).toBe(page2.objectNumber)

            // Verify iteration
            const allPages = document.pages.getAll()
            expect(allPages).toHaveLength(2)

            // Commit and serialize
            await document.commit()
            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0)
        })

        it('should support page insertion and removal with serialization', async () => {
            const document = new PdfDocument()

            // Create 3 pages
            const page1 = document.pages.create({ width: 612, height: 792 })
            const page2 = document.pages.create({ width: 612, height: 792 })
            const page3 = document.pages.create({ width: 612, height: 792 })

            expect(document.pages.count()).toBe(3)

            // Remove middle page
            const removed = document.pages.remove(1)
            expect(removed).toBeDefined()
            expect(removed?.objectNumber).toBe(page2.objectNumber)
            expect(document.pages.count()).toBe(2)

            // Verify remaining pages
            const firstPage = document.pages.get(0)
            const secondPage = document.pages.get(1)
            expect(firstPage?.objectNumber).toBe(page1.objectNumber)
            expect(secondPage?.objectNumber).toBe(page3.objectNumber)

            // Insert a new page at the beginning
            const newPage = document.pages.create({ width: 400, height: 600 })
            document.pages.remove(2) // Remove it from the end
            document.pages.insert(0, newPage) // Insert at beginning

            expect(document.pages.count()).toBe(3)
            const firstPageNow = document.pages.get(0)
            expect(firstPageNow?.objectNumber).toBe(newPage.objectNumber)
            expect(firstPageNow?.getDimensions()).toEqual({
                width: 400,
                height: 600,
            })

            await document.commit()
            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0)
        })

        it('should support multiple content streams per page', async () => {
            const document = new PdfDocument()
            const page = document.pages.create({ width: 612, height: 792 })

            // Add first content stream
            const content1 = new PdfContentStream()
            content1.beginText()
            content1.setFont('Helvetica', 18)
            content1.moveTo(50, 700)
            content1.showLiteralText('First Content')
            content1.endText()
            content1.build()

            const stream1 = new PdfStream({
                header: new PdfDictionary(),
                original: content1.contentStream,
            })
            const streamObj1 = new PdfIndirectObject({ content: stream1 })
            document.add(streamObj1)
            page.addContentStream(streamObj1.reference)

            // Add second content stream
            const content2 = new PdfContentStream()
            content2.beginText()
            content2.setFont('Helvetica', 18)
            content2.moveTo(50, 650)
            content2.showLiteralText('Second Content')
            content2.endText()
            content2.build()

            const stream2 = new PdfStream({
                header: new PdfDictionary(),
                original: content2.contentStream,
            })
            const streamObj2 = new PdfIndirectObject({ content: stream2 })
            document.add(streamObj2)
            page.addContentStream(streamObj2.reference)

            // Verify content streams are stored as array
            const contents = page.contents
            expect(contents).toBeDefined()

            await document.commit()
            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0)
        })

        it('should handle page boxes with serialization', async () => {
            const document = new PdfDocument()
            const page = document.pages.create({ width: 612, height: 792 })

            // Set crop box
            const cropBox = page.content.get('MediaBox')?.clone()
            if (cropBox) {
                page.cropBox = cropBox
            }

            // Verify boxes
            expect(page.mediaBox).toBeDefined()
            expect(page.cropBox).toBeDefined()

            await document.commit()
            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0)
        })

        it('should support iteration over pages with different dimensions', () => {
            const document = new PdfDocument()

            const pages = [
                document.pages.create({ width: 612, height: 792 }),
                document.pages.create({ width: 400, height: 600 }),
                document.pages.create({ width: 300, height: 400 }),
            ]

            // Test iteration
            let count = 0
            for (const page of document.pages) {
                expect(page).toBeDefined()
                expect(page.objectNumber).toBe(pages[count].objectNumber)
                count++
            }

            expect(count).toBe(3)
        })
    })
})
