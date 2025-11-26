import { TimeStampAuthority } from '../types'
import { PdfSignatureObject, PdfSignatureSignOptions } from './base'
import { DigestAlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import { TimeStampReq } from 'pki-lite/timestamp/TimeStampReq'
import { MessageImprint } from 'pki-lite/timestamp/MessageImprint'
import { SignedData } from 'pki-lite/pkcs7/SignedData'
import { fetchRevocationInfo } from '../utils'

/**
 * RFC 3161 timestamp signature object (ETSI.RFC3161).
 * Creates document timestamps using a Time Stamp Authority (TSA).
 *
 * @example
 * ```typescript
 * const timestamp = new PdfEtsiRfc3161SignatureObject({
 *     timeStampAuthority: { url: 'http://timestamp.example.com' }
 * })
 * ```
 */
export class PdfEtsiRfc3161SignatureObject extends PdfSignatureObject {
    /** Timestamp authority configuration. */
    timeStampAuthority: TimeStampAuthority

    /**
     * Creates a new RFC 3161 timestamp signature object.
     *
     * @param options - Configuration including optional TSA settings.
     */
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

    /**
     * Creates a timestamp for the document bytes.
     *
     * @param options - Signing options with bytes to timestamp.
     * @returns The timestamp token and revocation information.
     * @throws Error if no timestamp token is received.
     */
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
