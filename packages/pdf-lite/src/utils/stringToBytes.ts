import { ByteArray } from '../types'

export function stringToBytes(str: string | ByteArray): ByteArray {
    if (typeof str === 'string') {
        const encoder = new TextEncoder()
        return encoder.encode(str) as ByteArray
    } else {
        return str
    }
}
