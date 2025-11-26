import {
    CryptFilterType,
    PdfEncryptionAlgorithmType,
    PdfEncryptionDictionary,
    PdfEncryptionOptions,
    PdfEncryptionRecipient,
    PdfId,
} from '../types'
import { PdfSecurityHandler, PdfStandardSecurityHandler } from './base'
import { assert, assertIfDefined } from '../../utils/assert'
import { V1SecurityHandler } from './v1'
import { V2SecurityHandler } from './v2'
import { V4SecurityHandler } from './v4'
import { V5SecurityHandler } from './v5'
import { ByteArray } from '../../types'
import { PdfCryptFilter } from '../crypt-filters/base'
import { V2CryptFilter } from '../crypt-filters/v2'
import { AesV2CryptFilter } from '../crypt-filters/aesv2'
import { AesV3CryptFilter } from '../crypt-filters/aesv3'
import { IdentityCryptFilter } from '../crypt-filters/identity'
import { PdfName } from '../../core/objects/pdf-name'
import { PdfNumber } from '../../core/objects/pdf-number'
import { PublicKeySecurityHandler } from './pubSec'

/**
 * Creates a security handler from an encryption dictionary.
 * Automatically detects the handler type (Standard or Adobe.PubSec) and version.
 *
 * @param dict - The encryption dictionary from the PDF trailer.
 * @param options - Optional configuration including passwords and recipients.
 * @returns The appropriate security handler instance.
 * @throws Error if the filter type is unsupported.
 *
 * @example
 * ```typescript
 * const handler = createFromDictionary(encryptDict, { password: 'secret' })
 * ```
 */
export function createFromDictionary(
    dict: PdfEncryptionDictionary,
    options?: {
        password?: string | ByteArray
        ownerPassword?: string | ByteArray
        recipients?: PdfEncryptionRecipient[]
        documentId?: PdfId
    },
): PdfSecurityHandler {
    const {
        password,
        ownerPassword,
        recipients = [],
        documentId,
    } = options ?? {}
    const filter = dict.get('Filter')

    assert(filter instanceof PdfName, 'Filter must be a name')

    if (filter.value === 'Standard') {
        return createStandardSecurityHandlerFromDictionary(dict, {
            password,
            ownerPassword,
            documentId,
        })
    } else if (filter.value === 'Adobe.PubSec') {
        const pubSecHandler = new PublicKeySecurityHandler({
            standardSecurityHandler:
                createStandardSecurityHandlerFromDictionary(dict, {
                    password,
                    ownerPassword,
                }),
            recipients,
        })
        pubSecHandler.readEncryptionDictionary(dict)
        return pubSecHandler
    } else {
        throw new Error(`Unsupported security handler: ${filter.value}`)
    }
}

/**
 * Creates a standard security handler from an encryption dictionary.
 * Selects the appropriate version (V1-V5) based on the dictionary parameters.
 *
 * @param dict - The encryption dictionary from the PDF trailer.
 * @param options - Optional configuration including passwords and document ID.
 * @returns The appropriate standard security handler instance.
 * @throws Error if the version/revision combination is unsupported.
 *
 * @example
 * ```typescript
 * const handler = createStandardSecurityHandlerFromDictionary(encryptDict, {
 *     password: 'user',
 *     ownerPassword: 'owner'
 * })
 * ```
 */
export function createStandardSecurityHandlerFromDictionary(
    dict: PdfEncryptionDictionary,
    options?: {
        password?: string | ByteArray
        ownerPassword?: string | ByteArray
        documentId?: PdfId
    },
): PdfStandardSecurityHandler {
    const {
        password,
        ownerPassword,
        documentId = dict.get('ID'),
    } = options ?? {}
    const V = dict.get('V')
    const R = dict.get('R')
    const Length = dict.get('Length')

    assert(V instanceof PdfNumber, 'V must be a number if defined')
    assert(R instanceof PdfNumber, 'R must be a number if defined')
    assertIfDefined(
        Length,
        Length instanceof PdfNumber,
        'Length must be a number if defined',
    )

    const version = V.value
    const revision = R.value

    let standardSecurityHandler: PdfStandardSecurityHandler

    if (version === 1) {
        standardSecurityHandler = new V1SecurityHandler({
            password,
            ownerPassword,
            documentId,
        })
    } else if (version === 2) {
        standardSecurityHandler = new V2SecurityHandler({
            password,
            ownerPassword,
            documentId,
        })
    } else if (version === 4) {
        standardSecurityHandler = new V4SecurityHandler({
            password,
            ownerPassword,
            documentId,
        })
    } else if (version >= 5) {
        standardSecurityHandler = new V5SecurityHandler({
            password,
            ownerPassword,
            documentId,
        })
    } else {
        throw new Error(
            `Unsupported standard security handler: V=${version} R=${revision}`,
        )
    }

    standardSecurityHandler.readEncryptionDictionary(dict)

    return standardSecurityHandler
}

