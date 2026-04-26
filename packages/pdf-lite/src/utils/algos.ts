import { deflate, Inflate } from 'pako'
import { bytesToHex } from './bytesToHex.js'
import { AlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier.js'
import 'pki-lite-crypto-extended'
import { ByteArray } from '../types.js'
import { cbc, ecb } from '@noble/ciphers/aes.js'
import { sha1 as _sha1, md5 as _md5 } from '@noble/hashes/legacy.js'
import {
    sha256 as _sha256,
    sha384 as _sha384,
    sha512 as _sha512,
} from '@noble/hashes/sha2.js'

/**
 * Computes the SHA-1 hash of the input data.
 *
 * @param input - The data to hash.
 * @returns The SHA-1 hash as a byte array.
 *
 * @example
 * ```typescript
 * const hash = sha1(new Uint8Array([1, 2, 3]))
 * ```
 */
export function sha1(input: ByteArray): ByteArray {
    return _sha1(input)
}

/**
 * Computes the SHA-256 hash of the input data.
 *
 * @param input - The data to hash.
 * @returns The SHA-256 hash as a byte array.
 *
 * @example
 * ```typescript
 * const hash = sha256(new Uint8Array([1, 2, 3]))
 * ```
 */
export function sha256(input: ByteArray): ByteArray {
    return _sha256(input)
}

/**
 * Computes the SHA-384 hash of the input data.
 *
 * @param input - The data to hash.
 * @returns The SHA-384 hash as a byte array.
 *
 * @example
 * ```typescript
 * const hash = sha384(new Uint8Array([1, 2, 3]))
 * ```
 */
export function sha384(input: ByteArray): ByteArray {
    return _sha384(input)
}

/**
 * Computes the SHA-512 hash of the input data.
 *
 * @param input - The data to hash.
 * @returns The SHA-512 hash as a byte array.
 *
 * @example
 * ```typescript
 * const hash = sha512(new Uint8Array([1, 2, 3]))
 * ```
 */
export function sha512(input: ByteArray): ByteArray {
    return _sha512(input)
}

/**
 * Computes the MD5 hash of the input data.
 *
 * @param input - The data to hash.
 * @returns The MD5 hash as a byte array.
 *
 * @example
 * ```typescript
 * const hash = md5(new Uint8Array([1, 2, 3]))
 * ```
 */
export function md5(input: ByteArray): ByteArray {
    return _md5(input)
}

/**
 * Computes a cryptographic hash of the input data using the specified algorithm.
 *
 * @param input - The data to hash.
 * @param algorithm - The hash algorithm to use. Defaults to 'SHA-256'.
 * @returns A promise that resolves to the hash as a byte array.
 * @throws Error if an unsupported hash algorithm is specified.
 *
 * @example
 * ```typescript
 * const hash = hash(data, 'SHA-256')
 * ```
 */
export function hash(
    input: ByteArray,
    algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5' | 'SHA-1' = 'SHA-256',
): ByteArray {
    switch (algorithm) {
        case 'SHA-256':
            return sha256(input)
        case 'SHA-384':
            return sha384(input)
        case 'SHA-512':
            return sha512(input)
        case 'MD5':
            return md5(input)
        case 'SHA-1':
            return sha1(input)
        default:
            throw new Error(`Unsupported hash algorithm: ${algorithm}`)
    }
}

/**
 * Generates cryptographically secure random bytes.
 *
 * @param length - The number of random bytes to generate.
 * @returns A byte array containing random bytes.
 * @throws Error if length is not a positive integer.
 *
 * @example
 * ```typescript
 * const randomBytes = getRandomBytes(16) // 16 random bytes
 * ```
 */
export function getRandomBytes(length: number): ByteArray {
    if (length <= 0) throw new Error('Length must be a positive integer')
    return AlgorithmIdentifier.randomBytes(length)
}

/**
 * Encrypts data using AES-128-CBC mode.
 *
 * @param key - The 16-byte encryption key.
 * @param data - The data to encrypt.
 * @param iv - The 16-byte initialization vector. Defaults to zero IV.
 * @returns A promise that resolves to the encrypted data.
 * @throws Error if the key is not exactly 16 bytes.
 *
 * @example
 * ```typescript
 * const encrypted = await aes128cbcEncrypt(key, plaintext, iv)
 * ```
 */
export function aes128cbcEncrypt(
    key: ByteArray,
    data: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): ByteArray {
    if (key.length !== 16) {
        throw new Error(
            `AES-128 key must be exactly 16 bytes, got ${key.length}`,
        )
    }

    return cbc(key, iv).encrypt(data)
}

/**
 * Decrypts data using AES-128-CBC mode.
 *
 * @param key - The 16-byte decryption key.
 * @param encrypted - The encrypted data to decrypt.
 * @param iv - The 16-byte initialization vector. Defaults to zero IV.
 * @returns A promise that resolves to the decrypted data.
 * @throws Error if the key is not exactly 16 bytes or encrypted data is too short.
 *
 * @example
 * ```typescript
 * const decrypted = await aes128cbcDecrypt(key, ciphertext, iv)
 * ```
 */
export function aes128cbcDecrypt(
    key: ByteArray,
    encrypted: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): ByteArray {
    if (key.length !== 16) {
        throw new Error(
            `AES-128 key must be exactly 16 bytes, got ${key.length}`,
        )
    }
    if (encrypted.length < 16) {
        throw new Error('Encrypted stream too short — no IV found')
    }

    return cbc(key, iv).decrypt(encrypted)
}

/**
 * Encrypts data using AES-256-CBC mode.
 *
 * @param fileKey - The 32-byte encryption key.
 * @param block - The data to encrypt.
 * @param iv - The 16-byte initialization vector. Defaults to zero IV.
 * @returns A promise that resolves to the encrypted data.
 *
 * @example
 * ```typescript
 * const encrypted = aes256cbcEncrypt(key, plaintext, iv)
 * ```
 */
export function aes256cbcEncrypt(
    fileKey: ByteArray,
    block: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): ByteArray {
    return cbc(fileKey, iv).encrypt(block)
}

/**
 * Decrypts data using AES-256-CBC mode.
 *
 * @param fileKey - The 32-byte decryption key.
 * @param ciphertext - The encrypted data to decrypt.
 * @param iv - The 16-byte initialization vector. Defaults to zero IV.
 * @returns The decrypted data.
 *
 * @example
 * ```typescript
 * const decrypted = aes256cbcDecrypt(key, ciphertext, iv)
 * ```
 */
export function aes256cbcDecrypt(
    fileKey: ByteArray,
    ciphertext: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): ByteArray {
    return cbc(fileKey, iv).decrypt(ciphertext)
}

/**
 * Encrypts data using AES-256-ECB mode.
 *
 * @param fileKey - The 32-byte encryption key.
 * @param data - The data to encrypt.
 * @returns A promise that resolves to the encrypted data.
 * @throws Error if the key is not exactly 32 bytes.
 *
 * @example
 * ```typescript
 * const encrypted = await aes256ecbEncrypt(key, plaintext)
 * ```
 */
export function aes256ecbEncrypt(
    fileKey: ByteArray,
    data: ByteArray,
): ByteArray {
    if (fileKey.length !== 32) {
        throw new Error(
            `AES-256 key must be exactly 32 bytes, got ${fileKey.length}`,
        )
    }

    return ecb(fileKey).encrypt(data)
}

/**
 * Decrypts data using AES-256-ECB mode.
 *
 * @param fileKey - The 32-byte decryption key.
 * @param encrypted - The encrypted data to decrypt.
 * @returns The decrypted data.
 * @throws Error if the key is not exactly 32 bytes.
 *
 * @example
 * ```typescript
 * const decrypted = aes256ecbDecrypt(key, ciphertext)
 * ```
 */
export function aes256ecbDecrypt(
    fileKey: ByteArray,
    encrypted: ByteArray,
): ByteArray {
    if (fileKey.length !== 32) {
        throw new Error(
            `AES-256 key must be exactly 32 bytes, got ${fileKey.length}`,
        )
    }

    return ecb(fileKey).decrypt(encrypted)
}

/**
 * Encrypts data using AES-128-CBC mode without PKCS#7 padding.
 *
 * @param key - The 16-byte encryption key.
 * @param data - The data to encrypt. Must be a multiple of 16 bytes.
 * @param iv - The 16-byte initialization vector.
 * @returns A promise that resolves to the encrypted data.
 *
 * @example
 * ```typescript
 * const encrypted = aes128CbcNoPaddingEncrypt(key, data, iv)
 * ```
 */
export function aes128CbcNoPaddingEncrypt(
    key: ByteArray,
    data: ByteArray,
    iv: ByteArray,
): ByteArray {
    return cbc(key, iv, { disablePadding: true }).encrypt(data)
}

/**
 * Encrypts data using AES-256-CBC mode without PKCS#7 padding.
 *
 * @param key - The 32-byte encryption key.
 * @param data - The data to encrypt. Must be a multiple of 16 bytes.
 * @param iv - The 16-byte initialization vector.
 * @returns A promise that resolves to the encrypted data.
 *
 * @example
 * ```typescript
 * const encrypted = aes256CbcNoPaddingEncrypt(key, data, iv)
 * ```
 */
export function aes256CbcNoPaddingEncrypt(
    key: ByteArray,
    data: ByteArray,
    iv: ByteArray,
): ByteArray {
    return cbc(key, iv, { disablePadding: true }).encrypt(data)
}

/**
 * Decrypts data using AES-256-CBC mode without PKCS#7 padding.
 *
 * @param key - The 32-byte decryption key.
 * @param ciphertext - The encrypted data to decrypt.
 * @param iv - The 16-byte initialization vector. Defaults to zero IV.
 * @returns The decrypted data.
 *
 * @example
 * ```typescript
 * const decrypted = aes256CbcNoPaddingDecrypt(key, ciphertext, iv)
 * ```
 */
export function aes256CbcNoPaddingDecrypt(
    key: ByteArray,
    ciphertext: ByteArray,
    iv: ByteArray = new Uint8Array(16),
): ByteArray {
    return cbc(key, iv, { disablePadding: true }).decrypt(ciphertext)
}

/**
 * Compresses data using the DEFLATE algorithm.
 *
 * @param data - The data to compress.
 * @returns The compressed data as a byte array.
 *
 * @example
 * ```typescript
 * const compressed = deflateData(rawData)
 * ```
 */
export function deflateData(data: ByteArray): ByteArray {
    const output = deflate(data)
    if (!output) {
        return new Uint8Array(0)
    }
    return output
}

/**
 * Decompresses data using the INFLATE algorithm (reverses DEFLATE).
 *
 * @param data - The compressed data to decompress.
 * @returns The decompressed data as a byte array.
 * @throws Error if inflation fails due to invalid or corrupted data.
 *
 * @example
 * ```typescript
 * const decompressed = inflateData(compressedData)
 * ```
 */
export function inflateData(data: ByteArray): ByteArray {
    if (data.length === 0) {
        return new Uint8Array(0) // Return empty array for empty input
    }

    const isWhitespace = (byte: number): boolean => {
        return byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d
    }

    const inflate = new Inflate()
    inflate.push(data, true)

    if (inflate.err || !inflate.result) {
        if (isWhitespace(data[data.length - 1])) {
            data = data.slice(0, -1) // Remove trailing whitespace
            return inflateData(data) // Retry inflation after removing whitespace
        }
        throw new Error(
            `Inflate error: ${inflate.err} - ${inflate.msg}. Data hex: ${bytesToHex(data)}`,
        ) // Log the hex representation of the data for debugging
    }

    return inflate.result as ByteArray
}
