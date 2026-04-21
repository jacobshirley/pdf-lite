import { RevocationInfo, TimeStampAuthority } from '../types.js'
import { SignedData } from 'pki-lite/pkcs7/SignedData.js'
import { Certificate } from 'pki-lite/x509/Certificate.js'
import { SignerInfo } from 'pki-lite/pkcs7/SignerInfo.js'
import { Attribute } from 'pki-lite/x509/Attribute.js'
import { RevocationInfoArchival } from 'pki-lite/adobe/RevocationInfoArchival.js'
import { CertificateList } from 'pki-lite/x509/CertificateList.js'
import { OCSPResponse } from 'pki-lite/ocsp/OCSPResponse.js'
import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo.js'
import { OtherRevInfo } from 'pki-lite/adobe/OtherRevInfo.js'
import { AsymmetricEncryptionAlgorithmParams } from 'pki-lite/core/index.js'
import { fetchRevocationInfo } from '../utils.js'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base.js'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier.js'
import { ByteArray } from '../../types.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'

type SigningInfo = {
    privateKey: ByteArray
    certificate: ByteArray
    additionalCertificates: ByteArray[]
    issuerCertificate?: ByteArray
    revocationInfo?: RevocationInfo | 'fetch'
    timeStampAuthority?: TimeStampAuthority
}

/**
 * PKCS#7 SHA-1 signature object (adbe.pkcs7.sha1).
 * Creates CMS SignedData with SHA-1 hash embedded as signed content.
 */
export class PdfAdbePkcs7Sha1SignatureObject extends PdfSignatureObject {
    static {
        PdfSignatureObject.registerSubFilter(
            'adbe.pkcs7.sha1',
            PdfAdbePkcs7Sha1SignatureObject,
        )
    }

    static readonly ALGORITHM: AsymmetricEncryptionAlgorithmParams = {
        type: 'RSASSA_PKCS1_v1_5',
        params: {
            hash: 'SHA-1',
        },
    }

    signingInfo?: SigningInfo

    static create(
        options: PdfSignatureSignOptions & {
            privateKey: ByteArray
            certificate: ByteArray
            issuerCertificate?: ByteArray
            additionalCertificates?: ByteArray[]
            revocationInfo?: RevocationInfo | 'fetch'
            timeStampAuthority?: TimeStampAuthority | true
        },
    ): PdfAdbePkcs7Sha1SignatureObject {
        const sig = new PdfAdbePkcs7Sha1SignatureObject()
        sig.content = PdfSignatureObject.buildDictionary(
            options,
            'adbe.pkcs7.sha1',
        )
        sig.signingInfo = {
            privateKey: options.privateKey,
            certificate: options.certificate,
            issuerCertificate: options.issuerCertificate,
            additionalCertificates: options.additionalCertificates ?? [],
            revocationInfo: options.revocationInfo,
            timeStampAuthority:
                options.timeStampAuthority === true
                    ? { url: 'http://timestamp.digicert.com' }
                    : options.timeStampAuthority,
        }
        return sig
    }

    sign: PdfSignatureObject['sign'] = async (options) => {
        if (!this.signingInfo) {
            throw new Error('Set signingInfo before signing')
        }

        const { bytes } = options

        const certificate: Certificate = Certificate.fromDer(
            this.signingInfo.certificate,
        )
        const additionalCertificates: Certificate[] =
            this.signingInfo.additionalCertificates.map(Certificate.fromDer)

        const signedAttributes = new SignerInfo.SignedAttributes()
        const unsignedAttributes = new SignerInfo.UnsignedAttributes()

        this.signedAt ??= new Date()
        signedAttributes.push(Attribute.signingTime(this.signedAt))
        const revocationInfo =
            this.signingInfo.revocationInfo === 'fetch'
                ? await fetchRevocationInfo({
                      certificates: [
                          this.signingInfo.certificate,
                          ...this.signingInfo.additionalCertificates,
                      ],
                      issuerCertificate: this.signingInfo.issuerCertificate,
                  })
                : this.signingInfo.revocationInfo

        if (options.embedRevocationInfo && revocationInfo) {
            signedAttributes.push(
                Attribute.adobeRevocationInfoArchival(
                    new RevocationInfoArchival({
                        crls: revocationInfo.crls?.map((x) =>
                            CertificateList.fromDer(x),
                        ),
                        ocsps: revocationInfo.ocsps?.map((x) =>
                            OCSPResponse.fromDer(x),
                        ),
                        otherRevInfo: revocationInfo.otherRevInfo?.map(
                            (x) =>
                                new OtherRevInfo({
                                    type: x.type,
                                    value: x.value,
                                }),
                        ),
                    }),
                ),
            )
        }

        const digest =
            await DigestAlgorithmIdentifier.digestAlgorithm('SHA-1').digest(
                bytes,
            )
        const signedData = await SignedData.builder()
            .addCertificate(...additionalCertificates)
            .setData(digest)
            .setDetached(false)
            .addSigner({
                certificate,
                privateKeyInfo: PrivateKeyInfo.fromDer(
                    this.signingInfo.privateKey,
                ),
                encryptionAlgorithm: PdfAdbePkcs7Sha1SignatureObject.ALGORITHM,
                signedAttrs: signedAttributes,
                unsignedAttrs: unsignedAttributes,
                tsa: this.signingInfo.timeStampAuthority,
            })
            .build()

        return {
            signedBytes: signedData.toCms().toDer(),
            revocationInfo,
        }
    }

    verify: PdfSignatureObject['verify'] = async (options) => {
        const { bytes, certificateValidation } = options

        try {
            const signedData = SignedData.fromCms(this.signedBytes)

            const expectedHash =
                await DigestAlgorithmIdentifier.digestAlgorithm('SHA-1').digest(
                    bytes,
                )

            const certValidationOptions =
                certificateValidation === true
                    ? {}
                    : certificateValidation || undefined

            const result = await signedData.verify({
                certificateValidation: certValidationOptions,
            })

            if (!result.valid) {
                return {
                    valid: false,
                    reasons: result.reasons,
                }
            }

            const embeddedContent = signedData.encapContentInfo.eContent
            if (!embeddedContent) {
                return {
                    valid: false,
                    reasons: ['No embedded content in SignedData'],
                }
            }

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
}
