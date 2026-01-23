import { Certificate } from 'pki-lite/x509/Certificate.js'
import { RevocationInfo } from './types.js'
import { ByteArray } from '../types.js'

/**
 * Fetches revocation information (CRLs and OCSPs) for certificates.
 * Uses the certificate's embedded URLs to retrieve revocation data.
 *
 * @param options - Configuration for fetching revocation info.
 * @param options.certificates - Array of DER-encoded certificates.
 * @param options.issuerCertificate - Optional issuer certificate for OCSP requests.
 * @param options.ocspUrls - Optional additional OCSP URLs.
 * @param options.crlUrls - Optional additional CRL URLs.
 * @param options.retrieveOcsps - Whether to fetch OCSP responses (default: true).
 * @param options.retrieveCrls - Whether to fetch CRLs (default: true).
 * @returns The fetched revocation information.
 *
 * @example
 * ```typescript
 * const revInfo = await fetchRevocationInfo({
 *     certificates: [certBytes],
 *     retrieveCrls: true,
 *     retrieveOcsps: true
 * })
 * ```
 */
export async function fetchRevocationInfo(options: {
    certificates: ByteArray[]
    issuerCertificate?: ByteArray
    ocspUrls?: string[] // URLs to fetch OCSPs from
    crlUrls?: string[] // URLs to fetch CRLs from
    retrieveOcsps?: boolean // Whether to fetch OCSPs
    retrieveCrls?: boolean // Whether to fetch CRLs
}): Promise<RevocationInfo> {
    const { certificates, retrieveCrls = true, retrieveOcsps = true } = options

    const crls: ByteArray[] = []
    const ocsps: ByteArray[] = []

    for (const certificateBytes of certificates) {
        const certificate = Certificate.fromDer(certificateBytes)

        if (retrieveCrls) {
            const crl = await certificate.requestCrl()

            if (crl) {
                crls.push(crl.toDer())
            }
        }

        if (retrieveOcsps) {
            const ocsp = await certificate.requestOcsp({
                issuerCertificate: options.issuerCertificate
                    ? Certificate.fromDer(
                          options.issuerCertificate as ByteArray,
                      )
                    : undefined,
            })

            if (ocsp) {
                ocsps.push(ocsp.toDer())
            }
        }
    }

    return {
        crls,
        ocsps,
        otherRevInfo: [],
    }
}
