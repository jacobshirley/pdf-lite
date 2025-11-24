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

export class PublicKeySecurityHandler extends PdfSecurityHandler {
    private standardSecurityHandler: PdfStandardSecurityHandler
    private recipients: PdfEncryptionRecipient[]
    private seed: ByteArray
    private recipientsCms: Promise<ByteArray[]>

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

    getName(): string {
        return 'Adobe.PubSec'
    }

    canEncryptMetadata(): boolean {
        return this.standardSecurityHandler.canEncryptMetadata()
    }

    setDocumentId(id: PdfId): void {
        this.standardSecurityHandler.setDocumentId(id)
    }

    getDocumentId(): PdfId | undefined {
        return this.standardSecurityHandler.getDocumentId()
    }

    isReady(): boolean {
        return this.standardSecurityHandler.isReady()
    }

    getVersion(): number {
        return this.standardSecurityHandler.getVersion()
    }

    getRevision(): number {
        return this.standardSecurityHandler.getRevision()
    }

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

    getStandardSecurityHandler(): PdfStandardSecurityHandler {
        return this.standardSecurityHandler
    }

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
