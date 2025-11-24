import { ByteArray } from '../types'
import { stringToBytes } from './stringToBytes'

export function escapeString(bytes: ByteArray | string): ByteArray {
    if (typeof bytes === 'string') {
        bytes = stringToBytes(bytes)
    }

    const result: number[] = []
    const BACKSLASH = 0x5c

    for (const b of bytes) {
        switch (b) {
            case 0x28:
                result.push(BACKSLASH, 0x28)
                break // (
            case 0x29:
                result.push(BACKSLASH, 0x29)
                break // )
            case BACKSLASH:
                result.push(BACKSLASH, BACKSLASH)
                break // \
            case 0x0a:
                result.push(BACKSLASH, 0x6e)
                break // LF
            case 0x0d:
                result.push(BACKSLASH, 0x72)
                break // CR
            default:
                result.push(b)

                break
        }
    }

    return new Uint8Array(result)
}
