import { RevocationInfo, TimeStampAuthority } from '../types'
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
import { fetchRevocationInfo } from '../utils'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { ByteArray } from '../../types'

/**
 * PKCS#7 SHA-1 signature object (adbe.pkcs7.sha1).
 * Creates CMS SignedData with SHA-1 hash embedded as signed content.
 *
 * @example
 * ```typescript
 * const signature = new PdfAdbePkcs7Sha1SignatureObject({
 *     privateKey: keyBytes,
 *     certificate: certBytes
 * })
 * ```
 */
export class PdfAdbePkcs7Sha1SignatureObject extends PdfSignatureObject {
    /** Fixed algorithm for SHA-1 signatures. */
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
    additionalCertificates: ByteArray[]
    /** Issuer certificate for OCSP requests. */
    issuerCertificate?: ByteArray
    /** Signing date. */
    date?: Date
    /** Revocation information or 'fetch' to retrieve automatically. */
    revocationInfo?: RevocationInfo | 'fetch'
    /** Timestamp authority configuration. */
    timeStampAuthority?: TimeStampAuthority

    /**
     * Creates a new PKCS#7 SHA-1 signature object.
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
            subfilter: 'adbe.pkcs7.sha1',
        })

        this.privateKey = options.privateKey
        this.certificate = options.certificate
        this.issuerCertificate = options.issuerCertificate
        this.additionalCertificates = options.additionalCertificates || []
        this.date = options.date
        this.revocationInfo = options.revocationInfo
        this.timeStampAuthority =
            options.timeStampAuthority === true
                ? {
                      url: 'http://timestamp.digicert.com',
                  }
                : options.timeStampAuthority
    }

    /**
     * Signs the document bytes using PKCS#7 SHA-1 format.
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
                privateKeyInfo: PrivateKeyInfo.fromDer(this.privateKey),
                encryptionAlgorithm: PdfAdbePkcs7Sha1SignatureObject.ALGORITHM,
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
}
