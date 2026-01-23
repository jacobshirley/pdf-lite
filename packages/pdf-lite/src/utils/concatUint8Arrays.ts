import { ByteArray } from '../types.js'

/**
 * Concatenates multiple Uint8Array instances into a single ByteArray.
 *
 * @param arrays - The arrays to concatenate.
 * @returns A new ByteArray containing all input arrays concatenated in order.
 *
 * @example
 * ```typescript
 * const result = concatUint8Arrays(
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4])
 * ) // Returns Uint8Array([1, 2, 3, 4])
 * ```
 */
export function concatUint8Arrays(...arrays: Uint8Array[]): ByteArray {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
        result.set(arr, offset)
        offset += arr.length
    }
    return result
}
