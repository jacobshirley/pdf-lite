import { ByteArray } from '../types'

const hexChars = '0123456789ABCDEF'

export function bytesToHexBytes(bytes: ByteArray): ByteArray {
    const result = new Uint8Array(bytes.length * 2)

    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i]
        result[i * 2] = hexChars.charCodeAt((byte >> 4) & 0x0f)
        result[i * 2 + 1] = hexChars.charCodeAt(byte & 0x0f)
    }

    return result
}
