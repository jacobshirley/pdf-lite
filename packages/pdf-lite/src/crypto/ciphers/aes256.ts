import { ByteArray } from '../../types.js'
import { aes256cbcDecrypt, aes256cbcEncrypt } from '../../utils/algos.js'
import { Cipher } from '../types.js'

/**
 * Creates an AES-256-CBC cipher for PDF encryption.
 * The cipher prepends a zero IV to encrypted data during encryption
 * and extracts the IV from the first 16 bytes during decryption.
 *
 * @param key - The 32-byte encryption key.
 * @returns A Cipher object with encrypt and decrypt methods.
 *
 * @example
 * ```typescript
 * const cipher = aes256(key)
 * const encrypted = await cipher.encrypt(plaintext)
 * const decrypted = await cipher.decrypt(encrypted)
 * ```
 */
export function aes256(key: ByteArray): Cipher {
    const iv = new Uint8Array(16) // Zero IV, as per PDF spec
    return {
        /**
         * Encrypts data using AES-256-CBC.
         * Prepends the IV to the ciphertext.
         *
         * @param data - The data to encrypt.
         * @returns A promise that resolves to IV followed by ciphertext.
         */
        encrypt: async (data: ByteArray): Promise<ByteArray> => {
            const encrypted = await aes256cbcEncrypt(key, data, iv)
            const result = new Uint8Array(iv.length + encrypted.length)
            result.set(iv, 0)
            result.set(encrypted, iv.length)
            return result
        },
        /**
         * Decrypts data using AES-256-CBC.
         * Extracts the IV from the first 16 bytes of the input.
         *
         * @param data - The data to decrypt (IV + ciphertext).
         * @returns A promise that resolves to the decrypted plaintext.
         */
        decrypt: async (data: ByteArray): Promise<ByteArray> => {
            const iv = data.slice(0, 16)
            const ciphertext = data.slice(16)
            return await aes256cbcDecrypt(key, ciphertext, iv)
        },
    }
}
