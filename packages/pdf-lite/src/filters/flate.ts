import { ByteArray, PdfFilter } from '../types.js'
import { inflateData, deflateData } from '../utils/algos.js'

export function flate(): PdfFilter {
    return {
        encode: (data: ByteArray) => {
            return deflateData(data)
        },
        decode: (data: ByteArray) => {
            return inflateData(data)
        },
    }
}
