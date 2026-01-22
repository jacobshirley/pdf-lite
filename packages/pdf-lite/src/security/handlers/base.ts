import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfBoolean } from '../../core/objects/pdf-boolean.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfObject } from '../../core/objects/pdf-object.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { Cipher } from '../../crypto/types.js'
import { ByteArray, PdfPermissions, PERMISSION_FLAGS } from '../../types.js'
import { assert, assertIfDefined } from '../../utils/assert.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import {
    PdfEncryptionAlgorithmType,
    PdfEncryptionDictionary,
    PdfId,
} from '../types.js'

/**
 * Base options for creating a security handler.
 */
export type PdfSecurityHandlerOptions = {
    /** Document permissions configuration. */
    permissions?: number | PdfPermissions
    /** Whether to encrypt document metadata. */
    encryptMetadata?: boolean
}

/**
 * Abstract base class for PDF security handlers.
 * Security handlers manage encryption, decryption, and access permissions for PDF documents.
 *
 * @example
 * ```typescript
 * const handler = new PdfV5SecurityHandler({ password: 'secret' })
 * await handler.write()
 * const encryptedData = await handler.encrypt('stream', data, objectNumber, generationNumber)
 * ```
 */
export abstract class PdfSecurityHandler {
    /** The encryption dictionary containing all encryption parameters. */
    public dict: PdfEncryptionDictionary
    /** Numeric permission flags. */
    public permissions: number
    /** Whether to encrypt document metadata. */
    public encryptMetadata: boolean

    /**
     * Creates a new security handler.
     *
     * @param options - Configuration options for the security handler.
     */
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

    /**
     * Decodes the numeric permission flags into a PdfPermissions object.
     *
     * @returns An object with boolean flags for each permission.
     */
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

    /**
     * Checks if the security handler is ready for encryption/decryption.
     *
     * @returns True if ready, false otherwise.
     */
    abstract isReady(): boolean

    /**
     * Gets the security handler filter name.
     *
     * @returns The filter name (e.g., 'Standard').
     */
    abstract getName(): string

    /**
     * Gets the encryption version number.
     *
     * @returns The version number (1-5).
     */
    abstract getVersion(): number

    /**
     * Gets the encryption revision number.
     *
     * @returns The revision number.
     */
    abstract getRevision(): number

    /**
     * Reads and applies encryption parameters from a dictionary.
     *
     * @param dictionary - The encryption dictionary from the PDF trailer.
     */
    abstract readEncryptionDictionary(dictionary: PdfEncryptionDictionary): void

    /**
     * Decrypts data of a specific type.
     *
     * @param type - The type of content being decrypted.
     * @param data - The encrypted data.
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns The decrypted data.
     */
    abstract decrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray>

    /**
     * Encrypts data of a specific type.
     *
     * @param type - The type of content being encrypted.
     * @param data - The data to encrypt.
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns The encrypted data.
     */
    abstract encrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray>

    /**
     * Computes the object-specific encryption key.
     *
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @param algorithm - Optional algorithm type for key derivation.
     * @returns The computed object key.
     */
    abstract computeObjectKey(
        objectNumber?: number,
        generationNumber?: number,
        algorithm?: PdfEncryptionAlgorithmType,
    ): Promise<ByteArray>

    /**
     * Gets the document ID array.
     *
     * @returns The document ID, or undefined if not set.
     */
    abstract getDocumentId(): PdfId | undefined

    /**
     * Sets the document ID array.
     *
     * @param id - The document ID to set.
     */
    abstract setDocumentId(id: PdfId): void

    /**
     * Writes the encryption dictionary with computed keys.
     */
    abstract write(): Promise<void>

    /**
     * Builds the numeric permission flags from a PdfPermissions object.
     *
     * @param perm - The permissions to encode.
     * @returns The numeric permission flags.
     */
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

    /**
     * Recursively decrypts all strings and streams within an indirect object.
     *
     * @param object - The indirect object to decrypt.
     */
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

