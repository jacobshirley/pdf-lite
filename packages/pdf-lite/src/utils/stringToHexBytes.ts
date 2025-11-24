import { ByteArray } from '../types'

export function stringToHexBytes(str: string): ByteArray {
    const hex = str.replace(/<|>/g, '')
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
    }
    return bytes
}
