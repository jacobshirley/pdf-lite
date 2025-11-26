import { Cipher } from '../../crypto/types'
import { ByteArray } from '../../types'
import { PdfCryptFilter, CryptFilterOptions } from './base'

/**
 * Identity crypt filter that passes data through without encryption.
 * Used when no encryption is needed for specific content types.
 *
 * @example
 * ```typescript
 * const filter = new IdentityCryptFilter({ authEvent: 'DocOpen' })
 * const output = await filter.encrypt(data) // Returns data unchanged
 * ```
 */
export class IdentityCryptFilter extends PdfCryptFilter {
    /**
     * Creates a new identity crypt filter.
     *
     * @param options - Configuration options with authentication event.
     */
    constructor(options: { authEvent: CryptFilterOptions['authEvent'] }) {
        super({ ...options, cfm: 'None' })
    }

    /**
     * Gets a passthrough cipher that returns data unchanged.
     *
     * @returns A cipher that performs no encryption or decryption.
     */
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
