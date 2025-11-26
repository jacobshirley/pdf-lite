import { EnvelopedDataBuilderRecipient } from 'pki-lite/core/builders/EnvelopedDataBuilder'
import { Certificate } from 'pki-lite/x509/Certificate'
import { EnvelopedData } from 'pki-lite/pkcs7/EnvelopedData'
import { PrivateKeyInfo } from 'pki-lite/keys/PrivateKeyInfo'
import { ByteArray, PdfPermissions } from '../../types'
import { getRandomBytes, sha1, sha256 } from '../../utils/algos'
import {
    PdfEncryptionDictionary,
    PdfEncryptionRecipient,
    PdfId,
} from '../types'
import { V5SecurityHandler } from './v5'
import { PdfSecurityHandler, PdfStandardSecurityHandler } from './base'
import { createStandardSecurityHandlerFromDictionary } from './utils'
import { PdfName } from '../../core/objects/pdf-name'
import { PdfArray } from '../../core/objects/pdf-array'
import { PdfHexadecimal } from '../../core/objects/pdf-hexadecimal'

/**
 * Public key security handler implementing certificate-based encryption.
 * Uses PKCS#7 enveloped data to encrypt the file key for each recipient.
 *
 * @example
 * ```typescript
 * const handler = new PublicKeySecurityHandler({
 *     recipients: [{
 *         certificate: recipientCertBytes,
 *         privateKey: privateKeyBytes
 *     }]
 * })
 * ```
 */
export class PublicKeySecurityHandler extends PdfSecurityHandler {
    /** Underlying standard security handler for key derivation. */
    private standardSecurityHandler: PdfStandardSecurityHandler
    /** List of recipients with their certificates and optional private keys. */
    private recipients: PdfEncryptionRecipient[]
    /** Random seed for key generation. */
    private seed: ByteArray
    /** Promise resolving to PKCS#7 CMS data for each recipient. */
    private recipientsCms: Promise<ByteArray[]>

    /**
     * Creates a new public key security handler.
     *
     * @param options - Configuration including recipients and encryption settings.
     */
    constructor(options: {
        recipients: PdfEncryptionRecipient[]
        standardSecurityHandler?: PdfStandardSecurityHandler
        seed?: ByteArray
        permissions?: PdfPermissions | number
        encryptMetadata?: boolean
    }) {
        super(options)

        this.standardSecurityHandler =
            options.standardSecurityHandler ?? new V5SecurityHandler({})
        this.recipients = options.recipients
        this.seed = options.seed ?? getRandomBytes(20)

        const pkcs7Input = new Uint8Array(24)
        pkcs7Input.set(this.seed)
        pkcs7Input[20] = (this.permissions >> 24) & 0xff
        pkcs7Input[21] = (this.permissions >> 16) & 0xff
        pkcs7Input[22] = (this.permissions >> 8) & 0xff
        pkcs7Input[23] = this.permissions & 0xff

        this.recipientsCms = this.getRecipientsPkcs7(pkcs7Input)
    }

    /**
     * Gets the security handler filter name.
     *
     * @returns 'Adobe.PubSec' for public key encryption.
     */
    getName(): string {
        return 'Adobe.PubSec'
    }

    /**
     * Checks if metadata encryption is enabled.
     *
     * @returns True if metadata should be encrypted.
     */
    canEncryptMetadata(): boolean {
        return this.standardSecurityHandler.canEncryptMetadata()
    }

    /**
     * Sets the document ID.
     *
     * @param id - The document ID array.
     */
    setDocumentId(id: PdfId): void {
        this.standardSecurityHandler.setDocumentId(id)
    }

    /**
     * Gets the document ID.
     *
     * @returns The document ID, or undefined if not set.
     */
    getDocumentId(): PdfId | undefined {
        return this.standardSecurityHandler.getDocumentId()
    }

    /**
     * Checks if the handler is ready.
     *
     * @returns True if the underlying handler is ready.
     */
    isReady(): boolean {
        return this.standardSecurityHandler.isReady()
    }

    /**
     * Gets the encryption version number.
     *
     * @returns The version from the underlying handler.
     */
    getVersion(): number {
        return this.standardSecurityHandler.getVersion()
    }

    /**
     * Gets the encryption revision number.
     *
     * @returns The revision from the underlying handler.
     */
    getRevision(): number {
        return this.standardSecurityHandler.getRevision()
    }

    /**
     * Initializes encryption keys from the seed and recipient data.
     *
     * @param seed - Optional seed to use instead of the default.
     * @returns The derived encryption key.
     * @throws Error if no recipients are configured.
     */
    private async initKeys(seed: ByteArray = this.seed): Promise<ByteArray> {
        const recipientDers = await this.recipientsCms
        if (recipientDers.length === 0) {
            throw new Error('At least one recipient is required')
        }
        const digestLen =
            seed.length +
            recipientDers.reduce((acc, der) => acc + der.length, 0) +
            (!this.encryptMetadata ? 4 : 0)

        const digestBytes = new Uint8Array(digestLen)
        let offset = 0
        digestBytes.set(seed, offset)
        offset += seed.length

        for (let i = 0; i < recipientDers.length; i++) {
            digestBytes.set(recipientDers[i], offset)
            offset += recipientDers[i].length
        }

        if (!this.encryptMetadata) {
            digestBytes.set(new Uint8Array([0xff, 0xff, 0xff, 0xff]), offset)
        }

        let digest: ByteArray
        if (this.standardSecurityHandler instanceof V5SecurityHandler) {
            digest = await sha256(digestBytes)
        } else {
            digest = await sha1(digestBytes)
        }

        const key = digest.slice(
            0,
            this.standardSecurityHandler.getKeyBits() / 8,
        )

        this.standardSecurityHandler.setMasterKey(key)
        return key
    }

