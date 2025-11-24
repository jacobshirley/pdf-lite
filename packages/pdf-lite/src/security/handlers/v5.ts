import { aes256 } from '../../crypto/ciphers/aes256'
import { getFileKey } from '../../crypto/key-derivation/key-derivation-aes256'
import {
    generateOandOe,
    generateUandUe,
} from '../../crypto/key-gen/key-gen-aes256'
import { ByteArray, Cipher } from '../../types'
import { aes256ecbEncrypt, getRandomBytes } from '../../utils/algos'
import { assert } from '../../utils/assert'
import { PdfEncryptionDictionary } from '../types'
import { V4SecurityHandler } from './v4'
import { PdfStandardSecurityHandlerOptions } from './base'
import { AesV3CryptFilter } from '../crypt-filters/aesv3'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal'
import { PdfString } from '../../core/objects/pdf-string'

export class V5SecurityHandler extends V4SecurityHandler {
    protected userEncryptedFileKey?: ByteArray
    protected ownerEncryptedFileKey?: ByteArray
    protected perms?: ByteArray
    protected fileKey?: Promise<ByteArray>

    constructor(
        options: PdfStandardSecurityHandlerOptions & {
            userEncryptedFileKey?: ByteArray
            ownerEncryptedFileKey?: ByteArray
        },
    ) {
        super(options)
        this.userEncryptedFileKey = options.userEncryptedFileKey
        this.ownerEncryptedFileKey = options.ownerEncryptedFileKey

        this.setCryptFilter(
            'StdCF',
            new AesV3CryptFilter({
                authEvent: 'DocOpen',
            }),
        )

        this.setCryptFilterForType('stream', 'StdCF')
        this.setCryptFilterForType('string', 'StdCF')
    }

    isReady(): boolean {
        return !!this.userEncryptedFileKey
    }

    protected async initKeys(): Promise<void> {
        this.fileKey ||= (async () => {
            if (
                this.userEncryptedFileKey &&
                this.ownerEncryptedFileKey &&
                this.userKey &&
                this.ownerKey &&
                this.perms
            ) {
                const derivedFileKey = await getFileKey(
                    this.password,
                    this.ownerPassword ?? this.password,
                    this.userKey,
                    this.userEncryptedFileKey,
                    this.ownerKey,
                    this.ownerEncryptedFileKey,
                )

                return derivedFileKey
            }
            const fileKey = getRandomBytes(32)

            const { U, UE } = await generateUandUe(this.password, fileKey)

            this.userKey = U
            this.userEncryptedFileKey = UE

            const { O, OE } = await generateOandOe(
                this.ownerPassword ?? this.password,
                U,
                fileKey,
            )

            this.ownerKey = O
            this.ownerEncryptedFileKey = OE

            this.perms = await this.buildPermsEntry(
                this.permissions ?? 0,
                this.encryptMetadata,
                fileKey,
            )

            return fileKey
        })()

        await this.fileKey
    }

    protected async computeMasterKey(): Promise<ByteArray> {
        await this.initKeys()

        if (!this.fileKey) {
            throw new Error('File key not initialized')
        }

        return this.fileKey
    }

    private async buildPermsEntry(
        flags: number,
        encryptMetadata: boolean,
        fileKey: ByteArray,
    ): Promise<ByteArray> {
        const block = new Uint8Array(16)

        // a + b) permissions + 0xFFFFFFFF (little-endian)
        const view = new DataView(block.buffer)
        view.setUint32(0, flags, true) // little-endian
        view.setUint32(4, 0xffffffff, true) // upper 32 bits

        // c) "T" or "F"
        block[8] = encryptMetadata ? 'T'.charCodeAt(0) : 'F'.charCodeAt(0)

        // d) "adb"
        block[9] = 'a'.charCodeAt(0)
        block[10] = 'd'.charCodeAt(0)
        block[11] = 'b'.charCodeAt(0)

        // e) random 4 bytes
        const randomBytes = getRandomBytes(4)
        block.set(randomBytes, 12)

        return await aes256ecbEncrypt(fileKey, block)
    }

    getKeyBits(): number {
        return 256
    }

    protected async getCipher(): Promise<Cipher> {
        this.masterKey ||= await this.computeMasterKey()

        return aes256(this.masterKey)
    }

    getVersion(): number {
        return 5
    }

    getRevision(): number {
        return 6
    }

    async write(): Promise<void> {
        await super.write()
        const dict = this.dict

        assert(this.userEncryptedFileKey, 'User Encrypted File Key not set')
        assert(this.ownerEncryptedFileKey, 'Owner Encrypted File Key not set')
        assert(this.perms, 'Permissions entry not set')

        dict.set('UE', new PdfString(this.userEncryptedFileKey))
        dict.set('OE', new PdfString(this.ownerEncryptedFileKey))
        dict.set('Perms', new PdfString(this.perms))
    }

    readEncryptionDictionary(
        encryptionDictionary: PdfEncryptionDictionary,
    ): void {
        super.readEncryptionDictionary(encryptionDictionary)

        const { values } = encryptionDictionary

        assert(
            values['UE'] instanceof PdfHexadecimal ||
                values['UE'] instanceof PdfString,
            'Invalid or missing /UE entry',
        )
        assert(
            values['OE'] instanceof PdfHexadecimal ||
                values['OE'] instanceof PdfString,
            'Invalid or missing /OE entry',
        )
        assert(
            values['Perms'] instanceof PdfString ||
                values['Perms'] instanceof PdfHexadecimal,
            'Invalid or missing /Perms entry',
        )

        this.userEncryptedFileKey =
            values['UE'] instanceof PdfHexadecimal
                ? values['UE'].bytes
                : values['UE'].raw
        this.ownerEncryptedFileKey =
            values['OE'] instanceof PdfHexadecimal
                ? values['OE'].bytes
                : values['OE'].raw
        this.perms =
            values['Perms'] instanceof PdfHexadecimal
                ? values['Perms'].bytes
                : values['Perms'].raw
    }

    async computeObjectKey(): Promise<ByteArray> {
        return await this.computeMasterKey()
    }

    async recoverUserPassword(
        ownerPassword?: ByteArray | string,
    ): Promise<string> {
        throw new Error(
            'Recovering user password from owner password is not supported for AES-256',
        )
    }
}
