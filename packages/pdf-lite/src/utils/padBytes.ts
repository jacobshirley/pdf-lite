import { ByteArray } from '../types'

export function padBytes(bytes: ByteArray, length: number): ByteArray {
    if (bytes.length > length) {
        throw new Error(
            `Cannot pad bytes: current length ${bytes.length} is greater than or equal to target length ${length}.`,
        )
    }
    const padded = new Uint8Array(length)
    padded.set(bytes)
    return padded
}
