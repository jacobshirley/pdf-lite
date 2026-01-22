import { ByteArray } from '../../types.js'
import { bytesToHexBytes } from '../../utils/bytesToHexBytes.js'
import { bytesToString } from '../../utils/bytesToString.js'
import { hexBytesToBytes } from '../../utils/hexBytesToBytes.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfHexadecimalToken } from '../tokens/hexadecimal-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfHexadecimal extends PdfObject {
    /**
     * The raw byte value represented by this hexadecimal object.
     * NB: This is  the hexadecimal representation, not the actual byte values.
     */
    raw: ByteArray

    constructor(value: string | ByteArray, format: 'hex' | 'bytes' = 'hex') {
        super()

        let bytes: ByteArray
        if (format === 'bytes') {
            bytes = bytesToHexBytes(
                value instanceof Uint8Array ? value : stringToBytes(value),
            )
        } else {
            bytes = value instanceof Uint8Array ? value : stringToBytes(value)
        }

        this.raw = bytes
    }

    static toHexadecimal(data: string | ByteArray): PdfHexadecimal {
        return new PdfHexadecimal(data, 'bytes')
    }

    get bytes(): ByteArray {
        return hexBytesToBytes(this.raw)
    }

    toHexBytes(): ByteArray {
        return bytesToHexBytes(this.raw)
    }

    toHexString(): string {
        return bytesToString(this.toHexBytes())
    }

    protected tokenize() {
        return [new PdfHexadecimalToken(this.raw)]
    }

    clone(): this {
        return new PdfHexadecimal(new Uint8Array(this.raw)) as this
    }
}
