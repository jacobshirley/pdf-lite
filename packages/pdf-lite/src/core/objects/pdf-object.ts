import { ByteArray } from '../../types.js'
import { concatUint8Arrays } from '../../utils/concatUint8Arrays.js'
import { PdfToken } from '../tokens/token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'

export abstract class PdfObject {
    /** Optional tokens to prepend or append during serialization */
    preTokens?: PdfToken[]
    /** Optional tokens to prepend or append during serialization */
    postTokens?: PdfToken[]
    /** Indicates whether the object has been modified. By default, assume it has been modified because it's a new object */
    protected modified: boolean = true
    /** Indicates whether the object is immutable (cannot be modified) */
    protected immutable: boolean = false
    /** Tokenizes the object into an array of PdfTokens */
    protected abstract tokenize(): PdfToken[]
    /** Cached byte representation of the object, if available */
    protected cachedTokens?: PdfToken[]

    /** The type of this PDF object */
    get objectType(): string {
        return this.constructor.name
    }

    /** Indicates whether the object has been modified. Override this method if the modified state is determined differently */
    isModified(): boolean {
        return this.modified
    }

    /** Sets the modified state of the object. Override this method if the modified state is determined differently */
    setModified(modified: boolean = true): void {
        this.modified = modified
    }

    /** Indicates whether the object is immutable (cannot be modified) */
    isImmutable(): boolean {
        return this.immutable
    }

    /** Sets the immutable state of the object */
    setImmutable(immutable: boolean = true): void {
        if (immutable === this.immutable) {
            return
        }

        this.immutable = immutable

        if (immutable) {
            this.cachedTokens = this.toTokens()
        } else {
            this.cachedTokens = undefined
        }
    }

    /** Converts the object to an array of PdfTokens, including any pre or post tokens */
    toTokens(): PdfToken[] {
        if (this.cachedTokens) {
            return this.cachedTokens
        }
        return [
            ...(this.preTokens ?? []),
            ...this.tokenize(),
            ...(this.postTokens ?? []),
        ]
    }

    /** Converts the object to a ByteArray, optionally padding to a specified length */
    toBytes(padTo?: number): ByteArray {
        const tokens = this.toTokens()

        const byteArray = concatUint8Arrays(
            ...tokens.map((token) => token.toBytes()),
        )
        if (padTo) {
            const paddedArray = new Uint8Array(padTo)
            paddedArray.set(byteArray)
            return paddedArray
        }
        return byteArray
    }

    /** Converts the object to a string representation */
    toString(): string {
        let str = ''
        for (const byte of this.toBytes()) {
            str += String.fromCharCode(byte)
        }
        return str
    }

    /** Attempts to cast the object to a specific PdfObject subclass */
    as<T extends PdfObject>(ctor: new (...args: any[]) => T): T {
        if (this instanceof ctor) {
            return this as T
        }

        throw new Error(
            `Cannot cast object of type ${this.objectType} to ${ctor.name}`,
        )
    }

    /** Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly */
    protected abstract cloneImpl(): this

    /** Creates a deep clone of the object */
    clone(): this {
        const cloned = this.cloneImpl()
        cloned.setModified(this.modified)
        return cloned
    }

    /** Compares this object to another for equality based on their token representations */
    equals(other?: PdfObject): boolean {
        if (!other) {
            return false
        }

        const tokensA = this.toTokens().filter(
            (x) => !(x instanceof PdfWhitespaceToken),
        )

        const tokensB = other
            .toTokens()
            .filter((x) => !(x instanceof PdfWhitespaceToken))

        if (tokensA.length !== tokensB.length) {
            return false
        }

        for (let i = 0; i < tokensA.length; i++) {
            const tokenA = tokensA[i]
            const tokenB = tokensB[i]

            if (!tokenA.equals(tokenB)) {
                return false
            }
        }

        return true
    }
}
