import { rc4 } from '../../crypto/ciphers/rc4'
import {
    computeMasterKey,
    deriveObjectKey,
} from '../../crypto/key-derivation/key-derivation'
import {
    computeORc4_40,
    computeURc4_40,
    decryptUserPasswordRc4_40,
} from '../../crypto/key-gen/key-gen-rc4-40'
import { Cipher } from '../../crypto/types'
import { ByteArray } from '../../types'
import { assert } from '../../utils/assert'
import { bytesToString } from '../../utils/bytesToString'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfEncryptionAlgorithmType } from '../types'
import { PdfStandardSecurityHandler } from './base'

/**
 * V1 security handler implementing 40-bit RC4 encryption.
 * This is the original PDF encryption format (PDF 1.1).
 *
 * @example
 * ```typescript
 * const handler = new PdfV1SecurityHandler({
 *     password: 'user123',
 *     ownerPassword: 'admin456'
 * })
 * ```
 */
export class PdfV1SecurityHandler extends PdfStandardSecurityHandler {
    /**
     * Gets the encryption revision number.
     *
     * @returns 2 for V1 encryption.
     */
    getRevision(): number {
        return 2
    }

    /**
     * Gets the encryption version number.
     *
     * @returns 1 for 40-bit RC4 encryption.
     */
    getVersion(): number {
        return 1
    }

    /**
     * Gets the encryption key length in bits.
     *
     * @returns 40 for V1 encryption.
     */
    getKeyBits(): number {
        return 40
    }

    /**
     * Computes the owner key (O value) using RC4-40 algorithm.
     *
     * @returns The computed owner key.
     */
    protected async computeOwnerKey(): Promise<ByteArray> {
        return await computeORc4_40(
            this.ownerPassword ?? this.password,
            this.password,
        )
    }

    /**
     * Computes the user key (U value) using RC4-40 algorithm.
     *
     * @returns The computed user key.
     * @throws Error if document ID, owner key, or permissions are not set.
     */
    protected async computeUserKey(): Promise<ByteArray> {
        if (!this.documentId) {
            throw new Error('Document ID is required to compute U value')
        }

        if (!this.ownerKey) {
            throw new Error('Owner key is required to compute U value')
        }

        if (typeof this.permissions !== 'number') {
            throw new Error('Permissions are required to compute U value')
        }

        return await computeURc4_40(
            this.password,
            this.ownerKey,
            this.permissions,
            this.documentId.items[0].bytes,
        )
    }

    /**
     * Computes the master encryption key from the password.
     *
     * @returns The computed master key.
     * @throws Error if required parameters are missing or password is incorrect.
     */
    protected async computeMasterKey(): Promise<ByteArray> {
        await this.initKeys()

        assert(this.ownerKey, 'ownerKey is required')
        assert(this.permissions !== undefined, 'Permissions are required')
        assert(this.documentId, 'Document ID is required')
        assert(
            this.encryptMetadata !== undefined,
            'Encrypt metadata is required',
        )

        if (this.ownerPassword) {
            const recoverPass = await this.recoverUserPassword(
                this.ownerPassword,
            )

            return await computeMasterKey(
                stringToBytes(recoverPass),
                this.ownerKey,
                this.permissions,
                this.documentId.items[0].bytes,
                this.getKeyBits(),
                this.encryptMetadata,
                this.getRevision(),
            )
        } else {
            const expectedUValue = await this.computeUserKey()

            assert(
                this.userKey &&
                    expectedUValue.length === this.userKey.length &&
                    expectedUValue.every(
                        (byte, index) => byte === this.userKey![index],
                    ),
                'Incorrect user password',
            )
        }

        return await computeMasterKey(
            this.password,
            this.ownerKey,
            this.permissions,
            this.documentId.items[0].bytes,
            this.getKeyBits(),
            this.encryptMetadata,
            this.getRevision(),
        )
    }

    /**
     * Computes the object-specific encryption key.
     *
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @param algorithm - Optional algorithm type for key derivation.
     * @returns The computed object key.
     * @throws Error if object or generation number is invalid.
     */
    async computeObjectKey(
        objectNumber?: number,
        generationNumber?: number,
        algorithm?: PdfEncryptionAlgorithmType,
    ): Promise<ByteArray> {
        assert(
            objectNumber !== undefined,
            'Object number is required to derive the key',
        )
        assert(
            generationNumber !== undefined,
            'Generation number is required to derive the key',
        )

        assert(objectNumber > 0, 'Object number cannot be zero or negative')
        assert(generationNumber >= 0, 'Generation number cannot be negative')

        this.masterKey ||= await this.computeMasterKey()

        const key = await deriveObjectKey(
            this.masterKey,
            objectNumber,
            generationNumber,
            algorithm === 'AES-128-CBC',
        )

        return key
    }

    /**
     * Gets an RC4 cipher for the specified object.
     *
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns An RC4 cipher instance.
     */
    protected async getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher> {
        const key = await this.computeObjectKey(objectNumber, generationNumber)

        return rc4(key)
    }

    /**
     * Recovers the user password from the owner password.
     *
     * @param ownerPassword - The owner password.
     * @returns The recovered user password as a string.
     */
    async recoverUserPassword(
        ownerPassword?: ByteArray | string,
    ): Promise<string> {
        ownerPassword ||= this.ownerPassword

        const password = await decryptUserPasswordRc4_40(
            stringToBytes(ownerPassword!),
            this.ownerKey!,
        )

        return bytesToString(password)
    }
}
