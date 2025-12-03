import { describe, it, expect, beforeAll, vi } from 'vitest'
import { PdfAdbePkcs7DetachedSignatureObject } from '../../src/signing/signatures/adbe-pkcs7-detached'
import { PdfAdbePkcs7Sha1SignatureObject } from '../../src/signing/signatures/adbe-pkcs7-sha1'
import { PdfAdbePkcsX509RsaSha1SignatureObject } from '../../src/signing/signatures/adbe-x509-rsa-sha1'
import { PdfEtsiCadesDetachedSignatureObject } from '../../src/signing/signatures/etsi-cades-detached'
import { PdfSigner } from '../../src/signing/signer'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfNumber } from '../../src/core/objects/pdf-number'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { rsaSigningKeys } from './fixtures/rsa-2048'
import { stringToBytes } from '../../src/utils/stringToBytes'

describe('Signature Verification', () => {
    beforeAll(() => {
        vi.stubGlobal('fetch', vi.fn(fetch))
    })

    describe('adbe.pkcs7.detached verification', () => {
        it('should verify a valid PKCS7 detached signature', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcs7DetachedSignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: testData })

            expect(result.valid).toBe(true)
            expect(result.reasons).toBeUndefined()
        })

        it('should fail verification for tampered data', async () => {
            const testData = stringToBytes('Hello, PDF!')
            const tamperedData = stringToBytes('Hello, PDF! TAMPERED')

            const sigObj = new PdfAdbePkcs7DetachedSignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: tamperedData })

            expect(result.valid).toBe(false)
            expect(result.reasons).toBeDefined()
            expect(result.reasons?.length).toBeGreaterThan(0)
        })

        it('should verify signature with additional certificates', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcs7DetachedSignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                additionalCertificates: [rsaSigningKeys.caCert],
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: testData })

            expect(result.valid).toBe(true)
        })
    })

    describe('ETSI.CAdES.detached verification', () => {
        it('should verify a valid CAdES detached signature', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfEtsiCadesDetachedSignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: testData })

            expect(result.valid).toBe(true)
            expect(result.reasons).toBeUndefined()
        })

        it('should fail verification for tampered data', async () => {
            const testData = stringToBytes('Hello, PDF!')
            const tamperedData = stringToBytes('Hello, PDF! TAMPERED')

            const sigObj = new PdfEtsiCadesDetachedSignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: tamperedData })

            expect(result.valid).toBe(false)
            expect(result.reasons).toBeDefined()
        })
    })

    describe('adbe.pkcs7.sha1 verification', () => {
        it('should verify a valid PKCS7 SHA1 signature', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcs7Sha1SignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: testData })

            expect(result.valid).toBe(true)
            expect(result.reasons).toBeUndefined()
        })

        it('should fail verification for tampered data', async () => {
            const testData = stringToBytes('Hello, PDF!')
            const tamperedData = stringToBytes('Hello, PDF! TAMPERED')

            const sigObj = new PdfAdbePkcs7Sha1SignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: tamperedData })

            expect(result.valid).toBe(false)
            expect(result.reasons).toBeDefined()
        })
    })

    describe('adbe.x509.rsa_sha1 verification', () => {
        it('should verify a valid X509 RSA SHA1 signature', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcsX509RsaSha1SignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: testData })

            expect(result.valid).toBe(true)
            expect(result.reasons).toBeUndefined()
        })

        it('should fail verification for tampered data', async () => {
            const testData = stringToBytes('Hello, PDF!')
            const tamperedData = stringToBytes('Hello, PDF! TAMPERED')

            const sigObj = new PdfAdbePkcsX509RsaSha1SignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })
            sigObj.setSignedBytes(signedBytes)

            const result = await sigObj.verify({ bytes: tamperedData })

            expect(result.valid).toBe(false)
            expect(result.reasons).toBeDefined()
        })
    })
})

describe('PdfSigner.verify', () => {
    beforeAll(() => {
        vi.stubGlobal('fetch', vi.fn(fetch))
    })

    async function createBasicPDF(): Promise<PdfDocument> {
        const document = new PdfDocument()

        // Create font
        const font = new PdfIndirectObject({
            content: new PdfDictionary(),
        })
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('Type1'))
        font.content.set('BaseFont', new PdfName('Helvetica'))
        await document.commit(font)

        // Create resources
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
                original: 'BT /F1 24 Tf 100 700 Td (Test PDF) Tj ET',
            }),
        })
        await document.commit(contentStream)

        // Create page
        const page = new PdfIndirectObject({ content: new PdfDictionary() })
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

        // Create pages collection
        const pages = new PdfIndirectObject({ content: new PdfDictionary() })
        pages.content.set('Type', new PdfName('Pages'))
        pages.content.set('Kids', new PdfArray([page.reference]))
        pages.content.set('Count', new PdfNumber(1))
        page.content.set('Parent', pages.reference)
        await document.commit(pages)

        // Create catalog
        const catalog = new PdfIndirectObject({
            content: new PdfDictionary(),
        })
        catalog.content.set('Type', new PdfName('Catalog'))
        catalog.content.set('Pages', pages.reference)
        await document.commit(catalog)

        document.trailerDict.set('Root', catalog.reference)

        return document
    }

    it('should verify a signed PDF document', async () => {
        const document = await createBasicPDF()

        const sig = new PdfAdbePkcs7DetachedSignatureObject({
            privateKey: rsaSigningKeys.privateKey,
            certificate: rsaSigningKeys.cert,
            date: new Date('2024-01-01T12:00:00Z'),
        })
        await document.commit(sig)

        const signer = new PdfSigner()
        signer.useDocumentSecurityStore = false
        await signer.sign(document)

        const result = await signer.verify(document)

        expect(result.valid).toBe(true)
        expect(result.signatures).toHaveLength(1)
        expect(result.signatures[0].result.valid).toBe(true)
    })

    it('should return empty result for unsigned PDF document', async () => {
        const document = await createBasicPDF()

        const signer = new PdfSigner()
        const result = await signer.verify(document)

        expect(result.valid).toBe(true)
        expect(result.signatures).toHaveLength(0)
    })
})
