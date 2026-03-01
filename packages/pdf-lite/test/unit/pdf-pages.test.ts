import { describe, it, expect } from 'vitest'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { PdfPages } from '../../src/pdf/pdf-pages'
import { PdfPage } from '../../src/pdf/pdf-page'
import { ByteArray } from '../../src/types'
import { server } from 'vitest/browser'

const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

async function loadPdf(path: string): Promise<PdfDocument> {
    const pdfBuffer = base64ToBytes(
        await server.commands.readFile(path, { encoding: 'base64' }),
    )
    return PdfDocument.fromBytes([pdfBuffer])
}

describe('PdfPages', () => {
    it('should resolve pages from document root', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        expect(pages).toBeDefined()
        expect(pages).toBeInstanceOf(PdfPages)
    })

    it('should return kids as resolved PdfPage instances', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        const kids = pages.kids
        expect(kids.length).toBeGreaterThan(0)
        for (const kid of kids) {
            expect(kid instanceof PdfPage || kid instanceof PdfPages).toBe(true)
        }
    })

    it('should iterate over leaf pages via Symbol.iterator', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        const iterated = [...pages]
        expect(iterated.length).toBeGreaterThan(0)
        for (const page of iterated) {
            expect(page).toBeInstanceOf(PdfPage)
        }
    })

    it('should have a count matching the number of iterable pages', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        const iterated = [...pages]
        expect(pages.count).toBe(iterated.length)
    })

    it('should have no parent on the root Pages node', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        expect(pages.parentRef).toBeNull()
        expect(pages.parent).toBeNull()
    })
})

describe('PdfPage', () => {
    it('should resolve parent as PdfPages', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        const firstPage = [...pages][0]
        expect(firstPage).toBeInstanceOf(PdfPage)
        expect(firstPage.parent).toBeInstanceOf(PdfPages)
    })

    it('should have parentRef as a raw reference', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        const firstPage = pages.get(0)
        expect(firstPage.parentRef).toBeDefined()
        expect(firstPage.parentRef.objectNumber).toBeGreaterThan(0)
    })

    it('should have parent pointing back to the root Pages node', async () => {
        const document = await loadPdf('./test/unit/fixtures/template.pdf')
        const pages = document.pages
        const firstPage = pages.get(0)
        expect(firstPage.parent.objectNumber).toBe(pages.objectNumber)
    })
})
