import { ByteArray } from '../../types'
import { bytesToString } from '../../utils/bytesToString'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfStringToken } from '../tokens/string-token'
import { PdfObject } from './pdf-object'

export class PdfString extends PdfObject {
    /**
     * The raw bytes of the PDF string.
     */
    raw: ByteArray

    constructor(raw: ByteArray | string) {
        super()
        this.raw = typeof raw === 'string' ? stringToBytes(raw) : raw
    }

    get value(): string {
        return bytesToString(this.raw)
    }

    protected tokenize() {
        return [new PdfStringToken(this.raw)]
    }

    clone(): this {
        return new PdfString(new Uint8Array(this.raw)) as this
    }
}
