import { TimeStampAuthority } from '../types.js'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base.js'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier.js'
import { TimeStampReq } from 'pki-lite/timestamp/TimeStampReq.js'
import { TSTInfo } from 'pki-lite/timestamp/TSTInfo.js'
import { MessageImprint } from 'pki-lite/timestamp/MessageImprint.js'
import { SignedData } from 'pki-lite/pkcs7/SignedData.js'
import { fetchRevocationInfo } from '../utils.js'
import { Certificate } from 'pki-lite/x509/Certificate.js'
import { OIDs } from 'pki-lite/core/OIDs.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'

type SigningInfo = {
    timeStampAuthority: TimeStampAuthority
}

/**
 * RFC 3161 timestamp signature object (ETSI.RFC3161).
 * Creates document timestamps using a Time Stamp Authority (TSA).
 */
export class PdfEtsiRfc3161SignatureObject extends PdfSignatureObject {
    static {
        PdfSignatureObject.registerSubFilter(
            'ETSI.RFC3161',
            PdfEtsiRfc3161SignatureObject,
        )
    }

    signingInfo?: SigningInfo

    static create(
        options: PdfSignatureSignOptions & {
            timeStampAuthority?: TimeStampAuthority
        } = {},
    ): PdfEtsiRfc3161SignatureObject {
        const sig = new PdfEtsiRfc3161SignatureObject()
        sig.content = PdfSignatureObject.buildDictionary(
            options,
            'ETSI.RFC3161',
        )
        sig.signingInfo = {
            timeStampAuthority: options.timeStampAuthority ?? {
                url: 'https://freetsa.org/tsr',
            },
        }
        return sig
    }

    sign: PdfSignatureObject['sign'] = async (options) => {
        if (!this.signingInfo) {
            throw new Error('Set signingInfo before signing')
        }

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
            url: this.signingInfo.timeStampAuthority.url,
            username: this.signingInfo.timeStampAuthority.username,
            password: this.signingInfo.timeStampAuthority.password,
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

    verify: PdfSignatureObject['verify'] = async (options) => {
        const { bytes, certificateValidation } = options

        const digestAlgorithm =
            DigestAlgorithmIdentifier.digestAlgorithm('SHA-512')

        const expectedMessageImprint = new MessageImprint({
            hashAlgorithm: digestAlgorithm,
            hashedMessage: await digestAlgorithm.digest(bytes),
        })

        try {
            const signedData = SignedData.fromCms(this.signedBytes)

            const encapContentInfo = signedData.encapContentInfo

            if (
                encapContentInfo.eContentType.toString() !== OIDs.PKCS7.TST_INFO
            ) {
                return {
                    valid: false,
                    reasons: [
                        `Invalid content type: expected id-ct-TSTInfo (${OIDs.PKCS7.TST_INFO}), got ${encapContentInfo.eContentType.toString()}`,
                    ],
                }
            }

            if (!encapContentInfo.eContent) {
                return {
                    valid: false,
                    reasons: ['No TSTInfo content found in timestamp token'],
                }
            }

            const tstInfo = TSTInfo.fromDer(encapContentInfo.eContent)

            const tstMessageImprint = tstInfo.messageImprint
            if (
                tstMessageImprint.hashAlgorithm.algorithm.toString() !==
                expectedMessageImprint.hashAlgorithm.algorithm.toString()
            ) {
                return {
                    valid: false,
                    reasons: [
                        `Hash algorithm mismatch: TSTInfo uses ${tstMessageImprint.hashAlgorithm.algorithm.toString()}, expected ${expectedMessageImprint.hashAlgorithm.algorithm.toString()}`,
                    ],
                }
            }

            const tstHash = tstMessageImprint.hashedMessage
            const expectedHash = expectedMessageImprint.hashedMessage

            if (tstHash.length !== expectedHash.length) {
                return {
                    valid: false,
                    reasons: [
                        `Hash length mismatch: TSTInfo has ${tstHash.length} bytes, expected ${expectedHash.length} bytes`,
                    ],
                }
            }

            for (let i = 0; i < tstHash.length; i++) {
                if (tstHash[i] !== expectedHash[i]) {
                    return {
                        valid: false,
                        reasons: [
                            'Message imprint mismatch: the timestamp does not match the document',
                        ],
                    }
                }
            }

            const certValidationOptions =
                certificateValidation === true
                    ? {}
                    : certificateValidation || undefined

            if (options.certificateValidation) {
                const certificates = signedData.certificates ?? []
                for (const cert of certificates) {
                    if (!(cert instanceof Certificate)) {
                        continue
                    }

                    if (!(await cert.validate(certValidationOptions))) {
                        return {
                            valid: false,
                            reasons: [
                                'Certificate validation failed for timestamp signer',
                            ],
                        }
                    }
                }
            }

            return {
                valid: true,
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
