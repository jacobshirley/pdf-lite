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
import { ByteArray } from '../../types.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'

type SigningInfo = {
    privateKey: ByteArray
    certificate: ByteArray
    additionalCertificates: ByteArray[]
    issuerCertificate?: ByteArray
    algorithm?: AsymmetricEncryptionAlgorithmParams
    revocationInfo?: RevocationInfo | 'fetch'
    timeStampAuthority?: TimeStampAuthority
}

/**
 * PKCS#7 detached signature object (adbe.pkcs7.detached).
 * Creates CMS SignedData with the document hash as external data.
 */
export class PdfAdbePkcs7DetachedSignatureObject extends PdfSignatureObject {
    static {
        PdfSignatureObject.registerSubFilter(
            'adbe.pkcs7.detached',
            PdfAdbePkcs7DetachedSignatureObject,
        )
    }

    signingInfo?: SigningInfo

    constructor(other?: PdfIndirectObject) {
        super(other)
    }

    static create(
        options: PdfSignatureSignOptions & {
            privateKey: ByteArray
            certificate: ByteArray
            issuerCertificate?: ByteArray
            additionalCertificates?: ByteArray[]
            algorithm?: AsymmetricEncryptionAlgorithmParams
            revocationInfo?: RevocationInfo | 'fetch'
            timeStampAuthority?: TimeStampAuthority | true
        },
    ): PdfAdbePkcs7DetachedSignatureObject {
        const sig = new PdfAdbePkcs7DetachedSignatureObject()
        sig.content = PdfSignatureObject.buildDictionary(
            options,
            'adbe.pkcs7.detached',
        )
        sig.signingInfo = {
            privateKey: options.privateKey,
            certificate: options.certificate,
            issuerCertificate: options.issuerCertificate,
            additionalCertificates: options.additionalCertificates ?? [],
            algorithm: options.algorithm,
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

        const signedData = await SignedData.builder()
            .addCertificate(...additionalCertificates)
            .setData(bytes)
            .setDetached(true)
            .addSigner({
                certificate,
                privateKeyInfo: PrivateKeyInfo.fromDer(
                    this.signingInfo.privateKey,
                ),
                encryptionAlgorithm: this.signingInfo.algorithm,
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
