import type { PdfJsEngine, PdfJsEvent } from './pdf-js-engine.js'
import { createBuiltins } from './pdf-js-builtins.js'

export interface PdfJavaScriptEngineOptions {
    getFieldValue?: (name: string) => string
}

/**
 * Default JavaScript engine that executes PDF JS actions via `new Function()`.
 *
 * **Security note:** This engine runs PDF-sourced JavaScript with access to the
 * ambient JS environment (e.g. `globalThis`, constructors, network APIs). It is
 * NOT sandboxed and should only be used with trusted PDF documents. For untrusted
 * documents, provide your own `PdfJsEngine` implementation that evaluates code
 * in an isolated context (e.g. Node `vm`, a dedicated realm, or a Web Worker).
 */
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
