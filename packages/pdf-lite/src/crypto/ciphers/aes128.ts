import { ByteArray, Cipher } from '../../types.js'
import { aes128cbcDecrypt, aes128cbcEncrypt } from '../../utils/algos.js'

/**
 * Creates an AES-128-CBC cipher for PDF encryption.
 * The cipher prepends a zero IV to encrypted data during encryption
 * and extracts the IV from the first 16 bytes during decryption.
 *
 * @param key - The 16-byte encryption key.
 * @returns A Cipher object with encrypt and decrypt methods.
 * @throws Error if the key is not exactly 16 bytes.
 *
 * @example
 * ```typescript
 * const cipher = aes128(key)
 * const encrypted = await cipher.encrypt(plaintext)
 * const decrypted = await cipher.decrypt(encrypted)
 * ```
 */
export function aes128(key: ByteArray): Cipher {
    if (key.length !== 16)
        throw new Error(
            `AES-128 key must be exactly 16 bytes, got ${key.length}`,
        )

    const iv = new Uint8Array(16) // Zero IV, as per PDF spec

    return {
        /**
         * Encrypts data using AES-128-CBC.
         * Prepends the IV to the ciphertext.
         *
         * @param data - The data to encrypt.
         * @returns A promise that resolves to IV followed by ciphertext.
         * @throws Error if the IV is not exactly 16 bytes.
         */
        encrypt: async (data: ByteArray): Promise<ByteArray> => {
            if (iv.length !== 16) throw new Error('IV must be exactly 16 bytes')

            const encrypted = await aes128cbcEncrypt(key, data)
            const result = new Uint8Array(iv.length + encrypted.length)

            result.set(iv, 0)
            result.set(encrypted, iv.length)

            return result
        },
        /**
         * Decrypts data using AES-128-CBC.
         * Extracts the IV from the first 16 bytes of the input.
         *
         * @param data - The data to decrypt (IV + ciphertext).
         * @returns A promise that resolves to the decrypted plaintext.
         */
        decrypt: async (data: ByteArray): Promise<ByteArray> => {
            const iv = data.slice(0, 16)
            const ciphertext = data.slice(16)

            return await aes128cbcDecrypt(key, ciphertext, iv)
        },
    }
}
