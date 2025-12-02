import { describe, it, expect, beforeAll, vi } from 'vitest'
import { PdfAdbePkcs7DetachedSignatureObject } from '../../src/signing/signatures/adbe-pkcs7-detached'
import { PdfAdbePkcs7Sha1SignatureObject } from '../../src/signing/signatures/adbe-pkcs7-sha1'
import { PdfAdbePkcsX509RsaSha1SignatureObject } from '../../src/signing/signatures/adbe-x509-rsa-sha1'
import { PdfEtsiCadesDetachedSignatureObject } from '../../src/signing/signatures/etsi-cades-detached'
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
