import { describe, expect, it, vi } from 'vitest'
import { rsaSigningKeys } from './fixtures/rsa-2048'
import { PdfV1SecurityHandler } from '../../src/security/handlers/v1'
import { PdfV2SecurityHandler } from '../../src/security/handlers/v2'
import { PdfV4SecurityHandler } from '../../src/security/handlers/v4'
import { PdfV5SecurityHandler } from '../../src/security/handlers/v5'
import { PdfPublicKeySecurityHandler } from '../../src/security/handlers/pubSec'
import { PdfEncryptionDictionary } from '../../src/security/types'
import { createFromDictionary } from '../../src/security/handlers/utils'
import { PdfSecurityHandler } from '../../src/security/handlers/base'
import { AesV2CryptFilter } from '../../src/security/crypt-filters/aesv2'
import { PdfCryptFilter } from '../../src/security/crypt-filters/base'
import { V2CryptFilter } from '../../src/security/crypt-filters/v2'
import { AesV3CryptFilter } from '../../src/security/crypt-filters/aesv3'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfNumber } from '../../src/core/objects/pdf-number'
import { PdfHexadecimal } from '../../src/core/objects/pdf-hexadecimal'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { ByteArray } from '../../src/types'
import { stringToBytes } from '../../src/utils/stringToBytes'

