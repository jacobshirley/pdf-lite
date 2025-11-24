import { rc4 } from '../../crypto/ciphers/rc4.js'
import { Cipher } from '../../types'
import { PdfCryptFilter, CryptFilterOptions } from './base'

export class V2CryptFilter extends PdfCryptFilter {
    constructor(options: {
        authEvent: CryptFilterOptions['authEvent']
        securityHandler?: CryptFilterOptions['securityHandler']
        length?: number
    }) {
        super({ ...options, cfm: 'V2', length: options.length || 40 })
    }

    async getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher> {
        const securityHandler = this.securityHandler
        if (!securityHandler) {
            throw new Error('Missing security handler for V2 crypt filter')
        }

        const objectKey = await securityHandler.computeObjectKey(
            objectNumber,
            generationNumber,
        )

        return rc4(
            objectKey.slice(0, this.length / 8), // V2 needs a key of specified length in bits
        )
    }
}
