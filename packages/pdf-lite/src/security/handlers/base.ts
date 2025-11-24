import { PdfArray } from '../../core/objects/pdf-array'
import { PdfBoolean } from '../../core/objects/pdf-boolean'
import { PdfDictionary } from '../../core/objects/pdf-dictionary'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object'
import { PdfName } from '../../core/objects/pdf-name'
import { PdfNumber } from '../../core/objects/pdf-number'
import { PdfObject } from '../../core/objects/pdf-object'
import { PdfStream } from '../../core/objects/pdf-stream'
import { PdfString } from '../../core/objects/pdf-string'
import {
    ByteArray,
    Cipher,
    PdfPermissions,
    PERMISSION_FLAGS,
} from '../../types'
import { assert, assertIfDefined } from '../../utils/assert'
import { stringToBytes } from '../../utils/stringToBytes'
import {
    PdfEncryptionAlgorithmType,
    PdfEncryptionDictionary,
    PdfId,
} from '../types'

export type PdfSecurityHandlerOptions = {
    permissions?: number | PdfPermissions
    encryptMetadata?: boolean
}

export abstract class PdfSecurityHandler {
    public dict: PdfEncryptionDictionary
    public permissions: number
    public encryptMetadata: boolean

    constructor(options?: PdfSecurityHandlerOptions) {
        this.dict = new PdfDictionary()
        this.encryptMetadata = options?.encryptMetadata ?? true
        this.permissions =
            typeof options?.permissions === 'number'
                ? options.permissions
                : this.buildPermissions(
                      options?.permissions ?? DEFAULT_PERMISSIONS,
                  )
    }

    decodePermissions(): PdfPermissions {
        const perm: PdfPermissions = {}
        for (const [key, bit] of Object.entries(PERMISSION_FLAGS) as [
            keyof PdfPermissions,
            number,
        ][]) {
            perm[key] = (this.permissions & bit) !== 0
        }
        return perm
    }

    abstract isReady(): boolean
    abstract getName(): string
    abstract getVersion(): number
    abstract getRevision(): number
    abstract readEncryptionDictionary(dictionary: PdfEncryptionDictionary): void

    abstract decrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray>

    abstract encrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray>

    abstract computeObjectKey(
        objectNumber?: number,
        generationNumber?: number,
        algorithm?: PdfEncryptionAlgorithmType,
    ): Promise<ByteArray>

    abstract getDocumentId(): PdfId | undefined
    abstract setDocumentId(id: PdfId): void
    abstract write(): Promise<void>

    protected buildPermissions(perm: PdfPermissions): number {
        let flags = 0xfffffffc // All bits set to 1 except bits 0–1, which must be 0
        for (const [key, bit] of Object.entries(PERMISSION_FLAGS) as [
            keyof PdfPermissions,
            number,
        ][]) {
            if (perm[key] === false) {
                // Remove this permission
                flags &= ~bit
            }
        }
        return flags | 0xfffff000 // ensure unused high bits are set
    }

    async decryptObject(object: PdfIndirectObject): Promise<void> {
        const objectNumber = object.objectNumber
        const generationNumber = object.generationNumber

        const decryptObject = async (obj: PdfObject): Promise<void> => {
            if (obj instanceof PdfIndirectObject) {
                return decryptObject(obj.content)
            } else if (obj instanceof PdfString) {
                const decryptedData = await this.decrypt(
                    'string',
                    obj.raw,
                    objectNumber,
                    generationNumber,
                )
                obj.raw = decryptedData
            } else if (obj instanceof PdfStream) {
                const decryptedData = await this.decrypt(
                    'stream',
                    obj.raw,
                    objectNumber,
                    generationNumber,
                )

                obj.raw = decryptedData
                await decryptObject(obj.header)
            } else if (obj instanceof PdfDictionary) {
                for (const [key, value] of Object.entries(obj)) {
                    await decryptObject(value)
                }
            } else if (obj instanceof PdfArray) {
                for (const item of obj.items) {
                    await decryptObject(item)
                }
            }
        }

        await decryptObject(object.content)
    }

    async encryptObject(object: PdfIndirectObject): Promise<void> {
        const objectNumber = object.objectNumber
        const generationNumber = object.generationNumber

        const encryptObject = async (obj: PdfObject): Promise<void> => {
            if (obj instanceof PdfIndirectObject) {
                return encryptObject(obj.content)
            } else if (obj instanceof PdfString) {
                const encryptedData = await this.encrypt(
                    'string',
                    obj.raw,
                    objectNumber,
                    generationNumber,
                )
                obj.raw = encryptedData
            } else if (obj instanceof PdfStream) {
                const encryptedData = await this.encrypt(
                    'stream',
                    obj.raw,
                    objectNumber,
                    generationNumber,
                )
                obj.raw = encryptedData
                await encryptObject(obj.header)
            } else if (obj instanceof PdfDictionary) {
                const values = obj.values
                for (const key in values) {
                    await encryptObject(values[key])
                }
            } else if (obj instanceof PdfArray) {
                for (const item of obj.items) {
                    await encryptObject(item)
                }
            }
        }

        return await encryptObject(object.content)
    }
}

