import { ByteArray } from '../types.js'

export interface PdfFilter {
    encode(data: ByteArray): ByteArray
    decode(data: ByteArray): ByteArray
}

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
