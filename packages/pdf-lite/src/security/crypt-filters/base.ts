import { PdfDictionary } from '../../core/objects/pdf-dictionary'
import { PdfName } from '../../core/objects/pdf-name'
import { PdfNumber } from '../../core/objects/pdf-number'
import { ByteArray, Cipher } from '../../types'
import { PdfSecurityHandler } from '../handlers/base'
import { PdfCryptFilterDictionary } from '../types'

export type CryptFilterOptions = {
    securityHandler?: PdfSecurityHandler
    cfm: 'None' | 'V2' | 'AESV2' | 'AESV3'
    authEvent: 'DocOpen' | 'EFOpen'
    length?: number
}

export abstract class PdfCryptFilter {
    cfm: 'None' | 'V2' | 'AESV2' | 'AESV3'
    authEvent: 'DocOpen' | 'EFOpen'
    length: number
    protected securityHandler?: PdfSecurityHandler

    constructor(options: CryptFilterOptions) {
        const { cfm, authEvent, length, securityHandler } = options

        this.securityHandler = securityHandler
        this.cfm = cfm
        this.authEvent = authEvent
        this.length = length ?? 0
    }

    setSecurityHandler(handler: PdfSecurityHandler) {
        this.securityHandler = handler
    }

    getSecurityHandler(): PdfSecurityHandler | undefined {
        return this.securityHandler
    }

    abstract getCipher(
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<Cipher>

    async encrypt(
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        const cipher = await this.getCipher(objectNumber, generationNumber)
        return cipher.encrypt(data)
    }

    async decrypt(
        data: ByteArray,
        objectNumber?: number,
        generationNumber?: number,
    ): Promise<ByteArray> {
        const cipher = await this.getCipher(objectNumber, generationNumber)
        return cipher.decrypt(data)
    }

    toDictionary(): PdfCryptFilterDictionary {
        const dict: PdfCryptFilterDictionary = new PdfDictionary({
            AuthEvent: new PdfName(this.authEvent),
            CFM: new PdfName(this.cfm),
            ...(this.length
                ? {
                      Length: new PdfNumber(this.length),
                  }
                : {}),
        })

        return dict
    }
}
