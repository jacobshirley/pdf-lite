import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { bytesToString } from '../../utils/bytesToString.js'

export class PdfJavaScriptAction {
    private readonly dict: PdfDictionary

    constructor(dict: PdfDictionary) {
        this.dict = dict
    }

    get code(): string | null {
        const js = this.dict.get('JS')
        if (js instanceof PdfString) {
            return js.value
        }
        if (js instanceof PdfObjectReference) {
            const resolved = js.resolve()
            if (resolved?.content instanceof PdfStream) {
                return bytesToString(resolved.content.data)
            }
            if (resolved?.content instanceof PdfString) {
                return resolved.content.value
            }
        }
        if (js instanceof PdfStream) {
            return bytesToString(js.data)
        }
        return null
    }
}
