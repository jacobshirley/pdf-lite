import { ByteArray } from '../types.js'
import { DEFAULT_PADDING } from './constants.js'

export function padPassword(password: ByteArray): ByteArray {
    const padded = new Uint8Array(32)
    if (password.length >= 32) {
        padded.set(password.subarray(0, 32))
    } else {
        padded.set(password)
        padded.set(
            DEFAULT_PADDING.subarray(0, 32 - password.length),
            password.length,
        )
    }
    return padded
}

export function int32ToLittleEndianBytes(value: number): ByteArray {
    const bytes = new Uint8Array(4)
    bytes[0] = value & 0xff
    bytes[1] = (value >> 8) & 0xff
    bytes[2] = (value >> 16) & 0xff
    bytes[3] = (value >> 24) & 0xff
    return bytes
}

export function removePdfPasswordPadding(buffer: ByteArray) {
    const padding = DEFAULT_PADDING
    const len = buffer.length

    // Find where padding starts
    let end = len
    for (let i = len - 1; i >= 0; i--) {
        const slice = buffer.slice(i)
        const paddingStart = padding.slice(0, slice.length)
        if (
            slice.length === paddingStart.length &&
            slice.every((v, j) => v === paddingStart[j])
        ) {
            end = i
            break
        }
    }
    return buffer.slice(0, end)
}
