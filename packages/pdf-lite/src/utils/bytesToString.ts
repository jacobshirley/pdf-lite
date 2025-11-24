import { ByteArray } from '../types'

export function bytesToString(bytes: ByteArray): string {
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
}
