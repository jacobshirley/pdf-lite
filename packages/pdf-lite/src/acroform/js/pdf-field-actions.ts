import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfJavaScriptAction } from './pdf-javascript-action.js'

export class PdfFieldActions {
    private readonly dict: PdfDictionary
    private readonly activateDict?: PdfDictionary

    constructor(dict: PdfDictionary, activateDict?: PdfDictionary) {
        this.dict = dict
        this.activateDict = activateDict
    }

    private _resolve(key: string): PdfJavaScriptAction | null {
        const entry = this.dict.get(key)
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
        return new PdfJavaScriptAction(actionDict)
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
        return new PdfJavaScriptAction(this.activateDict)
    }
}
