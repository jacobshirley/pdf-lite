import { ByteArray } from '../../types.js'
import { concatUint8Arrays } from '../../utils/concatUint8Arrays.js'
import { PdfToken } from '../tokens/token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'

export abstract class PdfObject {
    preTokens?: PdfToken[]
    postTokens?: PdfToken[]

    protected abstract tokenize(): PdfToken[]

    get objectType(): string {
        return this.constructor.name
    }

    toTokens(): PdfToken[] {
        return [
            ...(this.preTokens ?? []),
            ...this.tokenize(),
            ...(this.postTokens ?? []),
        ]
    }

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

    toString(): string {
        let str = ''
        for (const byte of this.toBytes()) {
            str += String.fromCharCode(byte)
        }
        return str
    }

    as<T extends PdfObject>(ctor: new (...args: any[]) => T): T {
        if (this instanceof ctor) {
            return this as T
        }

        throw new Error(
            `Cannot cast object of type ${this.objectType} to ${ctor.name}`,
        )
    }

    abstract clone(): this

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

    addPreToken(token: PdfToken): this {
        if (!this.preTokens) {
            this.preTokens = []
        }
        this.preTokens.push(token)
        return this
    }

    addPostToken(token: PdfToken): this {
        if (!this.postTokens) {
            this.postTokens = []
        }
        this.postTokens.push(token)
        return this
    }
}
