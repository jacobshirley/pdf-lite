import {
    SignaturePolicyDocument,
    RevocationInfo,
    TimeStampAuthority,
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
import { PdfName } from '../../core/objects/pdf-name'
import { fetchRevocationInfo } from '../utils'
import { PdfString } from '../../core/objects/pdf-string'
import { PdfDate } from '../../core/objects/pdf-date'
import {
    PdfSignatureDictionary,
    PdfSignatureObject,
    PdfSignatureSignOptions,
} from './base'
import { SigningCertificateV2 } from 'pki-lite/x509/attributes/SigningCertificateV2'
import {
    OtherHashAlgAndValue,
    SignaturePolicyId,
} from 'pki-lite/x509/attributes/SignaturePolicyIdentifier'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { ByteArray } from '../../types'

/**
 * ETSI CAdES detached signature object (ETSI.CAdES.detached).
 * Creates CAdES-compliant signatures with enhanced attributes.
 *
 * @example
 * ```typescript
 * const signature = new PdfEtsiCadesDetachedSignatureObject({
 *     privateKey: keyBytes,
 *     certificate: certBytes,
 *     reason: 'Approval',
 *     timeStampAuthority: true
 * })
 * ```
 */
export class PdfEtsiCadesDetachedSignatureObject extends PdfSignatureObject {
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
    /** Reason for signing. */
    reason?: string
    /** Signing location. */
    location?: string
    /** Signature algorithm parameters. */
    algorithm?: AsymmetricEncryptionAlgorithmParams
    /** Revocation information or 'fetch' to retrieve automatically. */
    revocationInfo?: RevocationInfo | 'fetch'
    /** Timestamp authority configuration. */
    timeStampAuthority?: TimeStampAuthority
    /** Signature policy document reference. */
    policyDocument?: SignaturePolicyDocument

    /**
     * Creates a new CAdES detached signature object.
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
            policyDocument?: SignaturePolicyDocument
        },
    ) {
        super(
            new PdfSignatureDictionary({
                Type: new PdfName('Sig'),
                Filter: new PdfName('Adobe.PPKLite'),
                SubFilter: new PdfName('ETSI.CAdES.detached'),
                ContactInfo: options.contactInfo
                    ? new PdfString(options.contactInfo)
                    : undefined,
                M: options.date ? new PdfDate(options.date) : undefined,
                Name: options.name ? new PdfString(options.name) : undefined,
            }),
        )

        this.privateKey = options.privateKey
        this.certificate = options.certificate
        this.issuerCertificate = options.issuerCertificate
        this.additionalCertificates = options.additionalCertificates || []
        this.date = options.date
        this.reason = options.reason
        this.location = options.location
        this.algorithm = options.algorithm
        this.revocationInfo = options.revocationInfo
        this.timeStampAuthority =
            options.timeStampAuthority === true
                ? {
                      url: 'https://freetsa.org/tsr',
                  }
                : options.timeStampAuthority
        this.policyDocument = options.policyDocument
    }

    /**
     * Signs the document bytes using CAdES detached format.
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

        signedAttributes.push(
            Attribute.signingCertificateV2(
                await SigningCertificateV2.fromCertificates({
                    certificates: [certificate, ...additionalCertificates],
                }),
            ),
        )

        signedAttributes.push(Attribute.signingTime(this.date ?? new Date()))

        if (this.reason) {
            signedAttributes.push(
                Attribute.commitmentTypeIndication(this.reason),
            )
        }

        if (this.location) {
            signedAttributes.push(
                Attribute.signingLocation({
                    localityName: this.location,
                }),
            )
        }

        if (this.policyDocument) {
            signedAttributes.push(
                Attribute.signaturePolicyIdentifier(
                    new SignaturePolicyId({
                        sigPolicyId: this.policyDocument.oid,
                        sigPolicyHash: new OtherHashAlgAndValue({
                            hashAlgorithm:
                                DigestAlgorithmIdentifier.digestAlgorithm(
                                    this.policyDocument.hashAlgorithm,
                                ),
                            hashValue: this.policyDocument.hash,
                        }),
                        sigPolicyQualifiers: [],
                    }),
                ),
            )
        }

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
                signedAttrs: signedAttributes,
                unsignedAttrs: unsignedAttributes,
                tsa: this.timeStampAuthority,
                encryptionAlgorithm: this.algorithm,
            })
            .build()

        return {
            signedBytes: signedData.toCms().toDer(),
            revocationInfo,
        }
    }
}
