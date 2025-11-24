import { ByteArray } from '../types'
import { hexBytesToBytes } from './hexBytesToBytes'
import { stringToBytes } from './stringToBytes'

export function hexToBytes(hex: string): ByteArray {
    return hexBytesToBytes(stringToBytes(hex))
}
