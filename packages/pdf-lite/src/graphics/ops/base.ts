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
 */
export class ContentOp {
    bytes: Uint8Array

    constructor(input: string | Uint8Array = '') {
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

    toString(): string {
        return this.raw
    }

    toBytes(): Uint8Array {
        return this.bytes
    }

    private static stringToLatin1Bytes(value: string): Uint8Array {
        const out = new Uint8Array(value.length)
        for (let i = 0; i < value.length; i++) {
            out[i] = value.charCodeAt(i) & 0xff
        }
        return out
    }

    private static latin1BytesToString(bytes: Uint8Array): string {
        // Avoid `String.fromCharCode(...bytes)` because large ops would
        // exceed the call-stack argument limit.
        let out = ''
        for (let i = 0; i < bytes.length; i++) {
            out += String.fromCharCode(bytes[i])
        }
        return out
    }
}
