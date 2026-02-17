import { ByteArray } from '../../types.js'
import { needsUnicodeEncoding } from '../../utils/needsUnicodeEncoding.js'
import { encodeAsUTF16BE } from '../../utils/encodeAsUTF16BE.js'
import { encodeToPDFDocEncoding } from '../../utils/encodeToPDFDocEncoding.js'
import { decodeFromUTF16BE } from '../../utils/decodeFromUTF16BE.js'
import { decodeFromPDFDocEncoding } from '../../utils/decodeFromPDFDocEncoding.js'
import { PdfStringToken } from '../tokens/string-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfString extends PdfObject {
    /**
     * The raw bytes of the PDF string.
     */
    private _raw: ByteArray

    /**
     * Original bytes from the PDF file, including parentheses and escape sequences.
     * Used to preserve exact formatting for incremental updates.
     */
    private _originalBytes?: ByteArray

    constructor(raw: ByteArray | string, originalBytes?: ByteArray) {
        super()
        if (typeof raw === 'string') {
            // Check if the string contains non-ASCII characters
            if (needsUnicodeEncoding(raw)) {
                // Use UTF-16BE encoding with BOM for Unicode strings
                this._raw = encodeAsUTF16BE(raw)
            } else {
                //for simple strings
                this._raw = encodeToPDFDocEncoding(raw)
            }
        } else {
            this._raw = raw
        }
        this._originalBytes = originalBytes
    }

    get raw(): ByteArray {
        return this._raw
    }

    set raw(raw: ByteArray) {
        if (this.isImmutable()) {
            throw new Error('Cannot modify an immutable PdfString')
        }

        this.setModified()
        this._raw = raw
        // Clear original bytes when modified
        this._originalBytes = undefined
    }

    /**
     * Checks if this string is UTF-16BE encoded (has UTF-16BE BOM).
     * UTF-16BE strings start with the byte order mark 0xFE 0xFF.
     */
    get isUTF16BE(): boolean {
        return (
            this.raw.length >= 2 && this.raw[0] === 0xfe && this.raw[1] === 0xff
        )
    }

    set value(str: string) {
        if (this.isImmutable()) {
            throw new Error('Cannot modify an immutable PdfString')
        }

        this.setModified()

        if (needsUnicodeEncoding(str)) {
            this._raw = encodeAsUTF16BE(str)
        } else {
            this._raw = encodeToPDFDocEncoding(str)
        }

        // Clear original bytes when modified
        this._originalBytes = undefined
    }

    get value(): string {
        // Check for UTF-16BE BOM (0xFE 0xFF)
        if (this.isUTF16BE) {
            return decodeFromUTF16BE(this.raw)
        }

        // Default: use PDFDocEncoding
        return decodeFromPDFDocEncoding(this.raw)
    }

    protected tokenize() {
        return [new PdfStringToken(this.raw, this._originalBytes)]
    }

    clone(): this {
        return new PdfString(
            new Uint8Array(this.raw),
            this._originalBytes
                ? new Uint8Array(this._originalBytes)
                : undefined,
        ) as this
    }
}
