import { aes256 } from '../../crypto/ciphers/aes256'
import { Cipher } from '../../types'
import { PdfCryptFilter, CryptFilterOptions } from './base'

export class AesV3CryptFilter extends PdfCryptFilter {
    constructor(options: {
        authEvent: CryptFilterOptions['authEvent']
        securityHandler?: CryptFilterOptions['securityHandler']
    }) {
        super({ ...options, cfm: 'AESV3', length: 256 })
    }

    async getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher> {
        const securityHandler = this.securityHandler
        if (!securityHandler) {
            throw new Error('Missing security handler for AESV3 crypt filter')
        }

        const objectKey = await securityHandler.computeObjectKey(
            objectNumber,
            generationNumber,
        )

        return aes256(objectKey)
    }
}
