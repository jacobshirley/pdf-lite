import {
    RevocationInfo,
    TimeStampAuthority,
    PdfSignatureVerificationOptions,
    PdfSignatureVerificationResult,
} from '../types'
import { SignedData } from 'pki-lite/pkcs7/SignedData'
import { Certificate } from 'pki-lite/x509/Certificate'
import { SignerInfo } from 'pki-lite/pkcs7/SignerInfo'
import { Attribute } from 'pki-lite/x509/Attribute'
import { RevocationInfoArchival } from 'pki-lite/adobe/RevocationInfoArchival'
import { CertificateList } from 'pki-lite/x509/CertificateList'
import { OCSPResponse } from 'pki-lite/ocsp/OCSPResponse'
import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo'
import { OtherRevInfo } from 'pki-lite/adobe/OtherRevInfo'
import { AsymmetricEncryptionAlgorithmParams } from 'pki-lite/core/index'
import { OIDs } from 'pki-lite/core/OIDs.js'
import { OctetString } from 'pki-lite/asn1/OctetString'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { fetchRevocationInfo } from '../utils'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { ByteArray } from '../../types'

/**
 * PKCS#7 detached signature object (adbe.pkcs7.detached).
 * Creates CMS SignedData with the document hash as external data.
 *
 * @example
 * ```typescript
 * const signature = new PdfAdbePkcs7DetachedSignatureObject({
 *     privateKey: keyBytes,
 *     certificate: certBytes,
 *     reason: 'Document approval',
 *     timeStampAuthority: true
 * })
 * ```
 */
export class PdfAdbePkcs7DetachedSignatureObject extends PdfSignatureObject {
    /** Private key for signing. */
    privateKey: ByteArray
    /** Signer certificate. */
    certificate: ByteArray
    /** Additional certificates for chain building. */
    additionalCertificates: ByteArray[]
    /** Issuer certificate for OCSP requests. */
    issuerCertificate?: ByteArray
    /** Signing date. */
    date?: Date
    /** Signature algorithm parameters. */
    algorithm?: AsymmetricEncryptionAlgorithmParams
    /** Revocation information or 'fetch' to retrieve automatically. */
    revocationInfo?: RevocationInfo | 'fetch'
    /** Timestamp authority configuration. */
    timeStampAuthority?: TimeStampAuthority

    /**
     * Creates a new PKCS#7 detached signature object.
     *
     * @param options - Signature configuration options.
     */
    constructor(
        options: PdfSignatureSignOptions & {
            privateKey: ByteArray
            certificate: ByteArray
            issuerCertificate?: ByteArray
            additionalCertificates?: ByteArray[]
            algorithm?: AsymmetricEncryptionAlgorithmParams
            revocationInfo?: RevocationInfo | 'fetch'
            timeStampAuthority?: TimeStampAuthority | true
        },
    ) {
        super({
            ...options,
            subfilter: 'adbe.pkcs7.detached',
        })

        this.privateKey = options.privateKey
        this.certificate = options.certificate
        this.issuerCertificate = options.issuerCertificate
        this.additionalCertificates = options.additionalCertificates || []
        this.date = options.date
        this.algorithm = options.algorithm
        this.revocationInfo = options.revocationInfo
        this.timeStampAuthority =
            options.timeStampAuthority === true
                ? {
                      url: 'http://timestamp.digicert.com',
                  }
                : options.timeStampAuthority
    }

    /**
     * Signs the document bytes using PKCS#7 detached format.
     *
     * @param options - Signing options with bytes and revocation embedding flag.
     * @returns The CMS SignedData and revocation information.
     */
    sign: PdfSignatureObject['sign'] = async (options) => {
        const { bytes } = options

        const certificate: Certificate = Certificate.fromDer(this.certificate)
        const additionalCertificates: Certificate[] =
            this.additionalCertificates.map(Certificate.fromDer)

        const signedAttributes = new SignerInfo.SignedAttributes()
        const unsignedAttributes = new SignerInfo.UnsignedAttributes()

        signedAttributes.push(Attribute.signingTime(this.date ?? new Date()))

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
                privateKeyInfo: PrivateKeyInfo.fromDer(this.privateKey),
                encryptionAlgorithm: this.algorithm,
                signedAttrs: signedAttributes,
                unsignedAttrs: unsignedAttributes,
                tsa: this.timeStampAuthority,
            })
            .build()

        return {
            signedBytes: signedData.toCms().toDer(),
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
