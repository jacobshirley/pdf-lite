import { ByteArray, Cipher } from '../../types'
import { PdfCryptFilter, CryptFilterOptions } from './base'

export class IdentityCryptFilter extends PdfCryptFilter {
    constructor(options: { authEvent: CryptFilterOptions['authEvent'] }) {
        super({ ...options, cfm: 'None' })
    }

    async getCipher(): Promise<Cipher> {
        return {
            encrypt: async (data: ByteArray) => {
                return data
            },
            decrypt: async (data: ByteArray) => {
                return data
            },
        }
    }
}
