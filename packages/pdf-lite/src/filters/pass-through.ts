import { ByteArray, PdfFilter } from '../types.js'

export function passthroughFilter(): PdfFilter {
    return {
        decode: (data: ByteArray) => {
            return data
        },
        encode: (data: ByteArray) => {
            return data
        },
    }
}
