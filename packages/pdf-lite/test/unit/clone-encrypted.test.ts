import { describe, expect, it } from 'vitest'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfNumber } from '../../src/core/objects/pdf-number'
import { PdfObjectReference } from '../../src/core/objects/pdf-object-reference'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { PdfDocument } from '../../src/pdf/pdf-document'

function createPage(
    contentStreamRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const pageDict = new PdfDictionary()
    pageDict.set('Type', new PdfName('Page'))
    pageDict.set(
        'MediaBox',
        new PdfArray([
            new PdfNumber(0),
            new PdfNumber(0),
            new PdfNumber(612),
            new PdfNumber(792),
        ]),
    )
    pageDict.set('Contents', contentStreamRef)
    return new PdfIndirectObject({ content: pageDict })
}

function createPages(
    pages: PdfIndirectObject<PdfDictionary>[],
): PdfIndirectObject<PdfDictionary> {
    const pagesDict = new PdfDictionary()
    pagesDict.set('Type', new PdfName('Pages'))
    pagesDict.set('Kids', new PdfArray(pages.map((x) => x.reference)))
    pagesDict.set('Count', new PdfNumber(pages.length))
    return new PdfIndirectObject({ content: pagesDict })
}

function createCatalog(
    pagesRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const catalogDict = new PdfDictionary()
    catalogDict.set('Type', new PdfName('Catalog'))
    catalogDict.set('Pages', pagesRef)
    return new PdfIndirectObject({ content: catalogDict })
}

function createFont(): PdfIndirectObject<PdfDictionary> {
    const fontDict = new PdfDictionary()
    fontDict.set('Type', new PdfName('Font'))
    fontDict.set('Subtype', new PdfName('Type1'))
    fontDict.set('BaseFont', new PdfName('Helvetica'))
    return new PdfIndirectObject({ content: fontDict })
}

function createResources(
    fontRef: PdfObjectReference,
): PdfIndirectObject<PdfDictionary> {
    const resourcesDict = new PdfDictionary()
    const fontDict = new PdfDictionary()
    fontDict.set('F1', fontRef)
    resourcesDict.set('Font', fontDict)
    return new PdfIndirectObject({ content: resourcesDict })
}

async function createEncryptedPdf(password: string): Promise<Uint8Array> {
    const document = new PdfDocument({ password })

    const font = createFont()
    document.add(font)
    const resources = createResources(font.reference)
    document.add(resources)

    const contentStream = new PdfIndirectObject({
        content: new PdfStream({
            header: new PdfDictionary(),
            original: 'BT /F1 24 Tf 100 700 Td (Hello World) Tj ET',
        }),
    })

    const page = createPage(contentStream.reference)
    page.content.set('Resources', resources.reference)
    document.add(page)

    const pages = createPages([page])
    page.content.set('Parent', pages.reference)
    document.add(pages)

    const catalog = createCatalog(pages.reference)
    document.add(catalog)

    document.trailerDict.set('Root', catalog.reference)
    document.add(contentStream)

    await document.finalize()
    return document.toBytes()
}

async function newDocument(
    bytes: Uint8Array,
    options?: {
        password?: string
        ownerPassword?: string
        incremental?: boolean
    },
): Promise<PdfDocument> {
    // Force TypeScript to treat this as ByteArray
    const byteArray = new Uint8Array(bytes.buffer) as Uint8Array<ArrayBuffer>
    return PdfDocument.fromBytes([byteArray], options)
}

