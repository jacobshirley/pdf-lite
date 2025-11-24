import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

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
