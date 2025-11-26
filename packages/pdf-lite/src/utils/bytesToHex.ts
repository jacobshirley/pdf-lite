import { ByteArray } from '../types'
import { bytesToHexBytes } from './bytesToHexBytes'
import { bytesToString } from './bytesToString'

/**
 * Converts a byte array to a hexadecimal string.
 *
 * @param bytes - The byte array to convert.
 * @returns A hexadecimal string representation of the bytes.
 *
 * @example
 * ```typescript
 * bytesToHex(new Uint8Array([255, 0, 127])) // Returns 'FF007F'
 * ```
 */
export function bytesToHex(bytes: ByteArray): string {
    return bytesToString(bytesToHexBytes(bytes))
}
