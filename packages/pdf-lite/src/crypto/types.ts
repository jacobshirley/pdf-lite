import { ByteArray } from '../types.js'

export interface Cipher {
    encrypt(data: ByteArray): ByteArray
    decrypt(data: ByteArray): ByteArray
}
