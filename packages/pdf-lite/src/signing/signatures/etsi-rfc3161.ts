import {
    TimeStampAuthority,
    PdfSignatureVerificationOptions,
    PdfSignatureVerificationResult,
} from '../types'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { TimeStampReq } from 'pki-lite/timestamp/TimeStampReq'
import { MessageImprint } from 'pki-lite/timestamp/MessageImprint'
import { SignedData } from 'pki-lite/pkcs7/SignedData'
import { OIDs } from 'pki-lite/core/OIDs.js'
import { OctetString } from 'pki-lite/asn1/OctetString'
import { fetchRevocationInfo } from '../utils'

/**
 * RFC 3161 timestamp signature object (ETSI.RFC3161).
 * Creates document timestamps using a Time Stamp Authority (TSA).
 *
 * @example
 * ```typescript
 * const timestamp = new PdfEtsiRfc3161SignatureObject({
 *     timeStampAuthority: { url: 'http://timestamp.example.com' }
 * })
 * ```
 */
export class PdfEtsiRfc3161SignatureObject extends PdfSignatureObject {
    /** Timestamp authority configuration. */
    timeStampAuthority: TimeStampAuthority

    /**
     * Creates a new RFC 3161 timestamp signature object.
     *
     * @param options - Configuration including optional TSA settings.
     */
    constructor(
        options: PdfSignatureSignOptions & {
            timeStampAuthority?: TimeStampAuthority
            name?: string
            reason?: string
            contactInfo?: string
            location?: string
        },
    ) {
        super({
            ...options,
            subfilter: 'ETSI.RFC3161',
        })

        this.timeStampAuthority = options.timeStampAuthority ?? {
            url: 'https://freetsa.org/tsr',
        }
    }

    /**
     * Creates a timestamp for the document bytes.
     *
     * @param options - Signing options with bytes to timestamp.
     * @returns The timestamp token and revocation information.
     * @throws Error if no timestamp token is received.
     */
    sign: PdfSignatureObject['sign'] = async (options) => {
        const { bytes } = options

        const digestAlgorithm =
            DigestAlgorithmIdentifier.digestAlgorithm('SHA-512')

        const timestampResponse = await TimeStampReq.create({
            messageImprint: new MessageImprint({
                hashAlgorithm: digestAlgorithm,
                hashedMessage: await digestAlgorithm.digest(bytes),
            }),
            certReq: true,
        }).request({
            url: this.timeStampAuthority.url,
            username: this.timeStampAuthority.username,
            password: this.timeStampAuthority.password,
        })

        if (!timestampResponse.timeStampToken) {
            throw new Error(
                'No timestamp token received. Response: ' +
                    timestampResponse.status,
            )
        }

        const signatureBytes = timestampResponse.timeStampToken.toDer()

        const signerCerts = SignedData.fromCms(signatureBytes).certificates
        const revocationInfo = await fetchRevocationInfo({
            certificates: signerCerts?.map((c) => c.toDer()) ?? [],
        })

        return {
            signedBytes: signatureBytes,
            revocationInfo,
        }
    }

    /**
     * Verifies the timestamp signature against the provided document bytes.
     *
     * @param options - Verification options including the signed bytes.
     * @returns The verification result.
     */
    verify: PdfSignatureObject['verify'] = async (options) => {
        const { bytes, certificateValidation } = options

        try {
            const signedData = SignedData.fromCms(this.signedBytes)

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
                            ).digest(bytes)

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
                data: bytes,
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
}
