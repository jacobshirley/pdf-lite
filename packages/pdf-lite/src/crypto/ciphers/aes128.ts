import { ByteArray, Cipher } from '../../types.js'
import { aes128cbcDecrypt, aes128cbcEncrypt } from '../../utils/algos.js'

export function aes128(key: ByteArray): Cipher {
    if (key.length !== 16)
        throw new Error(
            `AES-128 key must be exactly 16 bytes, got ${key.length}`,
        )

    const iv = new Uint8Array(16) // Zero IV, as per PDF spec

    return {
        encrypt: async (data: ByteArray): Promise<ByteArray> => {
            if (iv.length !== 16) throw new Error('IV must be exactly 16 bytes')

            const encrypted = await aes128cbcEncrypt(key, data)
            const result = new Uint8Array(iv.length + encrypted.length)

            result.set(iv, 0)
            result.set(encrypted, iv.length)

            return result
        },
        decrypt: async (data: ByteArray): Promise<ByteArray> => {
            const iv = data.slice(0, 16)
            const ciphertext = data.slice(16)

            return await aes128cbcDecrypt(key, ciphertext, iv)
        },
    }
}
