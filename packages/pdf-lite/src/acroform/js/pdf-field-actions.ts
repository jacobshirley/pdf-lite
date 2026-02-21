import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfJavaScriptAction } from './pdf-javascript-action.js'

/**
 * Wraps a field's `/AA` (Additional Actions) dictionary and optionally its
 * `/A` (primary activation action) dictionary, exposing each trigger as a
 * typed `PdfJavaScriptAction`.
 *
 * PDF spec key mapping for field `/AA`:
 * - `K` → keystroke (fires on each key press)
 * - `V` → validate (fires when value is committed)
 * - `C` → calculate (fires after any field in the doc changes)
 * - `F` → format (fires when the field value is to be displayed)
 */
export class PdfFieldActions {
    private _aa: PdfDictionary
    private _a: PdfDictionary | null

    constructor(aa: PdfDictionary, a?: PdfDictionary | null) {
        this._aa = aa
        this._a = a ?? null
    }

    private _getAction(key: string): PdfJavaScriptAction | null {
        const entry = this._aa.get(key)?.as(PdfDictionary)
        if (!entry) return null
        return new PdfJavaScriptAction(entry)
    }

    /** Keystroke action (`/AA` → `K`). Fires on each key press. */
    get keystroke(): PdfJavaScriptAction | null {
        return this._getAction('K')
    }

    /** Validate action (`/AA` → `V`). Fires when the value is committed. */
    get validate(): PdfJavaScriptAction | null {
        return this._getAction('V')
    }

    /** Calculate action (`/AA` → `C`). Fires after any field value changes. */
    get calculate(): PdfJavaScriptAction | null {
        return this._getAction('C')
    }

    /** Format action (`/AA` → `F`). Fires when the displayed value is rendered. */
    get format(): PdfJavaScriptAction | null {
        return this._getAction('F')
    }

    /**
     * Primary activation action from the field's `/A` dictionary.
     * Typically used by push-button fields to trigger an action on click.
     */
    get activate(): PdfJavaScriptAction | null {
        if (!this._a) return null
        return new PdfJavaScriptAction(this._a)
    }
}
