import { ByteArray } from '../types'

export function replaceInBuffer<T extends ByteArray>(
    searchBuffer: ByteArray,
    replaceBuffer: ByteArray,
    targetBuffer: T,
    multiple: boolean = false,
): ByteArray {
    const searchLength = searchBuffer.length
    const replaceLength = replaceBuffer.length
    const targetLength = targetBuffer.length
    const result = new Uint8Array(targetLength - searchLength + replaceLength)
    let found = false
    let offset = 0
    for (let i = 0; i < targetLength; i++) {
        if (
            (multiple || !found) &&
            i <= targetLength - searchLength &&
            targetBuffer
                .subarray(i, i + searchLength)
                .every((value, index) => value === searchBuffer[index])
        ) {
            result.set(replaceBuffer, offset)
            offset += replaceLength
            i += searchLength - 1 // Skip the length of the search buffer
            found = true
        } else {
            result[offset++] = targetBuffer[i]
        }
    }

    if (!found) {
        throw new Error(`Search buffer not found in target buffer`)
    }
    return result
}
