/**
 * Lightweight proxy objects that provide the XFA JavaScript API surface
 * needed for executing initialization scripts in a sandboxed environment.
 */

/** Result harvested from a field proxy after script execution */
export interface XfaScriptResult {
    /** Items added via addItem() — for dropdown population */
    addedItems?: Array<{ displayText: string; exportValue: string }>
    /** Raw value set by script */
    rawValue?: string
    /** Presence changed by script (visible/hidden/inactive) */
    presence?: string
    /** Access changed by script (open/protected) */
    access?: string
}

/**
 * Proxy for `this` when executing field-level scripts.
 * Implements the minimum XFA field API surface.
 */
export class XfaFieldProxy {
    name: string
    rawValue: string | null = null
    presence: string = 'visible'
    access: string = 'open'
    somExpression: string

    private _items: Array<{ displayText: string; exportValue: string }> = []
    private _initialRawValue: string | null = null

    constructor(
        name: string,
        fullPath: string,
        initialValue?: string | null,
    ) {
        this.name = name
        this.somExpression = fullPath
        this.rawValue = initialValue ?? null
        this._initialRawValue = this.rawValue
    }

    /** XFA addItem(displayText, exportValue) — adds dropdown option */
    addItem(displayText: string, exportValue?: string): void {
        this._items.push({
            displayText: String(displayText),
            exportValue: exportValue != null ? String(exportValue) : String(displayText),
        })
    }

    /** XFA clearItems() — clears all dropdown options */
    clearItems(): void {
        this._items = []
    }

    /** Whether the field has no value */
    get isNull(): boolean {
        return this.rawValue == null || this.rawValue === ''
    }

    /** Harvest results after script execution */
    getResult(): XfaScriptResult | null {
        const result: XfaScriptResult = {}
        let hasChanges = false

        if (this._items.length > 0) {
            result.addedItems = [...this._items]
            hasChanges = true
        }

        if (this.rawValue !== this._initialRawValue) {
            result.rawValue =
                this.rawValue != null ? String(this.rawValue) : ''
            hasChanges = true
        }

        if (this.presence !== 'visible') {
            result.presence = this.presence
            hasChanges = true
        }

        if (this.access !== 'open') {
            result.access = this.access
            hasChanges = true
        }

        return hasChanges ? result : null
    }
}

/**
 * Proxy for `xfa.host` — stub implementation.
 * messageBox and other host methods are no-ops.
 */
export class XfaHostProxy {
    name = 'XFA'
    version = '11.0'
    numPages = 1

    messageBox(_msg: string, _title?: string, _icon?: number, _type?: number): number {
        return 4 // simulate "Yes" response
    }

    setFocus(_somExpr: string): void {
        // no-op
    }

    resetData(): void {
        // no-op
    }

    print(): void {
        // no-op
    }
}

/**
 * Proxy for a subform node — provides minimal count/name for
 * scripts that check `_OsobaFizyczna.count` etc.
 */
export class XfaSubformProxy {
    name: string
    count: number

    constructor(name: string, count: number = 0) {
        this.name = name
        this.count = count
    }

    /** Stub for setInstances */
    setInstances(_n: number): void {
        // no-op during initialization
    }

    /** Stub for addInstance */
    addInstance(_n?: number): void {
        // no-op during initialization
    }

    /** Stub for removeInstance */
    removeInstance(_n: number): void {
        // no-op during initialization
    }
}
