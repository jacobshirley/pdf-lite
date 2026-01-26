import { ByteArray } from '../../types.js'
import { bytesToString } from '../../utils/bytesToString.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { needsUnicodeEncoding } from '../../utils/needsUnicodeEncoding.js'
import { encodeAsUTF16BE } from '../../utils/encodeAsUTF16BE.js'
import { decodeFromUTF16BE } from '../../utils/decodeFromUTF16BE.js'
import { PdfStringToken } from '../tokens/string-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfString extends PdfObject {
    /**
     * The raw bytes of the PDF string.
     */
    private _raw: ByteArray

    constructor(raw: ByteArray | string) {
        super()
        if (typeof raw === 'string') {
            // Check if the string contains non-ASCII characters
            if (needsUnicodeEncoding(raw)) {
                // Use UTF-16BE encoding with BOM for Unicode strings
                this._raw = encodeAsUTF16BE(raw)
            } else {
                // Use PDFDocEncoding (ASCII-compatible) for simple strings
                this._raw = stringToBytes(raw)
            }
        } else {
            this._raw = raw
        }
    }

    get raw(): ByteArray {
        return this._raw
    }

    set raw(raw: ByteArray) {
        this.setModified()
        this._raw = raw
    }

    get value(): string {
        // Check for UTF-16BE BOM (0xFE 0xFF)
        if (
            this.raw.length >= 2 &&
            this.raw[0] === 0xfe &&
            this.raw[1] === 0xff
        ) {
            return decodeFromUTF16BE(this.raw)
        }

        // Default: use UTF-8 decoding
        return bytesToString(this.raw)
    }

    protected tokenize() {
        return [new PdfStringToken(this.raw)]
    }

    clone(): this {
        return new PdfString(new Uint8Array(this.raw)) as this
    }
}
