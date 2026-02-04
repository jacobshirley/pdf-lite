import { ByteArray } from '../../types.js'
import { escapeString } from '../../utils/escapeString.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

export class PdfStringToken extends PdfToken {
    value: ByteArray
    /**
     * Original bytes from the PDF file, including parentheses and escape sequences.
     * Used to preserve exact formatting for incremental updates.
     * @internal - Non-enumerable to avoid affecting test comparisons
     */
    private _originalBytes?: ByteArray

    constructor(value: string | ByteArray, originalBytes?: ByteArray) {
        super(originalBytes ?? PdfStringToken.toBytes(value))
        this.value = typeof value === 'string' ? stringToBytes(value) : value
        if (originalBytes) {
            // Make non-enumerable so it doesn't affect .toEqual() comparisons
            Object.defineProperty(this, '_originalBytes', {
                value: originalBytes,
                writable: true,
                enumerable: false,
                configurable: true,
            })
        }
    }

    get originalBytes(): ByteArray | undefined {
        return this._originalBytes
    }

    private static toBytes(value: string | ByteArray): ByteArray {
        return new Uint8Array([0x28, ...escapeString(value), 0x29])
    }
}
