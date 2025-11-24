import { HashAlgorithm } from 'pki-lite/core/crypto/index.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { PdfName } from '../core/objects/pdf-name'
import { PdfHexadecimal } from '../core/objects/pdf-hexadecimal'
import { PdfArray } from '../core/objects/pdf-array'
import { PdfNumber } from '../core/objects/pdf-number'
import { PdfString } from '../core/objects/pdf-string'
import { ByteArray } from '../types'

export type PdfSignatureSubType =
    | 'adbe.pkcs7.detached'
    | 'adbe.pkcs7.sha1'
    | 'adbe.x509.rsa_sha1'
    | 'ETSI.CAdES.detached'
    | 'ETSI.RFC3161'

export type PdfSignatureType = 'Sig' | 'DocTimeStamp'

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

export type TimeStampAuthority = {
    url: string // URL of the timestamp authority
    username?: string // Username for the timestamp authority
    password?: string // Password for the timestamp authority
}

export type RevocationInfo = {
    crls?: ByteArray[] // Certificate Revocation Lists for revocation info
    ocsps?: ByteArray[] // OCSP responses for revocation info
    otherRevInfo?: { type: string; value: ByteArray }[] // Other
}

export type SignaturePolicyDocument = {
    oid: string // Object Identifier for the signature policy
    hash: ByteArray // Hash of the policy document
    hashAlgorithm: HashAlgorithm // Hash algorithm used for the policy document
}
