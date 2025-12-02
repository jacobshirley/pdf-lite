import { SignedData } from 'pki-lite/pkcs7/SignedData'
import { Certificate } from 'pki-lite/x509/Certificate'
import { CertificateList } from 'pki-lite/x509/CertificateList'
import { OCSPResponse } from 'pki-lite/ocsp/OCSPResponse'
import { OctetString } from 'pki-lite/asn1/OctetString'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { OIDs } from 'pki-lite/core/OIDs.js'
import type { CertificateValidationOptions } from 'pki-lite/core/CertificateValidator.js'
import { ByteArray } from '../types'
import {
    PdfSignatureVerificationResult,
    PdfSignatureVerificationOptions,
    PdfSignatureSubType,
    RevocationInfo,
} from './types'

/**
 * Options for PDF signature verification.
 */
export type PdfSignatureVerifierOptions = {
    /** The signature bytes (Contents field from signature dictionary). */
    signatureBytes: ByteArray
    /** The signature subfilter type. */
    subfilter: PdfSignatureSubType
    /** Optional certificates from the Cert entry (for adbe.x509.rsa_sha1). */
    certificates?: ByteArray[]
}

/**
 * Handles digital signature verification for PDF documents.
 * Supports verification of PKCS#7, CAdES, and X509 RSA-SHA1 signatures.
 *
 * @example
 * ```typescript
 * const verifier = new PdfSignatureVerifier({
 *     signatureBytes: signature.signedBytes,
 *     subfilter: 'adbe.pkcs7.detached'
 * })
 * const result = await verifier.verify({ bytes: signedDocumentBytes })
 * if (result.valid) {
 *     console.log('Signature is valid')
 * } else {
 *     console.log('Signature verification failed:', result.reasons)
 * }
 * ```
 */
export class PdfSignatureVerifier {
    /** The signature bytes to verify. */
    readonly signatureBytes: ByteArray
    /** The signature subfilter type. */
    readonly subfilter: PdfSignatureSubType
    /** Optional certificates from the Cert entry. */
    readonly certificates?: ByteArray[]

    /**
     * Creates a new PDF signature verifier.
     *
     * @param options - Verifier configuration options.
     */
    constructor(options: PdfSignatureVerifierOptions) {
        this.signatureBytes = options.signatureBytes
        this.subfilter = options.subfilter
        this.certificates = options.certificates
    }

    /**
     * Verifies the signature against the provided document bytes.
     *
     * @param options - Verification options including the signed bytes.
     * @returns The verification result.
     */
    async verify(
        options: PdfSignatureVerificationOptions,
    ): Promise<PdfSignatureVerificationResult> {
        const { bytes, certificateValidation } = options

        switch (this.subfilter) {
            case 'adbe.pkcs7.detached':
            case 'ETSI.CAdES.detached':
            case 'ETSI.RFC3161':
                return this.verifyPkcs7Detached(bytes, certificateValidation)
            case 'adbe.pkcs7.sha1':
                return this.verifyPkcs7Sha1(bytes, certificateValidation)
            case 'adbe.x509.rsa_sha1':
                return this.verifyX509RsaSha1(bytes, certificateValidation)
            default:
                return {
                    valid: false,
                    reasons: [
                        `Unsupported signature subfilter: ${this.subfilter}`,
                    ],
                }
        }
    }

    /**
     * Verifies a PKCS#7 detached signature (adbe.pkcs7.detached, ETSI.CAdES.detached, ETSI.RFC3161).
     */
    private async verifyPkcs7Detached(
        data: ByteArray,
        certificateValidation?: CertificateValidationOptions | boolean,
    ): Promise<PdfSignatureVerificationResult> {
        try {
            const signedData = SignedData.fromCms(this.signatureBytes)

            // Verify message digest if signed attributes are present
            // This is necessary because pki-lite's verify doesn't check the message digest
            // when signed attributes are present
            if (signedData.signerInfos.length > 0) {
                const signerInfo = signedData.signerInfos[0]
                if (signerInfo.signedAttrs) {
                    const messageDigestAttr = signerInfo.signedAttrs.find(
                        (attr) => attr.type.is(OIDs.PKCS9.MESSAGE_DIGEST),
                    )
                    if (messageDigestAttr) {
                        // Get the expected digest from the signed attributes
                        const expectedDigest =
                            messageDigestAttr.values[0].parseAs(
                                OctetString,
                            ).bytes

                        // Compute the actual digest of the data
                        const digestAlgorithm =
                            signerInfo.digestAlgorithm.toHashAlgorithm()
                        const actualDigest =
                            await DigestAlgorithmIdentifier.digestAlgorithm(
                                digestAlgorithm,
                            ).digest(data)

                        // Compare digests
                        if (!this.compareArrays(expectedDigest, actualDigest)) {
                            return {
                                valid: false,
                                reasons: [
                                    'Message digest does not match signed content',
                                ],
                            }
                        }
                    }
                }
            }

            const certValidationOptions =
                certificateValidation === true
                    ? {}
                    : certificateValidation || undefined

            const result = await signedData.verify({
                data,
                certificateValidation: certValidationOptions,
            })

            if (result.valid) {
                return { valid: true }
            } else {
                return {
                    valid: false,
                    reasons: result.reasons,
                }
            }
        } catch (error) {
            return {
                valid: false,
                reasons: [
                    `Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`,
                ],
            }
        }
    }

