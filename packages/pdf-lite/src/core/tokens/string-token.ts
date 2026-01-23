import { ByteArray } from '../../types.js'
import { escapeString } from '../../utils/escapeString.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

export class PdfStringToken extends PdfToken {
    value: ByteArray

    constructor(value: string | ByteArray) {
        super(PdfStringToken.toBytes(value))
        this.value = typeof value === 'string' ? stringToBytes(value) : value
    }

    private static toBytes(value: string | ByteArray): ByteArray {
        return new Uint8Array([0x28, ...escapeString(value), 0x29])
    }
}
