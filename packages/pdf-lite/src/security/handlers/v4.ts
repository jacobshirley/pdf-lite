import { PdfDictionary } from '../../core/objects/pdf-dictionary'
import { PdfName } from '../../core/objects/pdf-name'
import { PdfNumber } from '../../core/objects/pdf-number'
import { aes128 } from '../../crypto/ciphers/aes128'
import { deriveObjectKey } from '../../crypto/key-derivation/key-derivation'
import { ByteArray, Cipher } from '../../types'
import { assert, assertIfDefined } from '../../utils/assert'
import { AesV2CryptFilter } from '../crypt-filters/aesv2'
import { AesV3CryptFilter } from '../crypt-filters/aesv3'
import { PdfCryptFilter } from '../crypt-filters/base'
import { IdentityCryptFilter } from '../crypt-filters/identity'
import { V2CryptFilter } from '../crypt-filters/v2'
import {
    CryptFilterType,
    PdfCryptFilterDictionary,
    PdfEncryptionAlgorithmType,
    PdfEncryptionDictionary,
} from '../types'
import { PdfStandardSecurityHandlerOptions } from './base'
import { V2SecurityHandler } from './v2'

const IDENTITY_CRYPT_FILTER = new IdentityCryptFilter({ authEvent: 'DocOpen' })

export class V4SecurityHandler extends V2SecurityHandler {
    protected cryptFilters: Map<string, PdfCryptFilter> = new Map([
        ['Identity', IDENTITY_CRYPT_FILTER],
    ])

    protected cryptFiltersByType: {
        [key in CryptFilterType]?: string
    } = {}

    constructor(options: PdfStandardSecurityHandlerOptions) {
        super(options)

        this.setCryptFilter(
            'StdCF',
            new AesV2CryptFilter({
                authEvent: 'DocOpen',
            }),
        )

        this.setCryptFilterForType('stream', 'StdCF')
        this.setCryptFilterForType('string', 'StdCF')
    }

    getCryptFilter(name: string): PdfCryptFilter | undefined {
        return this.cryptFilters.get(name)
    }

    getCryptFilterByType(type: CryptFilterType): PdfCryptFilter | null {
        const name = this.cryptFiltersByType[type]
        if (name) {
            return this.cryptFilters.get(name) || null
        }
        return null
    }

    setCryptFilterForType(type: CryptFilterType, name: string): void {
        this.cryptFiltersByType[type] = name
    }

    setCryptFilter(name: string, filter: PdfCryptFilter): void {
        filter.setSecurityHandler(this)
        this.cryptFilters.set(name, filter)
    }

    getRevision(): number {
        return 4
    }

    getVersion(): number {
        return 4
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

        return aes128(key)
    }

    readEncryptionDictionary(
        encryptionDictionary: PdfEncryptionDictionary,
    ): void {
        super.readEncryptionDictionary(encryptionDictionary)

        if (encryptionDictionary.get('CF')) {
            const cfDict = encryptionDictionary.get('CF')
            assert(cfDict instanceof PdfDictionary, 'CF must be a dictionary')

            const cfEntries = cfDict.values

            for (const [key, cf] of Object.entries(cfEntries)) {
                assert(
                    cf instanceof PdfDictionary,
                    'Crypt filter must be a dictionary',
                )

                const cfm = cf.get('CFM')
                const authEvent = cf.get('AuthEvent')
                const length = cf.get('Length')

                assertIfDefined(
                    cfm,
                    cfm instanceof PdfName,
                    'CFM must be a name',
                )
                assertIfDefined(
                    authEvent,
                    authEvent instanceof PdfName,
                    'AuthEvent must be a name',
                )
                assertIfDefined(
                    length,
                    length instanceof PdfNumber,
                    'Length must be a number',
                )

                assert(cfm, 'CFM is required in crypt filter dictionary')
                assert(
                    authEvent,
                    'AuthEvent is required in crypt filter dictionary',
                )

                if (cfm.value === 'None') {
                    this.setCryptFilter(
                        key,
                        new IdentityCryptFilter({
                            authEvent: authEvent.value,
                        }),
                    )
                } else if (cfm.value === 'V2') {
                    this.setCryptFilter(
                        key,
                        new V2CryptFilter({
                            authEvent: authEvent.value,
                            length: length.value,
                        }),
                    )
                } else if (cfm.value === 'AESV2') {
                    this.setCryptFilter(
                        key,
                        new AesV2CryptFilter({
                            authEvent: authEvent.value,
                        }),
                    )
                } else if (cfm.value === 'AESV3') {
                    this.setCryptFilter(
                        key,
                        new AesV3CryptFilter({
                            authEvent: authEvent.value,
                        }),
                    )
                } else {
                    throw new Error(`Unsupported CFM value: ${cfm.value}`)
                }
            }
        }

        if (encryptionDictionary.values['StmF']) {
            const stmF = encryptionDictionary.values['StmF']
            assert(stmF instanceof PdfName, 'StmF must be a name')
            assert(
                this.cryptFilters.has(stmF.value),
                `StmF references unknown crypt filter: ${stmF.value}`,
            )
            this.setCryptFilterForType('stream', stmF.value)
        }

        if (encryptionDictionary.values['StrF']) {
            const strF = encryptionDictionary.values['StrF']
            assert(strF instanceof PdfName, 'StrF must be a name')
            assert(
                this.cryptFilters.has(strF.value),
                `StrF references unknown crypt filter: ${strF.value}`,
            )
            this.setCryptFilterForType('string', strF.value)
        }

        if (encryptionDictionary.values['EFF']) {
            const eff = encryptionDictionary.values['EFF']
            assert(eff instanceof PdfName, 'EFF must be a name')
            assert(
                this.cryptFilters.has(eff.value),
                `EFF references unknown crypt filter: ${eff.value}`,
            )
            this.setCryptFilterForType('file', eff.value)
        }
    }

    async write(): Promise<void> {
        await super.write()

        const dict = this.dict

        const cfs: Record<string, PdfCryptFilterDictionary> = {}
        this.cryptFilters.forEach((cf, name) => {
            if (cf instanceof IdentityCryptFilter) {
                // The Identity crypt filter is implicit and should not be included
                return
            }

            cfs[name] = cf.toDictionary()
        })

        if (Object.keys(cfs).length > 0) {
            dict.set('CF', new PdfDictionary(cfs))
        }

        if (this.cryptFiltersByType.stream) {
            dict.set('StmF', new PdfName(this.cryptFiltersByType.stream))
        }

        if (this.cryptFiltersByType.string) {
            dict.set('StrF', new PdfName(this.cryptFiltersByType.string))
        }

        if (this.cryptFiltersByType.file) {
            dict.set('EFF', new PdfName(this.cryptFiltersByType.file))
        }
    }

    encrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        const cryptFilter = this.getCryptFilterByType(type)
        if (cryptFilter) {
            return cryptFilter.encrypt(data, objectNumber, generationNumber)
        }

        return super.encrypt(type, data, objectNumber, generationNumber)
    }

    decrypt(
        type: 'string' | 'stream' | 'file',
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        const cryptFilter = this.getCryptFilterByType(type)
        if (cryptFilter) {
            return cryptFilter.decrypt(data, objectNumber, generationNumber)
        }

        return super.decrypt(type, data, objectNumber, generationNumber)
    }
}
