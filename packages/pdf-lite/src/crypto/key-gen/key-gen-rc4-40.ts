import { rc4 } from '../ciphers/rc4.js'
import { DEFAULT_PADDING } from '../constants.js'
import {
    int32ToLittleEndianBytes,
    padPassword,
    removePdfPasswordPadding,
} from '../utils.js'
import { md5 } from '../../utils/algos.js'
import { concatUint8Arrays } from '../../utils/concatUint8Arrays.js'
import { ByteArray } from '../../types.js'

/**
 * Encrypts data with RC4 using the provided key.
 *
 * @param key - The encryption key.
 * @param data - The data to encrypt.
 * @returns The encrypted data.
 */
function rc4EncryptWithKey(key: ByteArray, data: ByteArray): ByteArray {
    return rc4(key).encrypt(data)
}

/**
 * Decrypts the user password from the /O value using RC4-40.
 * Used to recover the user password when the owner password is known.
 *
 * @param ownerPw - The owner password.
 * @param ownerKey - The /O value from the encryption dictionary.
 * @returns A promise that resolves to the decrypted user password (with padding removed).
 *
 * @example
 * ```typescript
 * const userPassword = decryptUserPasswordRc4_40(ownerPw, O)
 * ```
 */
export function decryptUserPasswordRc4_40(
    ownerPw: ByteArray,
    ownerKey: ByteArray,
): ByteArray {
    const ownerPad = padPassword(ownerPw)
    const digest = md5(ownerPad)
    const rc4Key = digest.slice(0, 5) // 40-bit key

    return removePdfPasswordPadding(rc4EncryptWithKey(rc4Key, ownerKey))
}

/**
 * Computes the /O value for RC4-40 PDF encryption.
 * The /O value is used to verify the owner password.
 *
 * @param ownerPw - The owner password.
 * @param userPw - The user password.
 * @returns A promise that resolves to the 32-byte /O value.
 *
 * @example
 * ```typescript
 * const O = computeORc4_40(ownerPassword, userPassword)
 * ```
 */
export function computeORc4_40(
    ownerPw: ByteArray,
    userPw: ByteArray,
): ByteArray {
    const ownerPad = padPassword(ownerPw)
    const digest = md5(ownerPad)
    const rc4Key = digest.slice(0, 5) // 40-bit key

    return rc4EncryptWithKey(rc4Key, padPassword(userPw))
}

/**
 * Computes the 40-bit encryption key for RC4-40 PDF encryption.
 *
 * @param userPw - The user password.
 * @param oValue - The /O value.
 * @param permissions - The /P value (permissions flags).
 * @param fileId - The first element of the /ID array.
 * @returns A promise that resolves to the 5-byte (40-bit) encryption key.
 *
 * @example
 * ```typescript
 * const key = computeEncryptionKeyRc4_40(userPw, O, permissions, fileId)
 * ```
 */
export function computeEncryptionKeyRc4_40(
    userPw: ByteArray,
    oValue: ByteArray,
    permissions: number,
    fileId: ByteArray,
): ByteArray {
    const userPad = padPassword(userPw)
    const permissionsLE = int32ToLittleEndianBytes(permissions)
    const digest = md5(
        concatUint8Arrays([userPad, oValue, permissionsLE, fileId]),
    )
    return digest.slice(0, 5) // 40-bit key
}

/**
 * Computes the /U value for RC4-40 PDF encryption.
 * The /U value is used to verify the user password.
 *
 * @param userPw - The user password.
 * @param oValue - The /O value.
 * @param permissions - The /P value (permissions flags).
 * @param fileId - The first element of the /ID array.
 * @returns A promise that resolves to the 32-byte /U value.
 *
 * @example
 * ```typescript
 * const U = computeURc4_40(userPassword, O, permissions, fileId)
 * ```
 */
export function computeURc4_40(
    userPw: ByteArray,
    oValue: ByteArray,
    permissions: number,
    fileId: ByteArray,
): ByteArray {
    const encryptionKey = computeEncryptionKeyRc4_40(
        userPw,
        oValue,
        permissions,
        fileId,
    )
    return rc4EncryptWithKey(encryptionKey, DEFAULT_PADDING)
}
