import { ByteArray } from '../types'
import { bytesToHexBytes } from './bytesToHexBytes'
import { bytesToString } from './bytesToString'

export function bytesToHex(bytes: ByteArray): string {
    return bytesToString(bytesToHexBytes(bytes))
}
