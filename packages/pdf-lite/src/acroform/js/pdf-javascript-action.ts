import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'

/**
 * Wraps a PDF action dictionary that contains a `/JS` (JavaScript) entry.
 *
 * The `/JS` value may be either a `PdfString` (inline JS) or a `PdfStream`
 * (compressed/indirect JS). Both are normalised to a plain `string` via the
 * `code` getter.
 */
export class PdfJavaScriptAction {
    private _dict: PdfDictionary

    constructor(dict: PdfDictionary) {
        this._dict = dict
    }

    /**
     * Returns the JavaScript source code string, decoding the `/JS` entry
     * whether it is stored as a `PdfString` or a `PdfStream`.
     *
     * Returns an empty string if no `/JS` entry is present.
     */
    get code(): string {
        const js = this._dict.get('JS')
        if (!js) return ''

        if (js instanceof PdfString) {
            return js.value
        }

        if (js instanceof PdfStream) {
            const bytes = js.decode()
            // PDF JS streams are typically ASCII / Latin-1
            let result = ''
            for (let i = 0; i < bytes.length; i++) {
                result += String.fromCharCode(bytes[i])
            }
            return result
        }

        return ''
    }
}