describe('Security Handlers', () => {
    const handlerSettings: {
        [key: string]: {
            handler: new (options: any) => PdfSecurityHandler
            r: number
            v: number
            length: number
            filter: `Standard` | `Adobe.PubSec`
            recipients?: ByteArray[]
            testCryptFilters?: boolean
        }
    } = {
        'RC4-40': {
            handler: PdfV1SecurityHandler,
            r: 2,
            v: 1,
            length: 40,
            filter: 'Standard',
        },
        'RC4-128': {
            handler: PdfV2SecurityHandler,
            r: 3,
            v: 2,
            length: 128,
            filter: 'Standard',
        },
        'AES-128': {
            handler: PdfV4SecurityHandler,
            r: 4,
            v: 4,
            length: 128,
            filter: 'Standard',
            testCryptFilters: true,
        },
        'AES-256': {
            handler: PdfV5SecurityHandler,
            r: 5,
            v: 5,
            length: 256,
            filter: 'Standard',
            testCryptFilters: true,
        },
        PubSec: {
            handler: PdfPublicKeySecurityHandler,
            r: 5,
            v: 5,
            filter: 'Adobe.PubSec',
            length: 256,
            recipients: [new Uint8Array([])],
            testCryptFilters: true,
        },
    }

    describe('Create Handler from Dictionary', () => {
        for (const [name, settings] of Object.entries(handlerSettings)) {
            it(`${name}: should create handler from dictionary`, async () => {
                const dict: PdfEncryptionDictionary = new PdfDictionary({
                    Filter: new PdfName(settings.filter),
                    V: new PdfNumber(settings.v),
                    R: new PdfNumber(settings.r),
                    O: new PdfHexadecimal(
                        new Uint8Array([
                            0x4c, 0x5c, 0x7a, 0x1c, 0x3f, 0x3d, 0x55, 0x4e,
                            0x5f, 0x4b, 0x6c, 0x6f, 0x6d, 0x2c, 0x7a, 0x1c,
                            0x3f, 0x3d, 0x55, 0x4e, 0x5f, 0x4b, 0x6c, 0x6f,
                            0x6d, 0x2c, 0x7a, 0x1c, 0x3f, 0x3d, 0x55, 0x4e,
                            0x5f, 0x4b, 0x6c, 0x6f, 0x6d, 0x2c,
                        ]),
                    ),
                    U: new PdfHexadecimal(
                        new Uint8Array([
                            0x28, 0x3c, 0x4e, 0x5f, 0x4b, 0x6c, 0x6f, 0x6d,
                            0x2c, 0x7a, 0x1c, 0x3f, 0x3d, 0x55, 0x4e, 0x5f,
                            0x4b, 0x6c, 0x6f, 0x6d, 0x2c,
                        ]),
                    ),
                    UE: new PdfHexadecimal(
                        new Uint8Array([
                            0x28, 0x3c, 0x4e, 0x5f, 0x4b, 0x6c, 0x6f, 0x6d,
                            0x2c, 0x7a, 0x1c, 0x3f, 0x3d, 0x55, 0x4e, 0x5f,
                            0x4b, 0x6c, 0x6f, 0x6d, 0x2c,
                        ]),
                    ),
                    OE: new PdfHexadecimal(
                        new Uint8Array([
                            0x28, 0x3c, 0x4e, 0x5f, 0x4b, 0x6c, 0x6f, 0x6d,
                            0x2c, 0x7a, 0x1c, 0x3f, 0x3d, 0x55, 0x4e, 0x5f,
                            0x4b, 0x6c, 0x6f, 0x6d, 0x2c,
                        ]),
                    ),
                    Perms: new PdfHexadecimal(
                        new Uint8Array([
                            0x28, 0x3c, 0x4e, 0x5f, 0x4b, 0x6c, 0x6f, 0x6d,
                            0x2c, 0x7a, 0x1c, 0x3f, 0x3d, 0x55, 0x4e, 0x5f,
                            0x4b, 0x6c, 0x6f, 0x6d, 0x2c,
                        ]),
                    ),
                    P: new PdfNumber(-44),
                    Recipients: settings.recipients
                        ? new PdfArray(
                              settings.recipients.map(
                                  (r) => new PdfHexadecimal(r),
                              ),
                          )
                        : undefined,
                    Length: new PdfNumber(settings.length),
                })

                const handler = await createFromDictionary(dict, {
                    password: 'userpassword',
                    recipients:
                        settings.filter === 'Adobe.PubSec'
                            ? [
                                  {
                                      certificate: rsaSigningKeys.cert,
                                  },
                              ]
                            : [],
                })

                expect(handler).toBeInstanceOf(settings.handler)
            })

            it(`${name}: should encrypt and decrypt data correctly`, async () => {
                const data = stringToBytes('Hello, World!')
                const objectNumber = 1
                const generationNumber = 0
                const password = 'userpassword'

                const HandlerClass = settings.handler
                const handler = new HandlerClass({
                    password,
                    documentId: 'test',
                    recipients:
                        settings.filter === 'Adobe.PubSec'
                            ? [
                                  {
                                      certificate: rsaSigningKeys.cert,
                                  },
                              ]
                            : [],
                })

                await handler.write()

                const dict = handler.dict
                const parsedHandler = await createFromDictionary(dict, {
                    password,
                    recipients:
                        settings.filter === 'Adobe.PubSec'
                            ? [
                                  {
                                      certificate: rsaSigningKeys.cert,
                                      privateKey: rsaSigningKeys.privateKey,
                                  },
                              ]
                            : [],
                })

                expect(parsedHandler).toBeInstanceOf(settings.handler)
                const encryptedData = await handler.encrypt(
                    'stream',
                    data,
                    objectNumber,
                    generationNumber,
                )
                const decryptedData = await parsedHandler.decrypt(
                    'stream',
                    encryptedData,
                    objectNumber,
                    generationNumber,
                )
                expect(new TextDecoder().decode(decryptedData)).toBe(
                    'Hello, World!',
                )
            })

            it(`${name}: should work with owner password`, async () => {
                if (settings.filter === 'Adobe.PubSec') {
                    // Skip owner password test for PubSec handlers as they don't use owner passwords
                    return
                }

                const data = stringToBytes('Hello, World!')
                const objectNumber = 1
                const generationNumber = 0
                const userPassword = 'userpassword'
                const ownerPassword = 'ownerpassword'

                const HandlerClass = settings.handler
                const handler = new HandlerClass({
                    password: userPassword,
                    ownerPassword: ownerPassword,
                    documentId: 'test',
                })

                await handler.write()

                const dict = handler.dict

                // Test that owner password can decrypt
                const ownerHandler = await createFromDictionary(dict, {
                    ownerPassword: ownerPassword,
                })

                expect(ownerHandler).toBeInstanceOf(settings.handler)

                const encryptedData = await handler.encrypt(
                    'stream',
                    data,
                    objectNumber,
                    generationNumber,
                )
                const decryptedDataWithOwner = await ownerHandler.decrypt(
                    'stream',
                    encryptedData,
                    objectNumber,
                    generationNumber,
                )
                expect(new TextDecoder().decode(decryptedDataWithOwner)).toBe(
                    'Hello, World!',
                )

                // Test that user password can also decrypt
                const userHandler = await createFromDictionary(dict, {
                    password: userPassword,
                })

                expect(userHandler).toBeInstanceOf(settings.handler)

                const decryptedDataWithUser = await userHandler.decrypt(
                    'stream',
                    encryptedData,
                    objectNumber,
                    generationNumber,
                )
                expect(new TextDecoder().decode(decryptedDataWithUser)).toBe(
                    'Hello, World!',
                )
            })

            it(`${name}: should fail with incorrect password`, async () => {
                if (settings.filter === 'Adobe.PubSec') {
                    // Skip password test for PubSec handlers as they use certificates
                    return
                }

                const userPassword = 'userpassword'
                const wrongPassword = 'wrongpassword'

                const HandlerClass = settings.handler
                const handler = new HandlerClass({
                    password: userPassword,
                    documentId: 'test',
                })

                await handler.write()

                const dict = handler.dict

                // Test that wrong password fails
                await expect(
                    createFromDictionary(dict, {
                        password: wrongPassword,
                    }).computeObjectKey(),
                ).rejects.toThrow()
            })

            if (settings.testCryptFilters) {
                it(`${name}: should support Identity crypt filter meaning no encryption`, async () => {
                    const userPassword = 'userpassword'
                    const handler = new handlerSettings[name].handler({
                        password: userPassword,
                        documentId: 'test',
                        recipients:
                            settings.filter === 'Adobe.PubSec'
                                ? [
                                      {
                                          certificate: rsaSigningKeys.cert,
                                          privateKey: rsaSigningKeys.privateKey,
                                      },
                                  ]
                                : [],
                    })

                    if (
                        !(handler instanceof PdfV4SecurityHandler) &&
                        !(handler instanceof PdfPublicKeySecurityHandler)
                    ) {
                        throw new Error(
                            'Handler is not a PdfV4SecurityHandler or PdfPublicKeySecurityHandler',
                        )
                    }

                    if (handler instanceof PdfPublicKeySecurityHandler) {
                        const standardHandler =
                            handler.getStandardSecurityHandler()
                        if (
                            !(standardHandler instanceof PdfV4SecurityHandler)
                        ) {
                            throw new Error(
                                'Standard handler is not a PdfV4SecurityHandler',
                            )
                        }
                        standardHandler.setCryptFilterForType(
                            'stream',
                            'Identity',
                        )
                    } else {
                        handler.setCryptFilterForType('stream', 'Identity')
                    }

                    const data = stringToBytes('Hello, World!')
                    const objectNumber = 1
                    const generationNumber = 0

                    await handler.write()

                    const dict = handler.dict
                    expect(
                        dict.values['CF']?.values['Identity'],
                    ).not.toBeDefined() // Identity filter should not be listed in /CF
                    const parsedHandler = await createFromDictionary(dict, {
                        password: userPassword,
                        recipients:
                            settings.filter === 'Adobe.PubSec'
                                ? [
                                      {
                                          certificate: rsaSigningKeys.cert,
                                          privateKey: rsaSigningKeys.privateKey,
                                      },
                                  ]
                                : [],
                    })

                    expect(parsedHandler).toBeInstanceOf(settings.handler)

                    const encryptedData = await handler.encrypt(
                        'stream',
                        data,
                        objectNumber,
                        generationNumber,
                    )

                    // Data should be unchanged as /Identity means no encryption
                    expect(encryptedData).toEqual(data)

                    const decryptedData = await parsedHandler.decrypt(
                        'stream',
                        encryptedData,
                        objectNumber,
                        generationNumber,
                    )

                    expect(new TextDecoder().decode(decryptedData)).toBe(
                        'Hello, World!',
                    )
                })

                const cryptFilters: PdfCryptFilter[] = [
                    new V2CryptFilter({ authEvent: 'DocOpen' }),
                ]

                if (name !== 'RC4-40') {
                    cryptFilters.push(
                        new AesV2CryptFilter({ authEvent: 'DocOpen' }),
                    )
                    cryptFilters.push(
                        new AesV3CryptFilter({ authEvent: 'EFOpen' }),
                    )
                }

                for (const cf of cryptFilters) {
                    it(`${name}: should support ${cf.constructor.name} crypt filter`, async () => {
                        const userPassword = 'userpassword'
                        const handler = new handlerSettings[name].handler({
                            password: userPassword,
                            documentId: 'test',
                            recipients:
                                settings.filter === 'Adobe.PubSec'
                                    ? [
                                          {
                                              certificate: rsaSigningKeys.cert,
                                              privateKey:
                                                  rsaSigningKeys.privateKey,
                                          },
                                      ]
                                    : [],
                        })

                        if (
                            !(handler instanceof PdfV4SecurityHandler) &&
                            !(handler instanceof PdfPublicKeySecurityHandler)
                        ) {
                            throw new Error(
                                'Handler is not a PdfV4SecurityHandler or PdfPublicKeySecurityHandler',
                            )
                        }

                        cf.encrypt = vi.fn(cf.encrypt)
                        cf.decrypt = vi.fn(cf.decrypt)

                        if (handler instanceof PdfPublicKeySecurityHandler) {
                            const standardHandler =
                                handler.getStandardSecurityHandler()
                            if (
                                !(
                                    standardHandler instanceof
                                    PdfV4SecurityHandler
                                )
                            ) {
                                throw new Error(
                                    'Standard handler is not a PdfV4SecurityHandler',
                                )
                            }
                            standardHandler.setCryptFilter('StdCF', cf)
                            standardHandler.setCryptFilterForType(
                                'stream',
                                'StdCF',
                            )
                        } else {
                            handler.setCryptFilter('StdCF', cf)
                            handler.setCryptFilterForType('stream', 'StdCF')
                        }

                        const data = stringToBytes('Hello, World!')
                        const objectNumber = 1
                        const generationNumber = 0

                        await handler.write()
                        const dict = handler.dict
                        const parsedHandler = await createFromDictionary(dict, {
                            password: userPassword,
                            recipients:
                                settings.filter === 'Adobe.PubSec'
                                    ? [
                                          {
                                              certificate: rsaSigningKeys.cert,
                                              privateKey:
                                                  rsaSigningKeys.privateKey,
                                          },
                                      ]
                                    : [],
                        })

                        expect(parsedHandler).toBeInstanceOf(settings.handler)

                        const encryptedData = await handler.encrypt(
                            'stream',
                            data,
                            objectNumber,
                            generationNumber,
                        )

                        const decryptedData = await parsedHandler.decrypt(
                            'stream',
                            encryptedData,
                            objectNumber,
                            generationNumber,
                        )

                        expect(new TextDecoder().decode(decryptedData)).toBe(
                            'Hello, World!',
                        )
                        expect(cf.encrypt).toHaveBeenCalled()
                    })
                }
            }
        }
    })

    describe('Owner Password Logic', () => {
        it('should derive user password from owner password correctly', async () => {
            const userPassword = 'user123'
            const ownerPassword = 'owner456'

            // Test with V2 handler (RC4-128)
            const handler = new PdfV2SecurityHandler({
                password: userPassword,
                ownerPassword: ownerPassword,
                documentId: 'test',
            })

            await handler.write()
            const dict = handler.dict

            // Create handler using owner password - it should be able to derive the user password
            const ownerHandler = await createFromDictionary(dict, {
                ownerPassword: ownerPassword,
            })

            expect(ownerHandler).toBeInstanceOf(PdfV2SecurityHandler)

            // Test encryption/decryption works
            const data = stringToBytes('Test data')
            const encryptedData = await handler.encrypt('stream', data, 1, 0)
            const decryptedData = await ownerHandler.decrypt(
                'stream',
                encryptedData,
                1,
                0,
            )

            expect(new TextDecoder().decode(decryptedData)).toBe('Test data')
        })

        it('should handle owner password same as user password', async () => {
            const password = 'samepassword'

            // Test when owner password is the same as user password
            const handler = new PdfV2SecurityHandler({
                password: password,
                ownerPassword: password,
                documentId: 'test',
            })

            await handler.write()
            const dict = handler.dict

            // Should work with the same password
            const samePasswordHandler = await createFromDictionary(dict, {
                password: password,
            })

            expect(samePasswordHandler).toBeInstanceOf(PdfV2SecurityHandler)

            // Test encryption/decryption works
            const data = stringToBytes('Same password test')
            const encryptedData = await handler.encrypt('stream', data, 1, 0)
            const decryptedData = await samePasswordHandler.decrypt(
                'stream',
                encryptedData,
                1,
                0,
            )

            expect(new TextDecoder().decode(decryptedData)).toBe(
                'Same password test',
            )
        })

        it('should handle empty owner password (defaults to user password)', async () => {
            const userPassword = 'userpass'

            // Test when no owner password is provided (should default to user password)
            const handler = new PdfV2SecurityHandler({
                password: userPassword,
                documentId: 'test',
            })

            await handler.write()
            const dict = handler.dict

            // Should work with user password as owner password
            const userAsOwnerHandler = await createFromDictionary(dict, {
                password: userPassword,
            })

            expect(userAsOwnerHandler).toBeInstanceOf(PdfV2SecurityHandler)

            // Test encryption/decryption works
            const data = stringToBytes('Default owner password test')
            const encryptedData = await handler.encrypt('stream', data, 1, 0)
            const decryptedData = await userAsOwnerHandler.decrypt(
                'stream',
                encryptedData,
                1,
                0,
            )

            expect(new TextDecoder().decode(decryptedData)).toBe(
                'Default owner password test',
            )
        })
    })
})

describe('PubSec Security Handler', () => {
    it('should encrypt and decrypt data correctly', async () => {
        const standardHandler = new PdfV4SecurityHandler({
            documentId: 'test',
        })

        const encryptionHandler = new PdfPublicKeySecurityHandler({
            standardSecurityHandler: standardHandler,
            recipients: [
                {
                    certificate: rsaSigningKeys.cert,
                },
            ],
        })

        const decryptionHandler = new PdfPublicKeySecurityHandler({
            standardSecurityHandler: standardHandler,
            recipients: [
                {
                    certificate: rsaSigningKeys.cert,
                    privateKey: rsaSigningKeys.privateKey,
                },
            ],
        })

        await encryptionHandler.write()
        const dict = encryptionHandler.dict
        decryptionHandler.readEncryptionDictionary(dict)

        const data = stringToBytes('Hello, World!')
        const encryptedData = await encryptionHandler.encrypt(
            'stream',
            data,
            1,
            0,
        )
        const decryptedData = await decryptionHandler.decrypt(
            'stream',
            encryptedData,
            1,
            0,
        )

        expect(new TextDecoder().decode(decryptedData)).toBe('Hello, World!')
    })
})
