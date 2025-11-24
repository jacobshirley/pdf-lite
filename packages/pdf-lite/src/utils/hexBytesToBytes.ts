import { ByteArray } from '../types'

export function hexBytesToBytes(hex: ByteArray): ByteArray {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(String.fromCharCode(hex[i], hex[i + 1]), 16)
    }
    return bytes
}
