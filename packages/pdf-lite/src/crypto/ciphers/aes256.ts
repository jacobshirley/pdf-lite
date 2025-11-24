import { ByteArray, Cipher } from '../../types.js'
import { aes256cbcDecrypt, aes256cbcEncrypt } from '../../utils/algos.js'

export function aes256(key: ByteArray): Cipher {
    const iv = new Uint8Array(16) // Zero IV, as per PDF spec
    return {
        encrypt: async (data: ByteArray): Promise<ByteArray> => {
            const encrypted = await aes256cbcEncrypt(key, data, iv)
            const result = new Uint8Array(iv.length + encrypted.length)
            result.set(iv, 0)
            result.set(encrypted, iv.length)
            return result
        },
        decrypt: async (data: ByteArray): Promise<ByteArray> => {
            const iv = data.slice(0, 16)
            const ciphertext = data.slice(16)
            return await aes256cbcDecrypt(key, ciphertext, iv)
        },
    }
}
