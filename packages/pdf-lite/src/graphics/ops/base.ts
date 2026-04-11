import { PdfHexadecimal, PdfName, PdfNumber, PdfString } from '../../core'
import { ByteArray } from '../../types'

/**
 * A single operand value parsed out of a content-stream op.
 *
 * Arrays (as produced by the `TJ` operator) are represented as a nested
 * array of operand values so the structural shape matches the PDF.
 */
export type ContentOpOperand =
    | PdfString
    | PdfHexadecimal
    | PdfName
    | PdfNumber
    | ContentOpOperand[]

/**
 * A single PDF content-stream operation.
 *
 * Internally stored as a `Uint8Array` of the original bytes so that
 * unmodified ops can be re-serialised byte-exactly (preserving original
 * whitespace, newlines, and any non-ASCII bytes inside literal/hex strings).
 *
 * The `raw` accessor is a latin-1 (1:1 byte ↔ code unit) view of those
 * bytes. Assigning to `raw` re-encodes each code unit as a single byte,
 * which is the right behaviour for subclass setters that rebuild the op
 * text from structured fields (e.g. `this.raw = \`${x} ${y} m\``).
 *
 * `operands` is the list of typed operand values for this op as emitted
 * by the content-stream tokeniser. When an op is constructed from a raw
 * string (subclass setters, `ShowTextOp.create`, etc.) this list is left
 * empty — subclasses should prefer reading structured values from
 * `operands` when available and fall back to `parts()` parsing otherwise.
 */
export class ContentOp {
    bytes: ByteArray
    operands: ContentOpOperand[] = []

    constructor(input: string | ByteArray = '') {
        if (typeof input === 'string') {
            this.bytes = ContentOp.stringToLatin1Bytes(input)
        } else {
            this.bytes = input
        }
    }

    get raw(): string {
        return ContentOp.latin1BytesToString(this.bytes)
    }

    set raw(value: string) {
        this.bytes = ContentOp.stringToLatin1Bytes(value)
        // Any cached typed operands now refer to stale bytes — subsequent
        // accessors fall back to string-level `parts()` parsing.
        this.operands = []
    }

    parts(): {
        operator: string
        operands: string[]
    } {
        const raw = this.raw
        if (!raw) return { operator: '', operands: [] }
        // Split on any run of PDF whitespace — the raw bytes may contain
        // tabs or newlines from the original stream, not just spaces.
        const tokens = raw.trim().split(/[\s\0]+/)
        const operator = tokens[tokens.length - 1]
        const operands = tokens.slice(0, -1)
        return { operator, operands }
    }

    /**
     * Read a numeric operand at `index`, preferring the typed value
     * emitted by the tokeniser and falling back to `parts()` for ops
     * constructed from a raw string (via setters or `create`).
     */
    protected numberOperand(index: number): number {
        const op = this.operands[index]
        if (op instanceof PdfNumber) return op.value
        const s = this.parts().operands[index]
        return s === undefined ? NaN : parseFloat(s)
    }

    /**
     * Read a name operand at `index` and return the unescaped name
     * string (without the leading `/`).
     */
    protected nameOperand(index: number): string {
        const op = this.operands[index]
        if (op instanceof PdfName) return op.value
        const s = this.parts().operands[index]
        return s === undefined ? '' : s.startsWith('/') ? s.slice(1) : s
    }

    /**
     * Read a string operand (literal or hex) at `index` as its typed
     * `PdfString` / `PdfHexadecimal` form, or `null` if not present.
     *
     * Falls back to a string-level scan of `raw` when the tokeniser has
     * not populated `operands` (e.g. ops constructed via a subclass
     * setter or `static create`). The fallback only handles the common
     * case of a single string operand; callers needing binary-safe
     * byte-exact parsing must be constructed via the tokeniser.
     */
    protected stringOperandAt(
        index: number,
    ): PdfString | PdfHexadecimal | null {
        const op = this.operands[index]
        if (op instanceof PdfString || op instanceof PdfHexadecimal) return op
        // Fallback for ops constructed from raw strings: scan the raw
        // text for the first literal or hex string. All ops that call
        // this today (`Tj`, `'`, `"`) have exactly one string operand,
        // so the index is effectively ignored in the fallback path.
        return ContentOp.extractFirstStringOperand(this.raw)
    }

    private static extractFirstStringOperand(
        raw: string,
    ): PdfString | PdfHexadecimal | null {
        const trimmed = raw.trim()
        const hexStart = trimmed.indexOf('<')
        const litStart = trimmed.indexOf('(')
        const useHex =
            hexStart !== -1 &&
            (litStart === -1 || hexStart < litStart) &&
            trimmed[hexStart + 1] !== '<'

        if (useHex) {
            const end = trimmed.indexOf('>', hexStart + 1)
            if (end === -1) return null
            return new PdfHexadecimal(trimmed.slice(hexStart + 1, end))
        }

        if (litStart === -1) return null

        let depth = 1
        let j = litStart + 1
        while (j < trimmed.length && depth > 0) {
            const c = trimmed[j]
            if (c === '\\') {
                j += 2
                continue
            }
            if (c === '(') depth++
            else if (c === ')') depth--
            if (depth === 0) break
            j++
        }
        return new PdfString(trimmed.slice(litStart + 1, j))
    }

    toString(): string {
        return this.raw
    }

    toBytes(): ByteArray {
        return this.bytes
    }

    private static stringToLatin1Bytes(value: string): ByteArray {
        const out = new Uint8Array(value.length)
        for (let i = 0; i < value.length; i++) {
            out[i] = value.charCodeAt(i) & 0xff
        }
        return out
    }

    private static latin1BytesToString(bytes: ByteArray): string {
        // Avoid `String.fromCharCode(...bytes)` because large ops would
        // exceed the call-stack argument limit.
        let out = ''
        for (let i = 0; i < bytes.length; i++) {
            out += String.fromCharCode(bytes[i])
        }
        return out
    }
}
