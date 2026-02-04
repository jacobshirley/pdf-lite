import { ByteArray } from '../../types.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

export class PdfHexadecimalToken extends PdfToken {
    raw: ByteArray
    /**
     * Original bytes from the PDF file, including angle brackets.
     * Used to preserve exact formatting for incremental updates.
     * @internal - Non-enumerable to avoid affecting test comparisons
     */
    private _originalBytes?: ByteArray

    constructor(hexadecimal: string | ByteArray, originalBytes?: ByteArray) {
        super(originalBytes ?? PdfHexadecimalToken.toBytes(hexadecimal))

        this.raw =
            typeof hexadecimal === 'string'
                ? stringToBytes(hexadecimal)
                : hexadecimal
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

    private static toBytes(hexadecimal: string | ByteArray): ByteArray {
        const bytes = stringToBytes(hexadecimal)

        return new Uint8Array([0x3c, ...bytes, 0x3e])
    }
}
