import { HashAlgorithm } from 'pki-lite/core/crypto/index.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { PdfName } from '../core/objects/pdf-name'
import { PdfHexadecimal } from '../core/objects/pdf-hexadecimal'
import { PdfArray } from '../core/objects/pdf-array'
import { PdfNumber } from '../core/objects/pdf-number'
import { PdfString } from '../core/objects/pdf-string'
import { ByteArray } from '../types'

/**
 * PDF signature subfilter types defining the signature format.
 * - 'adbe.pkcs7.detached': PKCS#7 detached signature
 * - 'adbe.pkcs7.sha1': PKCS#7 SHA-1 signature
 * - 'adbe.x509.rsa_sha1': X.509 RSA-SHA1 signature
 * - 'ETSI.CAdES.detached': CAdES detached signature
 * - 'ETSI.RFC3161': RFC 3161 timestamp signature
 */
export type PdfSignatureSubType =
    | 'adbe.pkcs7.detached'
    | 'adbe.pkcs7.sha1'
    | 'adbe.x509.rsa_sha1'
    | 'ETSI.CAdES.detached'
    | 'ETSI.RFC3161'

/**
 * PDF signature type.
 * - 'Sig': Standard digital signature
 * - 'DocTimeStamp': Document timestamp
 */
export type PdfSignatureType = 'Sig' | 'DocTimeStamp'

/**
 * Entries in a PDF signature dictionary.
 */
export type PdfSignatureDictionaryEntries = {
    Type: PdfName<PdfSignatureType>
    Filter: PdfName
    SubFilter: PdfName<PdfSignatureSubType>
    Contents: PdfHexadecimal
    ByteRange: PdfArray<PdfNumber>
    Reason?: PdfString
    M?: PdfString
    Name?: PdfString
    Reference?: PdfArray<PdfDictionary>
    Location?: PdfString
    ContactInfo?: PdfString
    V?: PdfName<'2.2'>
    Changes?: PdfArray<PdfNumber>
    Cert?: PdfArray<PdfString | PdfHexadecimal> | PdfString | PdfHexadecimal
}

/**
 * Configuration for a timestamp authority (TSA).
 */
export type TimeStampAuthority = {
    /** URL of the timestamp authority service. */
    url: string
    /** Optional username for authentication. */
    username?: string
    /** Optional password for authentication. */
    password?: string
}

/**
 * Revocation information for certificate validation.
 */
export type RevocationInfo = {
    /** Certificate Revocation Lists (CRLs). */
    crls?: ByteArray[]
    /** OCSP responses. */
    ocsps?: ByteArray[]
    /** Other revocation information types. */
    otherRevInfo?: { type: string; value: ByteArray }[]
}

/**
 * Signature policy document reference for CAdES signatures.
 */
export type SignaturePolicyDocument = {
    /** Object Identifier for the signature policy. */
    oid: string
    /** Hash of the policy document. */
    hash: ByteArray
    /** Hash algorithm used for the policy document. */
    hashAlgorithm: HashAlgorithm
}
