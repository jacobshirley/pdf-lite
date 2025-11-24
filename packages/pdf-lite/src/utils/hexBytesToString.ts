import { ByteArray } from '../types'

export function hexBytesToString(bytes: ByteArray): string {
    let hex = ''
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i].toString(16)
        hex += byte.length === 1 ? '0' + byte : byte
    }
    return hex
}
