import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo'
import { AsymmetricEncryptionAlgorithmParams } from 'pki-lite/core/index'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { OctetString } from 'pki-lite/asn1/OctetString'
import { AlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { Certificate } from 'pki-lite/x509/Certificate'
import { ByteArray } from '../../types'
import { RevocationInfo } from '../types'
import { fetchRevocationInfo } from '../utils'

/**
 * X.509 RSA-SHA1 signature object (adbe.x509.rsa_sha1).
 * Creates a raw RSA-SHA1 signature with certificates in the Cert entry.
 *
 * @example
 * ```typescript
 * const signature = new PdfAdbePkcsX509RsaSha1SignatureObject({
 *     privateKey: keyBytes,
 *     certificate: certBytes
 * })
 * ```
 */
export class PdfAdbePkcsX509RsaSha1SignatureObject extends PdfSignatureObject {
    /** Fixed algorithm for RSA-SHA1 signatures. */
    static readonly ALGORITHM: AsymmetricEncryptionAlgorithmParams = {
        type: 'RSASSA_PKCS1_v1_5',
        params: {
            hash: 'SHA-1',
        },
    }

    /** Private key for signing. */
    privateKey: ByteArray
    /** Signer certificate. */
    certificate: ByteArray
    /** Additional certificates for chain building. */
    additionalCertificates?: ByteArray[]
    /** Issuer certificate for OCSP requests. */
    issuerCertificate?: ByteArray
    /** Revocation information or 'fetch' to retrieve automatically. */
    revocationInfo?: RevocationInfo | 'fetch'

    /**
     * Creates a new X.509 RSA-SHA1 signature object.
     *
     * @param options - Signature configuration options.
     */
    constructor(
        options: PdfSignatureSignOptions & {
            privateKey: ByteArray
            certificate: ByteArray
            additionalCertificates?: ByteArray[]
            issuerCertificate?: ByteArray
            revocationInfo?: RevocationInfo | 'fetch'
        },
    ) {
        super({
            ...options,
            subfilter: 'adbe.x509.rsa_sha1',
            certs: [
                options.certificate,
                ...(options.additionalCertificates ?? []),
            ],
        })

        this.privateKey = options.privateKey
        this.revocationInfo = options.revocationInfo
        this.certificate = options.certificate
        this.issuerCertificate = options.issuerCertificate
        this.additionalCertificates = options.additionalCertificates
    }

    /**
     * Signs the document bytes using RSA-SHA1 format.
     *
     * @param options - Signing options with bytes.
     * @returns The signature bytes and revocation information.
     */
    sign: PdfSignatureObject['sign'] = async (options) => {
        const { bytes } = options
        const revocationInfo =
            this.revocationInfo === 'fetch'
                ? await fetchRevocationInfo({
                      certificates: [
                          this.certificate,
                          ...(this.additionalCertificates ?? []),
                      ],
                      issuerCertificate: this.issuerCertificate,
                  })
                : this.revocationInfo

        const privateKeyInfo = PrivateKeyInfo.fromDer(this.privateKey)
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

    /**
     * Verifies the signature against the provided document bytes.
     *
     * @param options - Verification options including the signed bytes.
     * @returns The verification result.
     */
    verify: PdfSignatureObject['verify'] = async (options) => {
        const { bytes } = options

        try {
            const certificates = [
                this.certificate,
                ...(this.additionalCertificates ?? []),
            ]

            if (certificates.length === 0) {
                return {
                    valid: false,
                    reasons: [
                        'No certificates available for adbe.x509.rsa_sha1 verification',
                    ],
                }
            }

            // Parse the signature as an OctetString
            const signatureOctetString = OctetString.fromDer(this.signedBytes)
            const signatureValue = signatureOctetString.bytes

            // Get the signer certificate (first certificate in the chain)
            const signerCertificate = Certificate.fromDer(certificates[0])
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
                bytes,
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
}
