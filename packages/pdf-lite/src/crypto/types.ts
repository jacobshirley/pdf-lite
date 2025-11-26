import { ByteArray } from '../types'

export interface Cipher {
    encrypt(data: ByteArray): Promise<ByteArray>
    decrypt(data: ByteArray): Promise<ByteArray>
}
