import {
    SignaturePolicyDocument,
    RevocationInfo,
    TimeStampAuthority,
} from '../types.js'
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
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { SigningCertificateV2 } from 'pki-lite/x509/attributes/SigningCertificateV2.js'
import {
    OtherHashAlgAndValue,
    SignaturePolicyId,
} from 'pki-lite/x509/attributes/SignaturePolicyIdentifier.js'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier.js'
import { ByteArray } from '../../types.js'

type SigningInfo = {
    privateKey: ByteArray
    certificate: ByteArray
    additionalCertificates?: ByteArray[]
    issuerCertificate?: ByteArray
    algorithm?: AsymmetricEncryptionAlgorithmParams
    revocationInfo?: RevocationInfo | 'fetch'
    timeStampAuthority?: TimeStampAuthority | true
    policyDocument?: SignaturePolicyDocument
}

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
    static {
        PdfSignatureObject.registerSubFilter(
            'ETSI.CAdES.detached',
            PdfEtsiCadesDetachedSignatureObject,
        )
    }

    signingInfo?: SigningInfo

    cloneImpl(): this {
        const clone = new PdfEtsiCadesDetachedSignatureObject(this)
        if (this.signingInfo) {
            clone.signingInfo = { ...this.signingInfo }
        }
        return clone as this
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
            policyDocument?: SignaturePolicyDocument
        },
    ) {
        const sig = new PdfEtsiCadesDetachedSignatureObject()
        sig.content = PdfSignatureObject.buildDictionary(
            options,
            'ETSI.CAdES.detached',
        )

        sig.signingInfo = {
            privateKey: options.privateKey,
            certificate: options.certificate,
            issuerCertificate: options.issuerCertificate,
            additionalCertificates: options.additionalCertificates || [],
            algorithm: options.algorithm,
            revocationInfo: options.revocationInfo,
            timeStampAuthority:
                options.timeStampAuthority === true
                    ? {
                          url: 'https://freetsa.org/tsr',
                      }
                    : options.timeStampAuthority,
            policyDocument: options.policyDocument,
        }
        return sig
    }

    /**
     * Signs the document bytes using CAdES detached format.
     *
     * @param options - Signing options with bytes and revocation embedding flag.
     * @returns The CMS SignedData and revocation information.
     */
    sign: PdfSignatureObject['sign'] = async (options) => {
        if (!this.signingInfo) {
            throw new Error('Set signingInfo before signing')
        }

        const { bytes } = options

        const certificate: Certificate = Certificate.fromDer(
            this.signingInfo.certificate,
        )
        const additionalCertificates: Certificate[] =
            this.signingInfo.additionalCertificates?.map(Certificate.fromDer) ??
            []

        const signedAttributes = new SignerInfo.SignedAttributes()
        const unsignedAttributes = new SignerInfo.UnsignedAttributes()

        signedAttributes.push(
            Attribute.signingCertificateV2(
                await SigningCertificateV2.fromCertificates({
                    certificates: [certificate, ...additionalCertificates],
                }),
            ),
        )

        this.signedAt ??= new Date()
        signedAttributes.push(Attribute.signingTime(this.signedAt))

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

        if (this.signingInfo.policyDocument) {
            signedAttributes.push(
                Attribute.signaturePolicyIdentifier(
                    new SignaturePolicyId({
                        sigPolicyId: this.signingInfo.policyDocument.oid,
                        sigPolicyHash: new OtherHashAlgAndValue({
                            hashAlgorithm:
                                DigestAlgorithmIdentifier.digestAlgorithm(
                                    this.signingInfo.policyDocument
                                        .hashAlgorithm,
                                ),
                            hashValue: this.signingInfo.policyDocument.hash,
                        }),
                        sigPolicyQualifiers: [],
                    }),
                ),
            )
        }

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
                signedAttrs: signedAttributes,
                unsignedAttrs: unsignedAttributes,
                tsa: this.signingInfo.timeStampAuthority,
                encryptionAlgorithm: this.signingInfo.algorithm,
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
            const signedData = this.signedData

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

    /**
     * Parses the signed bytes as a CMS SignedData structure. See {@link SignedData} for details on the parsed content.
     */
    get signedData(): SignedData {
        return SignedData.fromCms(this.signedBytes)
    }
}
