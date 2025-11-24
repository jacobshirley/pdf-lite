import { padPassword } from '../key-derivation/key-derivation.js'
import { rc4 } from '../ciphers/rc4.js'
import { DEFAULT_PADDING } from '../constants.js'
import { int32ToLittleEndianBytes, removePdfPasswordPadding } from '../utils.js'
import { md5 } from '../../utils/algos.js'
import { concatUint8Arrays } from '../../utils/concatUint8Arrays.js'
import { ByteArray } from '../../types.js'

async function rc4EncryptWithKey(
    key: ByteArray,
    data: ByteArray,
): Promise<ByteArray> {
    return await rc4(key).encrypt(data)
}

export async function decryptUserPasswordRc4_40(
    ownerPw: ByteArray,
    ownerKey: ByteArray,
): Promise<ByteArray> {
    const ownerPad = padPassword(ownerPw)
    const digest = await md5(ownerPad)
    const rc4Key = digest.slice(0, 5) // 40-bit key

    return await removePdfPasswordPadding(
        await rc4EncryptWithKey(rc4Key, ownerKey),
    )
}

export async function computeORc4_40(
    ownerPw: ByteArray,
    userPw: ByteArray,
): Promise<ByteArray> {
    const ownerPad = padPassword(ownerPw)
    const digest = await md5(ownerPad)
    const rc4Key = digest.slice(0, 5) // 40-bit key

    return await rc4EncryptWithKey(rc4Key, padPassword(userPw))
}

// Compute 40-bit encryption key
export async function computeEncryptionKeyRc4_40(
    userPw: ByteArray,
    oValue: ByteArray,
    permissions: number,
    fileId: ByteArray,
): Promise<ByteArray> {
    const userPad = padPassword(userPw)
    const permissionsLE = int32ToLittleEndianBytes(permissions)
    const digest = await md5(
        concatUint8Arrays(userPad, oValue, permissionsLE, fileId),
    )
    return digest.slice(0, 5) // 40-bit key
}

// /U entry (user password hash)
export async function computeURc4_40(
    userPw: ByteArray,
    oValue: ByteArray,
    permissions: number,
    fileId: ByteArray,
): Promise<ByteArray> {
    const encryptionKey = await computeEncryptionKeyRc4_40(
        userPw,
        oValue,
        permissions,
        fileId,
    )
    return await rc4EncryptWithKey(encryptionKey, DEFAULT_PADDING)
}