    /**
     * Recursively encrypts all strings and streams within an indirect object.
     *
     * @param object - The indirect object to encrypt.
     */
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

/**
 * Options for creating a standard security handler with password-based encryption.
 */
export type PdfStandardSecurityHandlerOptions = PdfSecurityHandlerOptions & {
    /** User password for opening the document. */
    password?: string | ByteArray
    /** Owner password for full document access. */
    ownerPassword?: string | ByteArray
    /** Document identifier for key derivation. */
    documentId?: PdfId | string | ByteArray
    /** Pre-computed user key. */
    userKey?: ByteArray
    /** Pre-computed owner key. */
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

/**
 * Abstract base class for standard PDF security handlers.
 * Implements password-based encryption as defined in the PDF specification.
 *
 * @example
 * ```typescript
 * const handler = new PdfV5SecurityHandler({
 *     password: 'user123',
 *     ownerPassword: 'admin456',
 *     permissions: { print: true, copy: false }
 * })
 * ```
 */
export abstract class PdfStandardSecurityHandler extends PdfSecurityHandler {
    /** Document identifier for key derivation. */
    protected documentId?: PdfId
    /** Computed owner key (O value). */
    protected ownerKey?: ByteArray
    /** Computed user key (U value). */
    protected userKey?: ByteArray
    /** User password for authentication. */
    protected password: ByteArray
    /** Owner password for full access. */
    protected ownerPassword?: ByteArray
    /** Derived master encryption key. */
    protected masterKey?: ByteArray

    /**
     * Creates a new standard security handler.
     *
     * @param options - Configuration options including passwords and document ID.
     */
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

    /**
     * Gets the encryption key length in bits.
     *
     * @returns The key length in bits.
     */
    abstract getKeyBits(): number

    /**
     * Gets the security handler filter name.
     *
     * @returns 'Standard' for password-based encryption.
     */
    getName(): string {
        return 'Standard'
    }

    /**
     * Checks if the handler is ready (has document ID).
     *
     * @returns True if document ID is set.
     */
    isReady(): boolean {
        return !!this.documentId
    }

    /**
     * Sets the document ID for key derivation.
     *
     * @param id - The document ID array.
     */
    setDocumentId(id: PdfId): void {
        this.documentId = id
    }

    /**
     * Gets the document ID.
     *
     * @returns The document ID, or undefined if not set.
     */
    getDocumentId(): PdfId | undefined {
        return this.documentId
    }

    /**
     * Sets the user password.
     *
     * @param password - The user password string or bytes.
     */
    setPassword(password: string | ByteArray): void {
        this.password =
            typeof password === 'string' ? stringToBytes(password) : password
    }

    /**
     * Sets the owner password.
     *
     * @param ownerPassword - The owner password string or bytes.
     */
    setOwnerPassword(ownerPassword: string | ByteArray): void {
        this.ownerPassword =
            typeof ownerPassword === 'string'
                ? stringToBytes(ownerPassword)
                : ownerPassword
    }

    /**
     * Checks if metadata encryption is enabled.
     *
     * @returns True if metadata should be encrypted.
     */
    canEncryptMetadata(): boolean {
        return this.encryptMetadata
    }

    /**
     * Reads encryption parameters from the encryption dictionary.
     *
     * @param encryptionDictionary - The encryption dictionary from the PDF.
     */
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

    /**
     * Computes the user key (U value) for the encryption dictionary.
     *
     * @returns The computed user key.
     */
    protected abstract computeUserKey(): Promise<ByteArray>

    /**
     * Computes the owner key (O value) for the encryption dictionary.
     *
     * @returns The computed owner key.
     */
    protected abstract computeOwnerKey(): Promise<ByteArray>

    /**
     * Initializes the user and owner keys if not already set.
     */
    protected async initKeys(): Promise<void> {
        this.ownerKey ||= await this.computeOwnerKey()
        this.userKey ||= await this.computeUserKey()
    }

    /**
     * Writes the encryption dictionary with all computed keys and parameters.
     *
     * @throws Error if required keys are not computed.
     */
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

    /**
     * Gets a cipher for the specified object.
     *
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns A cipher instance, or null if no encryption needed.
     */
    protected abstract getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher | null>

    /**
     * Encrypts data using the appropriate cipher.
     *
     * @param type - The type of content being encrypted.
     * @param data - The data to encrypt.
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns The encrypted data.
     */
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

    /**
     * Decrypts data using the appropriate cipher.
     *
     * @param type - The type of content being decrypted.
     * @param data - The encrypted data.
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns The decrypted data.
     */
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

    /**
     * Sets the master encryption key directly.
     *
     * @param masterKey - The master key to use.
     */
    setMasterKey(masterKey: ByteArray): void {
        this.masterKey = masterKey
    }

    /**
     * Recovers the user password from the owner password.
     *
     * @param ownerPassword - The owner password.
     * @returns The recovered user password.
     * @throws Error if recovery is not supported.
     */
    abstract recoverUserPassword(
        ownerPassword?: ByteArray | string,
    ): Promise<string>
}
