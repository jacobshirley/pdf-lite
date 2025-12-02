import { describe, it, expect, beforeAll, vi } from 'vitest'
import { PdfSignatureVerifier } from '../../src/signing/verifier'
import { PdfAdbePkcs7DetachedSignatureObject } from '../../src/signing/signatures/adbe-pkcs7-detached'
import { PdfAdbePkcs7Sha1SignatureObject } from '../../src/signing/signatures/adbe-pkcs7-sha1'
import { PdfAdbePkcsX509RsaSha1SignatureObject } from '../../src/signing/signatures/adbe-x509-rsa-sha1'
import { PdfEtsiCadesDetachedSignatureObject } from '../../src/signing/signatures/etsi-cades-detached'
import { rsaSigningKeys } from './fixtures/rsa-2048'
import { stringToBytes } from '../../src/utils/stringToBytes'

describe('PdfSignatureVerifier', () => {
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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.pkcs7.detached',
            })

            const result = await verifier.verify({ bytes: testData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.pkcs7.detached',
            })

            const result = await verifier.verify({ bytes: tamperedData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.pkcs7.detached',
            })

            const result = await verifier.verify({ bytes: testData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'ETSI.CAdES.detached',
            })

            const result = await verifier.verify({ bytes: testData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'ETSI.CAdES.detached',
            })

            const result = await verifier.verify({ bytes: tamperedData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.pkcs7.sha1',
            })

            const result = await verifier.verify({ bytes: testData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.pkcs7.sha1',
            })

            const result = await verifier.verify({ bytes: tamperedData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.x509.rsa_sha1',
                certificates: [rsaSigningKeys.cert],
            })

            const result = await verifier.verify({ bytes: testData })

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

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.x509.rsa_sha1',
                certificates: [rsaSigningKeys.cert],
            })

            const result = await verifier.verify({ bytes: tamperedData })

            expect(result.valid).toBe(false)
            expect(result.reasons).toBeDefined()
        })

        it('should fail verification without certificates', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcsX509RsaSha1SignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.x509.rsa_sha1',
                // No certificates provided
            })

            const result = await verifier.verify({ bytes: testData })

            expect(result.valid).toBe(false)
            expect(result.reasons).toContain(
                'No certificates available for adbe.x509.rsa_sha1 verification',
            )
        })
    })

    describe('extractCertificates', () => {
        it('should extract certificates from PKCS7 signature', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcs7DetachedSignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                additionalCertificates: [rsaSigningKeys.caCert],
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.pkcs7.detached',
            })

            const certs = verifier.extractCertificates()

            expect(certs.length).toBe(2)
            expect(certs[0]).toEqual(rsaSigningKeys.cert)
            expect(certs[1]).toEqual(rsaSigningKeys.caCert)
        })

        it('should return certificates from constructor for X509 RSA SHA1', async () => {
            const testData = stringToBytes('Hello, PDF!')

            const sigObj = new PdfAdbePkcsX509RsaSha1SignatureObject({
                privateKey: rsaSigningKeys.privateKey,
                certificate: rsaSigningKeys.cert,
                date: new Date('2024-01-01T12:00:00Z'),
            })

            const { signedBytes } = await sigObj.sign({ bytes: testData })

            const verifier = new PdfSignatureVerifier({
                signatureBytes: signedBytes,
                subfilter: 'adbe.x509.rsa_sha1',
                certificates: [rsaSigningKeys.cert, rsaSigningKeys.caCert],
            })

            const certs = verifier.extractCertificates()

            expect(certs.length).toBe(2)
            expect(certs[0]).toEqual(rsaSigningKeys.cert)
            expect(certs[1]).toEqual(rsaSigningKeys.caCert)
        })
    })

    describe('unsupported subfilter', () => {
        it('should return error for unsupported subfilter', async () => {
            const verifier = new PdfSignatureVerifier({
                signatureBytes: new Uint8Array([1, 2, 3]),
                // @ts-expect-error - testing unsupported subfilter
                subfilter: 'unsupported.subfilter',
            })

            const result = await verifier.verify({
                bytes: stringToBytes('test'),
            })

            expect(result.valid).toBe(false)
            expect(result.reasons).toContain(
                'Unsupported signature subfilter: unsupported.subfilter',
            )
        })
    })

    describe('error handling', () => {
        it('should handle invalid signature bytes gracefully', async () => {
            const verifier = new PdfSignatureVerifier({
                signatureBytes: new Uint8Array([1, 2, 3, 4, 5]),
                subfilter: 'adbe.pkcs7.detached',
            })

            const result = await verifier.verify({
                bytes: stringToBytes('test'),
            })

            expect(result.valid).toBe(false)
            expect(result.reasons).toBeDefined()
            expect(result.reasons?.[0]).toContain('Failed to verify signature')
        })
    })
})
