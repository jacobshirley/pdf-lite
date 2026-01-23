import { ByteArray } from '../../types.js'
import { PdfToken } from './token.js'

export class PdfBooleanToken extends PdfToken {
    static TRUE = new PdfBooleanToken(true)
    static FALSE = new PdfBooleanToken(false)

    value: boolean

    constructor(value: boolean) {
        super(PdfBooleanToken.toBytes(value))
        this.value = value
    }

    private static toBytes(value: boolean): ByteArray {
        return value
            ? new Uint8Array([0x74, 0x72, 0x75, 0x65])
            : new Uint8Array([0x66, 0x61, 0x6c, 0x73, 0x65])
    }
}
