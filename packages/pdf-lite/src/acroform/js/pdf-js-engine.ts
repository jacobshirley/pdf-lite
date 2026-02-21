/**
 * Mirrors the Acrobat `event` object passed to field JavaScript actions.
 */
export interface PdfJsEvent {
    /** The fully-qualified field name that triggered the action. */
    fieldName: string
    /** The current field value at the time of the event. */
    value: string
    /**
     * Whether the value is being committed (true for validate events).
     * Undefined for calculate/format events.
     */
    willCommit?: boolean
    /**
     * Return code. The engine should set this to `false` to signal that the
     * current value should be rejected (e.g. validation failed).
     * Defaults to `true` (accept).
     */
    rc: boolean
    /**
     * The exact change string for keystroke events.
     * Undefined for other event types.
     */
    changeEx?: string
}

/**
 * Interface for a user-supplied JavaScript execution engine.
 *
 * The library never executes JavaScript itself. Instead, when a JS action is
 * encountered it constructs a `PdfJsEvent`, calls `engine.execute`, and then
 * reads `event.rc` to determine whether the action accepted the current value.
 *
 * @example
 * ```ts
 * import vm from 'node:vm'
 *
 * const engine: PdfJsEngine = {
 *   execute(code, event) {
 *     const ctx = vm.createContext({ event })
 *     vm.runInContext(code, ctx)
 *   }
 * }
 * ```
 */
export interface PdfJsEngine {
    execute(code: string, event: PdfJsEvent): void
}
