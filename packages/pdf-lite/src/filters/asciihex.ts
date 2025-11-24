import { ByteArray, PdfFilter } from '../types'
import { bytesToString } from '../utils/bytesToString'
import { stringToBytes } from '../utils/stringToBytes'

export function asciiHex(): PdfFilter {
    return {
        encode: (data: ByteArray) => {
            let out = ''
            for (let i = 0; i < data.length; i++) {
                out += data[i].toString(16).padStart(2, '0').toUpperCase()
            }
            out += '>'
            return stringToBytes(out)
        },
        decode: (data: ByteArray) => {
            let hex = bytesToString(data).replace(/\s+/g, '')
            if (hex.endsWith('>')) hex = hex.slice(0, -1)
            if (hex.length % 2 !== 0) hex += '0'
            const out = new Uint8Array(hex.length / 2)
            for (let i = 0; i < hex.length; i += 2) {
                out[i / 2] = parseInt(hex.substr(i, 2), 16)
            }
            return out
        },
    }
}
