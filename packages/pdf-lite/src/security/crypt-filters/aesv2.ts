import { PdfCryptFilter, CryptFilterOptions } from './base'
import { aes128 } from '../../crypto/ciphers/aes128'
import { Cipher } from '../../types'

export class AesV2CryptFilter extends PdfCryptFilter {
    constructor(options: {
        authEvent: CryptFilterOptions['authEvent']
        securityHandler?: CryptFilterOptions['securityHandler']
    }) {
        super({ ...options, cfm: 'AESV2', length: 128 })
    }

    async getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher> {
        const securityHandler = this.securityHandler
        if (!securityHandler) {
            throw new Error('Missing security handler for AESV2 crypt filter')
        }

        const objectKey = await securityHandler.computeObjectKey(
            objectNumber,
            generationNumber,
            'AES-128-CBC',
        )

        return aes128(
            objectKey.slice(0, 16), // AES-128 needs a 16-byte key
        )
    }
}
