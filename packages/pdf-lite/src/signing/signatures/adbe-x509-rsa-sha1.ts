import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo'
import { AsymmetricEncryptionAlgorithmParams } from 'pki-lite/core/index'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { OctetString } from 'pki-lite/asn1/OctetString'
import { AlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { ByteArray } from '../../types'
import { RevocationInfo } from '../types'
import { fetchRevocationInfo } from '../utils'

export class PdfAdbePkcsX509RsaSha1SignatureObject extends PdfSignatureObject {
    static readonly ALGORITHM: AsymmetricEncryptionAlgorithmParams = {
        type: 'RSASSA_PKCS1_v1_5',
        params: {
            hash: 'SHA-1',
        },
    }

    privateKey: ByteArray
    certificate: ByteArray
    additionalCertificates?: ByteArray[]
    issuerCertificate?: ByteArray
    revocationInfo?: RevocationInfo | 'fetch'

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
}