    /**
     * Writes the encryption dictionary with public key-specific entries.
     */
    async write(): Promise<void> {
        await this.standardSecurityHandler.write()

        this.dict.copyFrom(this.standardSecurityHandler.dict)

        const recipientsData = await this.recipientsCms

        this.dict.set('Filter', new PdfName('Adobe.PubSec'))
        this.dict.set('SubFilter', new PdfName('adbe.pkcs7.s4'))
        this.dict.set(
            'Recipients',
            new PdfArray(
                recipientsData.map((data) => new PdfHexadecimal(data)),
            ),
        )
    }

    /**
     * Creates PKCS#7 enveloped data for each recipient.
     *
     * @param data - The data to encrypt for recipients.
     * @returns Array of PKCS#7 CMS bytes for each recipient.
     * @throws Error if any recipient lacks a certificate.
     */
    private async getRecipientsPkcs7(data: ByteArray): Promise<ByteArray[]> {
        return await Promise.all(
            this.recipients.map((recipient) => {
                if (!recipient.certificate) {
                    throw new Error('Recipient certificate is required')
                }

                return this.pkcs7EnvelopedData({
                    data: data,
                    recipientCertificates: [recipient.certificate],
                })
            }),
        )
    }

    /**
     * Reads encryption parameters from the encryption dictionary.
     *
     * @param dictionary - The encryption dictionary from the PDF.
     * @throws Error if required entries are missing.
     */
    readEncryptionDictionary(dictionary: PdfEncryptionDictionary): void {
        this.standardSecurityHandler =
            createStandardSecurityHandlerFromDictionary(dictionary)

        this.standardSecurityHandler.readEncryptionDictionary(dictionary)

        const recipients = dictionary.get('Recipients')
        if (!recipients) {
            throw new Error('Missing /Recipients in encryption dictionary')
        }

        this.recipientsCms = Promise.resolve(
            recipients.items.map((value) => {
                if (!(value instanceof PdfHexadecimal)) {
                    throw new Error('Invalid recipient type')
                }
                return value.raw as ByteArray
            }),
        )
    }

    /**
     * Gets the underlying standard security handler.
     *
     * @returns The standard security handler used for encryption.
     */
    getStandardSecurityHandler(): PdfStandardSecurityHandler {
        return this.standardSecurityHandler
    }

    /**
     * Decrypts recipient CMS data to recover the seed and permissions.
     *
     * @returns The seed and permissions, or throws if no matching recipient is found.
     * @throws Error if no recipient with private key can decrypt the CMS data.
     */
    private async getSeed(): Promise<ByteArray> {
        for (const privateKey of this.recipients
            .filter((x) => x.privateKey)
            .map((x) => x.privateKey!)) {
            for (const cms of await this.recipientsCms) {
                const output = await this.extractSeedAndPermissions(
                    cms,
                    privateKey,
                )
                if (!output) continue

                const { seed, permissions: permissionsBytes } = output

                let permissions = 0
                for (const byte of permissionsBytes) {
                    permissions = (permissions << 8) | byte
                }

                await this.initKeys(seed)

                this.permissions = permissions

                return seed
            }
        }

        throw new Error('No matching recipient found for decryption')
    }

    /**
     * Decrypts data using the underlying security handler.
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
        await this.getSeed()

        return this.standardSecurityHandler.decrypt(
            type,
            data,
            objectNumber,
            generationNumber,
        )
    }

    /**
     * Encrypts data using the underlying security handler.
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
        await this.initKeys()

        return this.standardSecurityHandler.encrypt(
            type,
            data,
            objectNumber,
            generationNumber,
        )
    }

    /**
     * Computes the object encryption key.
     *
     * @param objectNumber - The PDF object number.
     * @param generationNumber - The PDF generation number.
     * @returns The computed object key.
     */
    async computeObjectKey(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        await this.getSeed()
        return this.standardSecurityHandler.computeObjectKey(
            objectNumber,
            generationNumber,
        )
    }

    /**
     * Creates PKCS#7 enveloped data for recipients.
     *
     * @param options - Data and recipient certificates.
     * @returns The PKCS#7 CMS bytes.
     */
    private async pkcs7EnvelopedData(options: {
        data: ByteArray
        recipientCertificates: ByteArray[]
    }): Promise<ByteArray> {
        const { data, recipientCertificates } = options

        const envelopedData = await EnvelopedData.builder()
            .setData(data)
            .addRecipient(
                ...recipientCertificates.map(
                    (certBytes) =>
                        ({
                            certificate: Certificate.fromDer(certBytes),
                        }) satisfies EnvelopedDataBuilderRecipient,
                ),
            )
            .build()

        return envelopedData.toCms().toDer()
    }

    /**
     * Extracts the seed and permissions from CMS enveloped data.
     *
     * @param contentInfoBytes - The CMS content info bytes.
     * @param privateKey - The private key for decryption.
     * @returns The extracted seed and permissions.
     */
    private async extractSeedAndPermissions(
        contentInfoBytes: ByteArray,
        privateKey: ByteArray,
    ): Promise<{
        seed: ByteArray
        permissions: ByteArray
    } | null> {
        const privateKeyInfo = PrivateKeyInfo.fromDer(privateKey)
        const envelopedData = EnvelopedData.fromCms(contentInfoBytes)
        const content = await envelopedData.decrypt(privateKeyInfo)

        return {
            seed: content.slice(0, 20),
            permissions: content.slice(20, 24),
        }
    }
}
