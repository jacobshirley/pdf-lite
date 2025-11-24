export type ByteArray = Uint8Array<ArrayBuffer>

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export type ChangeType = 'add' | 'update' | 'delete'

export type PdfEncryptionAlgorithm =
    | 'RC4-40'
    | 'RC4-128'
    | 'AES-128-CBC'
    | 'AES-256-CBC'
    | 'none'

export const PDF_FILTER_TYPES = {
    FlateDecode: 'FlateDecode',
    Fl: 'Fl',
    ASCIIHexDecode: 'ASCIIHexDecode',
    ASCII85Decode: 'ASCII85Decode',
    LZWDecode: 'LZWDecode',
    RunLengthDecode: 'RunLengthDecode',
    CCITTFaxDecode: 'CCITTFaxDecode',
    DCTDecode: 'DCTDecode',
    JPXDecode: 'JPXDecode',
    Crypt: 'Crypt',
} as const

export type PdfStreamFilterType = keyof typeof PDF_FILTER_TYPES

export type DecodeParms = {
    Predictor?: number
    Columns?: number
    Colors?: number
    BitsPerComponent?: number
}

export interface PdfFilter {
    encode(data: ByteArray): ByteArray
    decode(data: ByteArray): ByteArray
}

export interface Cipher {
    encrypt(data: ByteArray): Promise<ByteArray>
    decrypt(data: ByteArray): Promise<ByteArray>
}

export interface CipherBuilder {
    getCipher(): Cipher | null
}

export type PdfPermissions = {
    all?: boolean
    print?: boolean
    modify?: boolean
    copy?: boolean
    annotate?: boolean
    fill?: boolean
    extract?: boolean
    assemble?: boolean
    printHighQuality?: boolean
}

export const PERMISSION_FLAGS: Record<keyof PdfPermissions, number> = {
    all: 0xffffffff,
    print: 0x00000004,
    modify: 0x00000008,
    copy: 0x00000010,
    annotate: 0x00000020,
    fill: 0x00000100,
    extract: 0x00000200,
    assemble: 0x00000400,
    printHighQuality: 0x00000800,
}

export type PdfVersion = 1.3 | 1.4 | 1.5 | 1.6 | 1.7 | 2.0
export const DEFAULT_VERSION: PdfVersion = 2.0
