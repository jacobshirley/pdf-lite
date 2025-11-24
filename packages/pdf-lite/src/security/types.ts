import { PdfArray } from '../core/objects/pdf-array'
import { PdfBoolean } from '../core/objects/pdf-boolean'
import { PdfDictionary } from '../core/objects/pdf-dictionary'
import { PdfHexadecimal } from '../core/objects/pdf-hexadecimal'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object'
import { PdfName } from '../core/objects/pdf-name'
import { PdfNumber } from '../core/objects/pdf-number'
import { PdfString } from '../core/objects/pdf-string'
import { ByteArray } from '../types'

export type PdfId = PdfArray<PdfHexadecimal>

export type PdfCryptFilterDictionary = PdfDictionary<{
    AuthEvent: PdfName<'DocOpen' | 'EFOpen'>
    CFM: PdfName<'None' | 'V2' | 'AESV2' | 'AESV3'>
    Length?: PdfNumber
}>

export type PdfEncryptionDictionary = PdfDictionary<{
    Filter: PdfName<'Standard' | 'Adobe.PubSec'>
    SubFilter?: PdfName<'adbe.pkcs7.s3' | 'adbe.pkcs7.s4' | 'adbe.pkcs7.s5'>
    V: PdfNumber
    R: PdfNumber
    O: PdfString | PdfHexadecimal
    OE?: PdfString | PdfHexadecimal
    U: PdfString | PdfHexadecimal
    UE?: PdfString | PdfHexadecimal
    P: PdfNumber
    Perms?: PdfString | PdfHexadecimal
    Length: PdfNumber
    CF?: PdfDictionary<{
        [key: string]: PdfCryptFilterDictionary
    }>
    StmF?: PdfName
    StrF?: PdfName
    EFF?: PdfName
    EncryptMetadata?: PdfBoolean
    ID?: PdfArray<PdfHexadecimal>
    Recipients?: PdfArray<PdfHexadecimal>
}>

export type PdfEncryptionDictionaryObject =
    PdfIndirectObject<PdfEncryptionDictionary>

export type CryptFilterType = 'string' | 'stream' | 'file'

export type PdfEncryptionRecipient = {
    certificate?: ByteArray
    privateKey?: ByteArray
}

export type PdfEncryptionAlgorithmType =
    | 'RC4-40'
    | 'RC4-128'
    | 'AES-128-CBC'
    | 'AES-256-CBC'
    | 'none'

type Rc40 = {
    default: 'RC4-40'
}

type Rc128 = {
    default: 'RC4-128'
}

type Aes128WithCryptFilters = {
    default: 'AES-128-CBC'
    streams?: 'AES-128-CBC' | 'RC4-128' | 'RC4-40' | 'none'
    strings?: 'AES-128-CBC' | 'RC4-128' | 'RC4-40' | 'none'
}

type Aes256 = {
    default: 'AES-256-CBC' | 'none'
    streams?: 'AES-256-CBC' | 'AES-128-CBC' | 'RC4-128' | 'none'
    files?: 'AES-256-CBC' | 'AES-128-CBC' | 'RC4-128' | 'none'
    strings?: 'AES-256-CBC' | 'AES-128-CBC' | 'RC4-128' | 'none'
}

export type PdfEncryptionAlgorithmOptions =
    | Rc40
    | Rc128
    | Aes128WithCryptFilters
    | Aes256

export type PdfEncryptionOptions = {
    method?: PdfEncryptionAlgorithmOptions
    password?: ByteArray | string
    ownerPassword?: ByteArray | string
    documentId?: PdfId | ByteArray | string
    encryptMetadata?: boolean
    recipients?: PdfEncryptionRecipient[]
    permissions?: {
        print?: boolean
        modify?: boolean
        copy?: boolean
        annotate?: boolean
        fill?: boolean
        extract?: boolean
        assemble?: boolean
        printHighQuality?: boolean
        all?: boolean
    }
}
