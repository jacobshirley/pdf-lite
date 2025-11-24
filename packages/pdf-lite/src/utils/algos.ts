import { deflate, Inflate } from 'pako'
import { bytesToHex } from './bytesToHex.js'
import { AlgorithmIdentifier } from 'pki-lite/algorithms/AlgorithmIdentifier'
import 'pki-lite-crypto-extended'
import { ByteArray } from '../types.js'

export async function sha1(input: ByteArray): Promise<ByteArray> {
    return AlgorithmIdentifier.digestAlgorithm('SHA-1').digest(input)
}

export async function sha256(input: ByteArray): Promise<ByteArray> {
    return AlgorithmIdentifier.digestAlgorithm('SHA-256').digest(input)
}

export async function sha384(input: ByteArray): Promise<ByteArray> {
    return AlgorithmIdentifier.digestAlgorithm('SHA-384').digest(input)
}

export async function sha512(input: ByteArray): Promise<ByteArray> {
    return AlgorithmIdentifier.digestAlgorithm('SHA-512').digest(input)
}

export async function md5(input: ByteArray): Promise<ByteArray> {
    return AlgorithmIdentifier.digestAlgorithm('MD5').digest(input)
}

export async function hash(
    input: ByteArray,
    algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5' | 'SHA-1' = 'SHA-256',
): Promise<ByteArray> {
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

export function getRandomBytes(length: number): ByteArray {
    if (length <= 0) throw new Error('Length must be a positive integer')
    return AlgorithmIdentifier.randomBytes(length)
}

export async function aes128cbcEncrypt(
    key: ByteArray,
    data: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): Promise<ByteArray> {
    if (key.length !== 16) {
        throw new Error(
            `AES-128 key must be exactly 16 bytes, got ${key.length}`,
        )
    }

    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_128_CBC',
        params: {
            nonce: iv,
        },
    }).encrypt(data, key)
}

export async function aes128cbcDecrypt(
    key: ByteArray,
    encrypted: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): Promise<ByteArray> {
    if (key.length !== 16) {
        throw new Error(
            `AES-128 key must be exactly 16 bytes, got ${key.length}`,
        )
    }
    if (encrypted.length < 16) {
        throw new Error('Encrypted stream too short — no IV found')
    }

    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_128_CBC',
        params: {
            nonce: iv,
        },
    }).decrypt(encrypted, key)
}

export async function aes256cbcEncrypt(
    fileKey: ByteArray,
    block: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): Promise<ByteArray> {
    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_256_CBC',
        params: {
            nonce: iv,
        },
    }).encrypt(block, fileKey)
}

export async function aes256cbcDecrypt(
    fileKey: ByteArray,
    ciphertext: ByteArray,
    iv: ByteArray = new Uint8Array(16), // Zero IV, as per PDF spec
): Promise<ByteArray> {
    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_256_CBC',
        params: {
            nonce: iv,
        },
    }).decrypt(ciphertext, fileKey)
}

export async function aes256ecbEncrypt(
    fileKey: ByteArray,
    data: ByteArray,
): Promise<ByteArray> {
    if (fileKey.length !== 32) {
        throw new Error(
            `AES-256 key must be exactly 32 bytes, got ${fileKey.length}`,
        )
    }

    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_256_ECB',
        params: {},
    }).encrypt(data, fileKey)
}

export async function aes256ecbDecrypt(
    fileKey: ByteArray,
    encrypted: ByteArray,
): Promise<ByteArray> {
    if (fileKey.length !== 32) {
        throw new Error(
            `AES-256 key must be exactly 32 bytes, got ${fileKey.length}`,
        )
    }

    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_256_ECB',
        params: {},
    }).decrypt(encrypted, fileKey)
}

export async function aes128CbcNoPaddingEncrypt(
    key: ByteArray,
    data: ByteArray,
    iv: ByteArray,
): Promise<ByteArray> {
    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_128_CBC',
        params: {
            nonce: iv,
            disablePadding: true,
        },
    }).encrypt(data, key)
}

export async function aes256CbcNoPaddingEncrypt(
    key: ByteArray,
    data: ByteArray,
    iv: ByteArray,
): Promise<ByteArray> {
    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_256_CBC',
        params: {
            nonce: iv,
            disablePadding: true,
        },
    }).encrypt(data, key)
}

export async function aes256CbcNoPaddingDecrypt(
    key: ByteArray,
    ciphertext: ByteArray,
    iv: ByteArray = new Uint8Array(16),
): Promise<ByteArray> {
    return AlgorithmIdentifier.contentEncryptionAlgorithm({
        type: 'AES_256_CBC',
        params: {
            nonce: iv,
            disablePadding: true,
        },
    }).decrypt(ciphertext, key)
}

export function deflateData(data: ByteArray): ByteArray {
    const output = deflate(data)
    if (!output) {
        return new Uint8Array(0)
    }
    return output
}

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
            data = data.slice(0, -1) // Remove trailing whitespace]
            return inflateData(data) // Retry inflation after removing whitespace
        }
        throw new Error(
            `Inflate error: ${inflate.err} - ${inflate.msg}. Data hex: ${bytesToHex(data)}`,
        ) // Log the hex representation of the data for debugging
    }

    return inflate.result as ByteArray
}