/**
 * Creates a crypt filter for the specified encryption algorithm.
 *
 * @param method - The encryption algorithm type.
 * @returns The appropriate crypt filter instance.
 * @throws Error if the method is unsupported.
 *
 * @example
 * ```typescript
 * const filter = getCryptFilter('AES-256-CBC')
 * ```
 */
export function getCryptFilter(
    method: PdfEncryptionAlgorithmType,
): PdfCryptFilter {
    if (method === 'none') {
        return new IdentityCryptFilter({
            authEvent: 'DocOpen',
        })
    } else if (method === 'RC4-40') {
        return new V2CryptFilter({
            authEvent: 'DocOpen',
            length: 40,
        })
    } else if (method === 'RC4-128') {
        return new V2CryptFilter({
            authEvent: 'DocOpen',
            length: 128,
        })
    } else if (method === 'AES-128-CBC') {
        return new AesV2CryptFilter({
            authEvent: 'DocOpen',
        })
    } else if (method === 'AES-256-CBC') {
        return new AesV3CryptFilter({
            authEvent: 'DocOpen',
        })
    } else {
        throw new Error(`Unsupported crypt filter type: ${method}`)
    }
}

/**
 * Creates a security handler from encryption options.
 * Automatically selects the appropriate handler version based on the encryption method.
 *
 * @param options - The encryption configuration options.
 * @returns A configured security handler.
 * @throws Error if no encryption is selected or the type is unsupported.
 *
 * @example
 * ```typescript
 * const handler = createFromEncryptionOptions({
 *     method: { default: 'AES-256-CBC' },
 *     password: 'secret',
 *     permissions: { print: true, copy: false }
 * })
 * ```
 */
export function createFromEncryptionOptions(
    options: PdfEncryptionOptions,
): PdfSecurityHandler {
    let defaultEncryption = options.method?.default ?? 'AES-256-CBC'
    let handler: PdfSecurityHandler

    if (defaultEncryption === 'RC4-40') {
        handler = new V1SecurityHandler({
            password: options.password,
            ownerPassword: options.ownerPassword,
        })
    } else if (defaultEncryption === 'RC4-128') {
        handler = new V2SecurityHandler({
            password: options.password,
            ownerPassword: options.ownerPassword,
        })
    } else if (defaultEncryption === 'AES-128-CBC') {
        handler = new V4SecurityHandler({
            password: options.password,
            ownerPassword: options.ownerPassword,
        })
    } else if (defaultEncryption === 'AES-256-CBC') {
        handler = new V5SecurityHandler({
            password: options.password,
            ownerPassword: options.ownerPassword,
        })
    } else if (defaultEncryption === 'none') {
        throw new Error('No encryption selected')
    } else {
        throw new Error(`Unsupported encryption type: ${defaultEncryption}`)
    }

    let uniqueCryptFilters = new Set<PdfEncryptionAlgorithmType>()
    const cryptFilterForType: Partial<
        Record<CryptFilterType, PdfEncryptionAlgorithmType>
    > = {}

    if (
        options.method &&
        'streams' in options.method &&
        options.method.streams
    ) {
        uniqueCryptFilters.add(options.method.streams)
        cryptFilterForType['stream'] = options.method.streams
    }

    if (options.method && 'files' in options.method && options.method.files) {
        uniqueCryptFilters.add(options.method.files)
        cryptFilterForType['file'] = options.method.files
    }

    if (
        options.method &&
        'strings' in options.method &&
        options.method.strings
    ) {
        uniqueCryptFilters.add(options.method.strings)
        cryptFilterForType['string'] = options.method.strings
    }

    if (handler instanceof V4SecurityHandler) {
        const uniqueCryptFiltersArray = Array.from(uniqueCryptFilters)
        for (let i = 0; i < uniqueCryptFiltersArray.length; i++) {
            const cryptFilter = getCryptFilter(uniqueCryptFiltersArray[i])
            const name: string =
                cryptFilter instanceof IdentityCryptFilter
                    ? 'Identity'
                    : `CF${i + 1}`

            handler.setCryptFilter(name, cryptFilter)

            for (const type in cryptFilterForType) {
                if (
                    cryptFilterForType[type as CryptFilterType] ===
                    uniqueCryptFiltersArray[i]
                ) {
                    handler.setCryptFilterForType(type as CryptFilterType, name)
                }
            }
        }
    }

    return handler
}
