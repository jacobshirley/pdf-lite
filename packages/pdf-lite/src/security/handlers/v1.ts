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
import { ByteArray, Cipher } from '../../types'
import { assert } from '../../utils/assert'
import { bytesToString } from '../../utils/bytesToString'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfEncryptionAlgorithmType } from '../types'
import { PdfStandardSecurityHandler } from './base'

export class V1SecurityHandler extends PdfStandardSecurityHandler {
    getRevision(): number {
        return 2
    }

    getVersion(): number {
        return 1
    }

    getKeyBits(): number {
        return 40
    }

    protected async computeOwnerKey(): Promise<ByteArray> {
        return await computeORc4_40(
            this.ownerPassword ?? this.password,
            this.password,
        )
    }

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

    protected async getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher> {
        const key = await this.computeObjectKey(objectNumber, generationNumber)

        return rc4(key)
    }

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
