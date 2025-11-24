import { rc4 } from '../../crypto/ciphers/rc4'
import {
    computeOValueRc4_128,
    computeUValueRc4_128,
    decryptUserPasswordRc4_128,
} from '../../crypto/key-gen/key-gen-rc4-128'
import { ByteArray, Cipher } from '../../types'
import { bytesToString } from '../../utils/bytesToString'
import { stringToBytes } from '../../utils/stringToBytes'
import { V1SecurityHandler } from './v1'

export class V2SecurityHandler extends V1SecurityHandler {
    getRevision(): number {
        return 3
    }

    getVersion(): number {
        return 2
    }

    getKeyBits(): number {
        return 128
    }

    protected async computeOwnerKey(): Promise<ByteArray> {
        return await computeOValueRc4_128(
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

        return await computeUValueRc4_128(
            this.password,
            this.ownerKey,
            this.permissions,
            this.documentId.items[0].bytes,
            this.encryptMetadata,
            this.getRevision(),
        )
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

        const password = await decryptUserPasswordRc4_128(
            stringToBytes(ownerPassword!),
            this.ownerKey!,
        )

        return bytesToString(password)
    }
}
