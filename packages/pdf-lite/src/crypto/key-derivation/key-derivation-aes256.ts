import { ByteArray } from '../../types'
import {
    aes128CbcNoPaddingEncrypt,
    aes256CbcNoPaddingDecrypt,
    sha256,
    sha384,
    sha512,
} from '../../utils/algos'
import { assert } from '../../utils/assert'

function getUint16ByteBigEndian(input: ByteArray): bigint {
    let value = 0n
    for (let i = 0; i < 16; i++) {
        value = (value << 8n) | BigInt(input[i])
    }
    return value
}

export async function computeAlgorithm2bHash(
    password: ByteArray,
    salt: ByteArray,
    userKey: ByteArray = new Uint8Array(),
): Promise<ByteArray> {
    // Step 1: Initial hash
    let K = new Uint8Array(password.length + salt.length + userKey.length)
    K.set(password)
    K.set(salt, password.length)
    K.set(userKey, password.length + salt.length)

    K = await sha256(K)

    let roundNumber = 0
    let E: ByteArray = new Uint8Array()
    while (roundNumber < 64 || E.at(-1)! > roundNumber - 32) {
        // Step 2: K1 = 64 × (password || K || [userKey])
        const base = new Uint8Array(password.length + K.length + userKey.length)
        base.set(password)
        base.set(K, password.length)
        base.set(userKey, password.length + K.length)

        const K1 = new Uint8Array(base.length * 64)
        for (let i = 0; i < 64; i++) {
            K1.set(base, i * base.length)
        }

        // Step 3: Encrypt K1 with AES-128-CBC using key/iv from K
        const key = K.subarray(0, 16)
        const iv = K.subarray(16, 32)
        E = await aes128CbcNoPaddingEncrypt(key, K1, iv)

        // Step 4: Choose hash
        const value = getUint16ByteBigEndian(E)
        const mod = Number(value % 3n)

        if (mod === 0) {
            K = await sha256(E)
        } else if (mod === 1) {
            K = await sha384(E)
        } else if (mod === 2) {
            K = await sha512(E)
        } else {
            throw new Error('Invalid mod')
        }

        roundNumber++
    }

    return K.subarray(0, 32)
}

export async function validatePasswordHash(
    password: ByteArray,
    key: ByteArray,
    extra?: ByteArray,
): Promise<ByteArray> {
    const validationSalt = key.slice(32, 40)
    if (validationSalt.length !== 8) {
        throw new Error('Invalid salt length')
    }

    const hash = await computeAlgorithm2bHash(password, validationSalt, extra)

    if (hash.length !== 32) {
        throw new Error('Invalid hash length')
    }

    for (let i = 0; i < 32; i++) {
        if (hash[i] !== key[i]) {
            throw new Error('Key mismatch')
        }
    }

    return hash
}

export async function getFileKey(
    userPassword: ByteArray,
    ownerPassword: ByteArray,
    u: ByteArray,
    ue: ByteArray,
    o: ByteArray,
    oe: ByteArray,
): Promise<ByteArray> {
    if (userPassword.length > 128) {
        userPassword = userPassword.subarray(0, 128)
    }

    if (ownerPassword.length > 128) {
        ownerPassword = ownerPassword.subarray(0, 128)
    }

    assert(oe.length === 32, 'Invalid OE length')
    assert(ue.length === 32, 'Invalid UE length')
    assert(u.length === 48, 'Invalid U length')
    assert(o.length === 48, 'Invalid O length')

    try {
        // First try owner password
        await validatePasswordHash(ownerPassword, o, u)

        const hash = await computeAlgorithm2bHash(
            ownerPassword,
            o.subarray(40, 48),
            u,
        )

        const key = await aes256CbcNoPaddingDecrypt(
            hash,
            oe,
            new Uint8Array(16),
        )

        return key
    } catch (e) {
        try {
            // Then try user password

            await validatePasswordHash(userPassword, u)

            const hash = await computeAlgorithm2bHash(
                userPassword,
                u.subarray(40, 48),
            )
            const key = await aes256CbcNoPaddingDecrypt(
                hash,
                ue,
                new Uint8Array(16),
            )

            return key
        } catch (e) {
            throw new Error('Invalid password')
        }
    }
}
