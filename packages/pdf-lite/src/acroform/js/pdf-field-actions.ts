import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfJavaScriptAction } from './pdf-javascript-action.js'
import type { PdfJsEngine } from './pdf-js-engine.js'

export class PdfFieldActions extends PdfDictionary {
    private readonly activateDict?: PdfDictionary
    readonly engine?: PdfJsEngine

    constructor(
        dict: PdfDictionary,
        options?: {
            activateDict?: PdfDictionary
            engine?: PdfJsEngine
        },
    ) {
        super()
        this.copyFrom(dict)
        this.activateDict = options?.activateDict
        this.engine = options?.engine
    }

    private _resolve(key: string): PdfJavaScriptAction | null {
        const entry = this.get(key)
        if (!entry) return null
        let actionDict: PdfDictionary | undefined
        if (entry instanceof PdfObjectReference) {
            const resolved = entry.resolve()
            if (resolved?.content instanceof PdfDictionary) {
                actionDict = resolved.content
            }
        } else if (entry instanceof PdfDictionary) {
            actionDict = entry
        }
        if (!actionDict) return null
        return actionDict.becomes(PdfJavaScriptAction, {
            engine: this.engine,
        })
    }

    get keystroke(): PdfJavaScriptAction | null {
        return this._resolve('K')
    }

    get validate(): PdfJavaScriptAction | null {
        return this._resolve('V')
    }

    get calculate(): PdfJavaScriptAction | null {
        return this._resolve('C')
    }

    get format(): PdfJavaScriptAction | null {
        return this._resolve('F')
    }

    get activate(): PdfJavaScriptAction | null {
        if (!this.activateDict) return null
        return this.activateDict.becomes(PdfJavaScriptAction, {
            engine: this.engine,
        })
    }
}