describe('Clone Encrypted PDF', () => {
    it('should read encrypted PDF, clone, finalize, and toBytes', async () => {
        const password = 'testpassword'

        // Step 1: Create an encrypted PDF
        const encryptedBytes = await createEncryptedPdf(password)

        // Step 2: Read the encrypted PDF
        const document = await newDocument(encryptedBytes, {
            password,
        })

        // Verify it was decrypted and has a security handler
        expect(document.securityHandler).toBeDefined()

        // Step 3: Clone the document
        const cloned = document.clone()

        // Verify clone has a security handler
        expect(cloned.securityHandler).toBeDefined()

        // Step 4: Finalize the cloned document
        await cloned.finalize()

        // Step 5: Convert to bytes
        const clonedBytes = cloned.toBytes()
        expect(clonedBytes.length).toBeGreaterThan(0)

        // Step 6: Verify the cloned bytes can be read back with the same password
        const reloaded = await newDocument(clonedBytes, {
            password,
        })
        expect(reloaded.securityHandler).toBeDefined()
        expect(reloaded.pages.kids.length).toBeGreaterThan(0)
    })

    it('should produce valid output when cloning without modification', async () => {
        const password = 'testpassword'

        const encryptedBytes = await createEncryptedPdf(password)

        // Read, clone immediately, finalize, toBytes
        const document = await newDocument(encryptedBytes, {
            password,
        })
        const cloned = document.clone()
        await cloned.finalize()
        const clonedBytes = cloned.toBytes()

        // Should be re-readable
        const reloaded = await newDocument(clonedBytes, {
            password,
        })
        expect(reloaded.securityHandler).toBeDefined()
    })

    it('should handle clone of encrypted PDF with content stream modification', async () => {
        const password = 'testpassword'

        const encryptedBytes = await createEncryptedPdf(password)

        // Read the encrypted PDF
        const document = await newDocument(encryptedBytes, {
            password,
        })

        // Modify a content stream via the pages tree
        const kids = document.pages.kids
        expect(kids.length).toBeGreaterThan(0)

        const firstPage = kids[0]
        const contentsRef = (firstPage.content as PdfDictionary).get('Contents')
        if (contentsRef instanceof PdfObjectReference) {
            const resolved = contentsRef.resolve()
            if (resolved.content instanceof PdfStream) {
                resolved.content.original =
                    'BT /F1 18 Tf 100 600 Td (Modified Content) Tj ET'
            }
        }

        // Clone and finalize
        const cloned = document.clone()
        await cloned.finalize()
        const clonedBytes = cloned.toBytes()

        // Should be readable
        const reloaded = await newDocument(clonedBytes, {
            password,
        })
        expect(reloaded.securityHandler).toBeDefined()
        expect(reloaded.pages.kids.length).toBeGreaterThan(0)
    })

    it('should not double-encrypt objects when cloning an already-encrypted document', async () => {
        const password = 'testpassword'

        const encryptedBytes = await createEncryptedPdf(password)

        const document = await newDocument(encryptedBytes, {
            password,
        })

        const cloned = document.clone()
        await cloned.finalize()
        const clonedBytes = cloned.toBytes()

        // Read back and verify content streams are properly decrypted
        const reloaded = await newDocument(clonedBytes, {
            password,
        })

        // Find the content stream and verify it decrypts properly
        const kids = reloaded.pages.kids
        expect(kids.length).toBeGreaterThan(0)

        const firstPage = kids[0]
        const contentsRef = (firstPage.content as PdfDictionary).get('Contents')
        if (contentsRef instanceof PdfObjectReference) {
            const resolved = contentsRef.resolve()
            if (resolved.content instanceof PdfStream) {
                const streamContent = new TextDecoder().decode(
                    resolved.content.original as Uint8Array,
                )
                expect(streamContent).toContain('Hello World')
            }
        }
    })

    it('should not mutate the original security handler when finalizing the clone', async () => {
        const password = 'testpassword'

        const encryptedBytes = await createEncryptedPdf(password)
        const document = await newDocument(encryptedBytes, {
            password,
        })

        const originalHandler = document.securityHandler
        expect(originalHandler).toBeDefined()

        // Clone and finalize — this should not touch the original handler
        const cloned = document.clone()
        expect(cloned.securityHandler).not.toBe(originalHandler)

        await cloned.finalize()
        cloned.toBytes()

        // Original handler's dict should be unchanged
        expect(document.securityHandler).toBe(originalHandler)

        // Original document should still be usable for another clone
        const cloned2 = document.clone()
        expect(cloned2.securityHandler).not.toBe(originalHandler)
        await cloned2.finalize()
        const bytes2 = cloned2.toBytes()

        const reloaded = await newDocument(bytes2, { password })
        expect(reloaded.securityHandler).toBeDefined()
    })

    it('should support multiple sequential clone-finalize cycles', async () => {
        const password = 'testpassword'

        const encryptedBytes = await createEncryptedPdf(password)

        // First cycle: read → clone → finalize → toBytes
        const doc1 = await newDocument(encryptedBytes, {
            password,
        })
        const cloned1 = doc1.clone()
        await cloned1.finalize()
        const bytes1 = cloned1.toBytes()

        // Second cycle: read the output → clone → finalize → toBytes
        const doc2 = await newDocument(bytes1, { password })
        const cloned2 = doc2.clone()
        await cloned2.finalize()
        const bytes2 = cloned2.toBytes()

        // Should still be valid
        const reloaded = await newDocument(bytes2, { password })
        expect(reloaded.securityHandler).toBeDefined()
        expect(reloaded.pages.kids.length).toBeGreaterThan(0)
    })
})
