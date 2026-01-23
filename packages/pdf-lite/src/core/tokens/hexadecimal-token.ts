import { ByteArray } from '../../types.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

export class PdfHexadecimalToken extends PdfToken {
    raw: ByteArray

    constructor(hexadecimal: string | ByteArray) {
        super(PdfHexadecimalToken.toBytes(hexadecimal))

        this.raw =
            typeof hexadecimal === 'string'
                ? stringToBytes(hexadecimal)
                : hexadecimal
    }

    private static toBytes(hexadecimal: string | ByteArray): ByteArray {
        const bytes = stringToBytes(hexadecimal)

        return new Uint8Array([0x3c, ...bytes, 0x3e])
    }
}
