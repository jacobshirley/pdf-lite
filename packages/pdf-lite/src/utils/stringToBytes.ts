import { ByteArray } from '../types.js'

/**
 * Converts a string or byte array to a byte array using UTF-8 encoding.
 * If the input is already a byte array, it is returned as-is.
 *
 * @param str - The string or byte array to convert.
 * @returns The input as a byte array.
 *
 * @example
 * ```typescript
 * stringToBytes('Hello') // Returns Uint8Array([72, 101, 108, 108, 111])
 * ```
 */
export function stringToBytes(str: string | ByteArray): ByteArray {
    if (typeof str === 'string') {
        const encoder = new TextEncoder()
        return encoder.encode(str) as ByteArray
    } else {
        return str
    }
}
