import { describe, it, expect } from 'vitest'
import { aes128 } from '../../../src/crypto/ciphers/aes128.js'
import { rc4 } from '../../../src/crypto/ciphers/rc4.js'
import { aes256 } from '../../../src/crypto/ciphers/aes256.js'
import { getRandomBytes } from '../../../src/utils/algos.js'
import { stringToBytes } from '../../../src/utils/stringToBytes.js'

describe('PDF Ciphers', () => {
    describe('AES-128-CBC', () => {
        it('should encrypt and decrypt data correctly', async () => {
            const data = 'Hello World!'
            const key = Uint8Array.from([
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
            ])
            const cipher = aes128(key)
            const encrypted = await cipher.encrypt(stringToBytes(data))
            const decrypted = await cipher.decrypt(encrypted)
            const decryptedText = new TextDecoder().decode(decrypted)
            expect(decryptedText).toBe(data)
        })
    })

    describe('AES-256-CBC', () => {
        it('should encrypt and decrypt data correctly', async () => {
            const data = 'Hello World!'
            // 32 bytes for AES-256
            const key = getRandomBytes(32)
            const cipher = aes256(key)
            const encrypted = await cipher.encrypt(stringToBytes(data))
            const decrypted = await cipher.decrypt(encrypted)
            const decryptedText = new TextDecoder().decode(decrypted)
            expect(decryptedText).toBe(data)
        })
    })

    describe('RC4-40', () => {
        it('should encrypt and decrypt data correctly', async () => {
            const data = 'Hello World!'
            const key = Uint8Array.from([1, 2, 3, 4, 5])
            const cipher = rc4(key)
            const encrypted = await cipher.encrypt(stringToBytes(data))
            const decrypted = await cipher.decrypt(encrypted)
            const decryptedText = new TextDecoder().decode(decrypted)
            expect(decryptedText).toBe(data)
        })
    })

    describe('RC4-128', () => {
        it('should encrypt and decrypt data correctly', async () => {
            const data = 'Hello World!'
            const key = Uint8Array.from([
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
            ])
            const cipher = rc4(key)
            const encrypted = await cipher.encrypt(stringToBytes(data))
            const decrypted = await cipher.decrypt(encrypted)
            const decryptedText = new TextDecoder().decode(decrypted)
            expect(decryptedText).toBe(data)
        })
    })
})
