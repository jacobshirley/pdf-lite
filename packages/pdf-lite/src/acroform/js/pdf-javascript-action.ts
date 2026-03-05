import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { bytesToString } from '../../utils/bytesToString.js'
import type { PdfJsEngine, PdfJsEvent } from './pdf-js-engine.js'

export class PdfJavaScriptAction extends PdfDictionary<{
    S?: PdfName
    JS?: PdfString | PdfStream | PdfObjectReference
}> {
    engine?: PdfJsEngine

    constructor(options: { dict: PdfDictionary; engine?: PdfJsEngine }) {
        super()
        this.copyFrom(options.dict)
        this.engine = options.engine
    }

    get code(): string | null {
        const js = this.get('JS')
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

    execute(event: PdfJsEvent): void {
        const code = this.code
        if (code && this.engine) {
            this.engine.execute(code, event)
        }
    }
}