export type PdfStandardSecurityHandlerOptions = PdfSecurityHandlerOptions & {
    password?: string | ByteArray
    ownerPassword?: string | ByteArray
    documentId?: PdfId | string | ByteArray
    userKey?: ByteArray
    ownerKey?: ByteArray
}

const DEFAULT_PERMISSIONS: PdfPermissions = {
    print: true,
    modify: true,
    copy: true,
    annotate: true,
    fill: true,
    extract: true,
    assemble: true,
    printHighQuality: true,
}

export abstract class PdfStandardSecurityHandler extends PdfSecurityHandler {
    protected documentId?: PdfId
    protected ownerKey?: ByteArray
    protected userKey?: ByteArray
    protected password: ByteArray
    protected ownerPassword?: ByteArray
    protected masterKey?: ByteArray

    constructor(options: PdfStandardSecurityHandlerOptions) {
        super(options)

        this.dict.set('Filter', new PdfName('Standard'))
        this.password =
            typeof options.password === 'string'
                ? stringToBytes(options.password)
                : (options.password ?? new Uint8Array())

        this.ownerPassword =
            typeof options.ownerPassword === 'string'
                ? stringToBytes(options.ownerPassword)
                : options.ownerPassword

        this.documentId =
            typeof options.documentId === 'string' ||
            options.documentId instanceof Uint8Array
                ? new PdfArray([
                      PdfHexadecimal.toHexadecimal(options.documentId),
                      PdfHexadecimal.toHexadecimal(options.documentId),
                  ])
                : options.documentId
    }

    abstract getKeyBits(): number

    getName(): string {
        return 'Standard'
    }

    isReady(): boolean {
        return !!this.documentId
    }

    setDocumentId(id: PdfId): void {
        this.documentId = id
    }

    getDocumentId(): PdfId | undefined {
        return this.documentId
    }

    setPassword(password: string | ByteArray): void {
        this.password =
            typeof password === 'string' ? stringToBytes(password) : password
    }

    setOwnerPassword(ownerPassword: string | ByteArray): void {
        this.ownerPassword =
            typeof ownerPassword === 'string'
                ? stringToBytes(ownerPassword)
                : ownerPassword
    }

    canEncryptMetadata(): boolean {
        return this.encryptMetadata
    }

    readEncryptionDictionary(
        encryptionDictionary: PdfEncryptionDictionary,
    ): void {
        this.dict.copyFrom(encryptionDictionary)

        const o = encryptionDictionary.get('O')
        const u = encryptionDictionary.get('U')
        const p = encryptionDictionary.get('P')
        const ID = encryptionDictionary.get('ID')
        const encryptMetadata = encryptionDictionary.get('EncryptMetadata')

        assertIfDefined(
            u,
            u instanceof PdfHexadecimal || u instanceof PdfString,
            'U must be a hexadecimal or a string',
        )
        assertIfDefined(
            o,
            o instanceof PdfHexadecimal || o instanceof PdfString,
            'O must be a hexadecimal or a string',
        )

        assert(p instanceof PdfNumber, 'P must be a number')
        assertIfDefined(ID, ID instanceof PdfArray, 'ID must be an array')
        assertIfDefined(
            encryptMetadata,
            encryptMetadata instanceof PdfBoolean,
            'EncryptMetadata must be a boolean',
        )

        this.ownerKey = o instanceof PdfHexadecimal ? o.bytes : o.raw
        this.userKey = u instanceof PdfHexadecimal ? u.bytes : u.raw
        this.permissions = p.value

        this.encryptMetadata = encryptMetadata?.value ?? true

        if (ID) this.documentId = ID
    }

    protected abstract computeUserKey(): Promise<ByteArray>
    protected abstract computeOwnerKey(): Promise<ByteArray>

    protected async initKeys(): Promise<void> {
        this.ownerKey ||= await this.computeOwnerKey()
        this.userKey ||= await this.computeUserKey()
    }

    async write(): Promise<void> {
        // Initialise the keys
        await this.initKeys()

        if (!this.ownerKey) {
            throw new Error('Missing ownerKey')
        }

        if (!this.userKey) {
            throw new Error('Missing userKey')
        }

        this.dict.set('O', new PdfString(this.ownerKey))
        this.dict.set('U', new PdfString(this.userKey))
        this.dict.set('P', new PdfNumber(this.permissions))
        this.dict.set('V', new PdfNumber(this.getVersion()))
        this.dict.set('R', new PdfNumber(this.getRevision()))
        this.dict.set('Length', new PdfNumber(this.getKeyBits()))

        if (this.documentId) {
            this.dict.set('ID', this.documentId)
        }

        this.dict.set('EncryptMetadata', new PdfBoolean(this.encryptMetadata))
    }

    protected abstract getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher | null>

    async encrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        const cipher = await this.getCipher(objectNumber, generationNumber)

        if (!cipher) {
            return data
        }

        return await cipher.encrypt(data)
    }

    async decrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        const cipher = await this.getCipher(objectNumber, generationNumber)

        if (!cipher) {
            return data
        }

        return await cipher.decrypt(data)
    }

    setMasterKey(masterKey: ByteArray): void {
        this.masterKey = masterKey
    }

    abstract recoverUserPassword(
        ownerPassword?: ByteArray | string,
    ): Promise<string>
}
