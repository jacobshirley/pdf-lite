import { TimeStampAuthority } from '../types'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { TimeStampReq } from 'pki-lite/timestamp/TimeStampReq'
import { MessageImprint } from 'pki-lite/timestamp/MessageImprint'
import { SignedData } from 'pki-lite/pkcs7/SignedData'
import { fetchRevocationInfo } from '../utils'

export class PdfEtsiRfc3161SignatureObject extends PdfSignatureObject {
    timeStampAuthority: TimeStampAuthority

    constructor(
        options: PdfSignatureSignOptions & {
            timeStampAuthority?: TimeStampAuthority
            name?: string
            reason?: string
            contactInfo?: string
            location?: string
        },
    ) {
        super({
            ...options,
            subfilter: 'ETSI.RFC3161',
        })

        this.timeStampAuthority = options.timeStampAuthority ?? {
            url: 'https://freetsa.org/tsr',
        }
    }

    sign: PdfSignatureObject['sign'] = async (options) => {
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
            url: this.timeStampAuthority.url,
            username: this.timeStampAuthority.username,
            password: this.timeStampAuthority.password,
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
}
