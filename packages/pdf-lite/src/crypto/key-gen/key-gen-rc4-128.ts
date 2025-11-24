import { ByteArray } from '../../types'
import { md5 } from '../../utils/algos'
import { concatUint8Arrays } from '../../utils/concatUint8Arrays'
import { rc4 } from '../ciphers/rc4'
import { DEFAULT_PADDING } from '../constants'
import { padPassword } from '../key-derivation/key-derivation'
import { int32ToLittleEndianBytes, removePdfPasswordPadding } from '../utils'

async function rc4EncryptWithKey(
    key: ByteArray,
    data: ByteArray,
): Promise<ByteArray> {
    return await rc4(key).encrypt(data)
}

export async function decryptUserPasswordRc4_128(
    ownerPw: ByteArray,
    ownerKey: ByteArray,
): Promise<ByteArray> {
    const ownerPad = padPassword(ownerPw)
    let digest = await md5(ownerPad)

    for (let i = 0; i < 50; i++) {
        digest = await md5(digest)
    }

    const key = digest.subarray(0, 16)
    let data = ownerKey
    for (let i = 0; i < 20; i++) {
        const roundKey = key.map((b) => b ^ i)
        data = await rc4EncryptWithKey(roundKey, data)
    }

    return removePdfPasswordPadding(data)
}

export async function computeOValueRc4_128(
    ownerPassword: ByteArray,
    userPassword: ByteArray,
): Promise<ByteArray> {
    const oPad = padPassword(ownerPassword)

    let digest = await md5(oPad)
    for (let i = 0; i < 50; i++) {
        digest = await md5(digest)
    }

    const key = digest.subarray(0, 16)

    const uPad = padPassword(userPassword)
    let data = await rc4EncryptWithKey(key, uPad)

    for (let i = 1; i <= 19; i++) {
        const roundKey = key.map((b) => b ^ i)
        data = await rc4EncryptWithKey(roundKey, data)
    }

    return data
}

async function computeEncryptionKeyRc4_128(
    userPad: ByteArray,
    oValue: ByteArray,
    permissions: number,
    id: ByteArray,
    encryptMetadata: boolean,
    revision: number = 3,
): Promise<ByteArray> {
    const perms = int32ToLittleEndianBytes(permissions)

    let digest = await md5(
        concatUint8Arrays(
            userPad,
            oValue,
            perms,
            id,
            revision >= 4 && !encryptMetadata
                ? new Uint8Array([0xff, 0xff, 0xff, 0xff])
                : new Uint8Array(),
        ),
    )

    // 50 iterations
    for (let i = 0; i < 50; i++) {
        digest = await md5(digest)
    }

    return digest.subarray(0, 16) // RC4-128
}

export async function computeUValueRc4_128(
    userPassword: ByteArray,
    oValue: ByteArray,
    permissions: number,
    id: ByteArray,
    encryptMetadata: boolean,
    revision?: number,
): Promise<ByteArray> {
    const userPad = padPassword(userPassword)

    // Step 1: Compute encryption key
    const encryptionKey = await computeEncryptionKeyRc4_128(
        userPad,
        oValue,
        permissions,
        id,
        encryptMetadata,
        revision,
    )

    // Step 2 & 3: MD5 of padding + file ID
    const hash = await md5(concatUint8Arrays(DEFAULT_PADDING, id)) // 16 bytes

    // Step 4: First RC4 encrypt with base key
    let data = await rc4EncryptWithKey(encryptionKey, hash)

    // Step 5: 19 more rounds of RC4 with key XOR i
    for (let i = 1; i <= 19; i++) {
        const roundKey = encryptionKey.map((b) => b ^ i)
        data = await rc4EncryptWithKey(roundKey, data)
    }

    // Step 6: Append 16 more bytes (usually same padding again, or random)
    const result = new Uint8Array(32)
    result.set(data, 0)
    result.set(DEFAULT_PADDING.subarray(0, 16), 16)

    return result
}