    /**
     * Verifies a PKCS#7 SHA-1 signature (adbe.pkcs7.sha1).
     * The SHA-1 hash of the document is embedded in the SignedData.
     */
    private async verifyPkcs7Sha1(
        data: ByteArray,
        certificateValidation?: CertificateValidationOptions | boolean,
    ): Promise<PdfSignatureVerificationResult> {
        try {
            const signedData = SignedData.fromCms(this.signatureBytes)

            // For adbe.pkcs7.sha1, the signed content is the SHA-1 hash of the document
            // We need to compute the SHA-1 hash of the data and compare with the embedded content
            const expectedHash =
                await DigestAlgorithmIdentifier.digestAlgorithm('SHA-1').digest(
                    data,
                )

            const certValidationOptions =
                certificateValidation === true
                    ? {}
                    : certificateValidation || undefined

            // Verify the signature with the hash as the data (non-detached mode)
            const result = await signedData.verify({
                certificateValidation: certValidationOptions,
            })

            if (!result.valid) {
                return {
                    valid: false,
                    reasons: result.reasons,
                }
            }

            // Additionally verify that the embedded hash matches the document hash
            const embeddedContent = signedData.encapContentInfo.eContent
            if (!embeddedContent) {
                return {
                    valid: false,
                    reasons: ['No embedded content in SignedData'],
                }
            }

            // Compare the hashes
            if (!this.compareArrays(embeddedContent, expectedHash)) {
                return {
                    valid: false,
                    reasons: [
                        'Document hash does not match embedded signature hash',
                    ],
                }
            }

            return { valid: true }
        } catch (error) {
            return {
                valid: false,
                reasons: [
                    `Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`,
                ],
            }
        }
    }

    /**
     * Verifies an X.509 RSA-SHA1 signature (adbe.x509.rsa_sha1).
     */
    private async verifyX509RsaSha1(
        data: ByteArray,
        _certificateValidation?: CertificateValidationOptions | boolean,
    ): Promise<PdfSignatureVerificationResult> {
        try {
            if (!this.certificates || this.certificates.length === 0) {
                return {
                    valid: false,
                    reasons: [
                        'No certificates available for adbe.x509.rsa_sha1 verification',
                    ],
                }
            }

            // Parse the signature as an OctetString
            const signatureOctetString = OctetString.fromDer(
                this.signatureBytes,
            )
            const signatureValue = signatureOctetString.bytes

            // Get the signer certificate (first certificate in the chain)
            const signerCertificate = Certificate.fromDer(this.certificates[0])
            const publicKeyInfo =
                signerCertificate.tbsCertificate.subjectPublicKeyInfo

            // Import the public key and verify the signature
            const algorithm = {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-1',
            }

            const cryptoKey = await crypto.subtle.importKey(
                'spki',
                publicKeyInfo.toDer(),
                algorithm,
                false,
                ['verify'],
            )

            const isValid = await crypto.subtle.verify(
                algorithm,
                cryptoKey,
                signatureValue,
                data,
            )

            if (isValid) {
                return { valid: true }
            } else {
                return {
                    valid: false,
                    reasons: ['RSA-SHA1 signature verification failed'],
                }
            }
        } catch (error) {
            return {
                valid: false,
                reasons: [
                    `Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`,
                ],
            }
        }
    }

    /**
     * Extracts revocation information from the signature if available.
     *
     * @returns Revocation information if found, undefined otherwise.
     */
    extractRevocationInfo(): RevocationInfo | undefined {
        try {
            // Only PKCS#7 based signatures may contain revocation info
            if (
                this.subfilter !== 'adbe.pkcs7.detached' &&
                this.subfilter !== 'adbe.pkcs7.sha1' &&
                this.subfilter !== 'ETSI.CAdES.detached' &&
                this.subfilter !== 'ETSI.RFC3161'
            ) {
                return undefined
            }

            const signedData = SignedData.fromCms(this.signatureBytes)

            const crls: ByteArray[] = []
            const ocsps: ByteArray[] = []

            // Extract CRLs and OCSP responses from the SignedData
            if (signedData.crls) {
                for (const revInfo of signedData.crls) {
                    if (revInfo instanceof CertificateList) {
                        crls.push(revInfo.toDer())
                    } else if (revInfo instanceof OCSPResponse) {
                        ocsps.push(revInfo.toDer())
                    }
                }
            }

            if (crls.length === 0 && ocsps.length === 0) {
                return undefined
            }

            return {
                crls: crls.length > 0 ? crls : undefined,
                ocsps: ocsps.length > 0 ? ocsps : undefined,
            }
        } catch {
            return undefined
        }
    }

    /**
     * Extracts certificates from the signature.
     *
     * @returns Array of certificate bytes, or empty array if none found.
     */
    extractCertificates(): ByteArray[] {
        try {
            // For X509 RSA-SHA1, certificates are provided via the Cert entry
            if (this.subfilter === 'adbe.x509.rsa_sha1') {
                return this.certificates || []
            }

            // For PKCS#7 based signatures, extract from SignedData
            const signedData = SignedData.fromCms(this.signatureBytes)
            return signedData.certificates?.map((cert) => cert.toDer()) || []
        } catch {
            return []
        }
    }

    /**
     * Compares two byte arrays for equality.
     */
    private compareArrays(a: ByteArray, b: ByteArray): boolean {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false
            }
        }
        return true
    }
}
