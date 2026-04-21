import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo.js'
import { AsymmetricEncryptionAlgorithmParams } from 'pki-lite/core/index.js'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base.js'
import { OctetString } from 'pki-lite/asn1/OctetString.js'
import { AlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier.js'
import { Certificate } from 'pki-lite/x509/Certificate.js'
import { ByteArray } from '../../types.js'
import { RevocationInfo } from '../types.js'
import { fetchRevocationInfo } from '../utils.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'

type SigningInfo = {
    privateKey: ByteArray
    certificate: ByteArray
    additionalCertificates?: ByteArray[]
    issuerCertificate?: ByteArray
    revocationInfo?: RevocationInfo | 'fetch'
}

/**
 * X.509 RSA-SHA1 signature object (adbe.x509.rsa_sha1).
 * Creates a raw RSA-SHA1 signature with certificates in the Cert entry.
 */
export class PdfAdbePkcsX509RsaSha1SignatureObject extends PdfSignatureObject {
    static {
        PdfSignatureObject.registerSubFilter(
            'adbe.x509.rsa_sha1',
            PdfAdbePkcsX509RsaSha1SignatureObject,
        )
    }

    static readonly ALGORITHM: AsymmetricEncryptionAlgorithmParams = {
        type: 'RSASSA_PKCS1_v1_5',
        params: {
            hash: 'SHA-1',
        },
    }

    signingInfo?: SigningInfo

    cloneImpl(): this {
        const clone = new PdfAdbePkcsX509RsaSha1SignatureObject(this)
        if (this.signingInfo) {
            clone.signingInfo = { ...this.signingInfo }
        }
        return clone as this
    }

    static create(
        options: PdfSignatureSignOptions & {
            privateKey: ByteArray
            certificate: ByteArray
            additionalCertificates?: ByteArray[]
            issuerCertificate?: ByteArray
            revocationInfo?: RevocationInfo | 'fetch'
        },
    ): PdfAdbePkcsX509RsaSha1SignatureObject {
        const sig = new PdfAdbePkcsX509RsaSha1SignatureObject()
        sig.content = PdfSignatureObject.buildDictionary(
            options,
            'adbe.x509.rsa_sha1',
            [options.certificate, ...(options.additionalCertificates ?? [])],
        )
        sig.signingInfo = {
            privateKey: options.privateKey,
            certificate: options.certificate,
            additionalCertificates: options.additionalCertificates,
            issuerCertificate: options.issuerCertificate,
            revocationInfo: options.revocationInfo,
        }
        return sig
    }

    sign: PdfSignatureObject['sign'] = async (options) => {
        if (!this.signingInfo) {
            throw new Error('Set signingInfo before signing')
        }

        const { bytes } = options
        const revocationInfo =
            this.signingInfo.revocationInfo === 'fetch'
                ? await fetchRevocationInfo({
                      certificates: [
                          this.signingInfo.certificate,
                          ...(this.signingInfo.additionalCertificates ?? []),
                      ],
                      issuerCertificate: this.signingInfo.issuerCertificate,
                  })
                : this.signingInfo.revocationInfo

        const privateKeyInfo = PrivateKeyInfo.fromDer(
            this.signingInfo.privateKey,
        )
        const signatureAlgorithm = AlgorithmIdentifier.signatureAlgorithm(
            PdfAdbePkcsX509RsaSha1SignatureObject.ALGORITHM,
        )

        const signatureBytes = await signatureAlgorithm.sign(
            bytes,
            privateKeyInfo,
        )

        return {
            signedBytes: new OctetString({ bytes: signatureBytes }).toDer(),
            revocationInfo,
        }
    }

    verify: PdfSignatureObject['verify'] = async (options) => {
        const { bytes } = options

        try {
            const certificates: Certificate[] = []

            const Cert = this.content.get('Cert')
            if (Cert instanceof PdfArray) {
                for (const certObj of Cert.items) {
                    const certBytes =
                        certObj instanceof PdfHexadecimal
                            ? certObj.bytes
                            : certObj.raw
                    const certificate = Certificate.fromDer(certBytes)
                    certificates.push(certificate)
                }
            } else if (Cert instanceof PdfHexadecimal) {
                const certificate = Certificate.fromDer(Cert.bytes)
                certificates.push(certificate)
            } else if (Cert) {
                const certificate = Certificate.fromDer(Cert.raw)
                certificates.push(certificate)
            } else {
                throw new Error('No Cert entry found in signature dictionary')
            }

            if (certificates.length === 0) {
                return {
                    valid: false,
                    reasons: [
                        'No certificates available for adbe.x509.rsa_sha1 verification',
                    ],
                }
            }

            const signatureOctetString = OctetString.fromDer(this.signedBytes)
            const signatureValue = signatureOctetString.bytes

            const signatureAlgorithm = AlgorithmIdentifier.signatureAlgorithm(
                PdfAdbePkcsX509RsaSha1SignatureObject.ALGORITHM,
            )

            for (const cert of certificates) {
                const isValid = await signatureAlgorithm.verify(
                    bytes,
                    signatureValue,
                    cert.tbsCertificate.subjectPublicKeyInfo,
                )

                if (isValid) {
                    if (options.certificateValidation === true) {
                        await cert.validate({
                            checkSignature: true,
                            validateChain: true,
                            otherCertificates: certificates,
                        })
                    } else if (options.certificateValidation) {
                        await cert.validate(options.certificateValidation)
                    }

                    return { valid: true }
                }
            }

            return {
                valid: false,
                reasons: ['Signature verification failed for all certificates'],
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
