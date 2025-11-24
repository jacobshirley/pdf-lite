import { Certificate } from 'pki-lite/x509/Certificate'
import { RevocationInfo } from './types'
import { ByteArray } from '../types'

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
