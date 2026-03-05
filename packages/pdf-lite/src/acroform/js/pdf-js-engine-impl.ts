import type { PdfJsEngine, PdfJsEvent } from './pdf-js-engine.js'
import { createBuiltins } from './pdf-js-builtins.js'

export interface PdfJavaScriptEngineOptions {
    getFieldValue?: (name: string) => string
}

export class PdfJavaScriptEngine implements PdfJsEngine {
    private _getFieldValue?: (name: string) => string

    constructor(options?: PdfJavaScriptEngineOptions) {
        this._getFieldValue = options?.getFieldValue
    }

    execute(code: string, event: PdfJsEvent): void {
        const builtins = createBuiltins(event, this._getFieldValue)
        const names = Object.keys(builtins)
        const fn = new Function('event', 'app', ...names, code)
        fn(
            event,
            Object.freeze({ alert() {} }),
            ...names.map((k) => builtins[k]),
        )
    }
}
