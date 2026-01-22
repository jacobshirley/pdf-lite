import { PdfEndArrayToken } from '../tokens/end-array-token.js'
import { PdfStartArrayToken } from '../tokens/start-array-token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfArray<T extends PdfObject = PdfObject> extends PdfObject {
    items: T[]
    innerTokens: PdfWhitespaceToken[] = []

    constructor(items: T[] = []) {
        super()
        this.items = items
    }

    get length(): number {
        return this.items.length
    }

    push(item: T) {
        this.items.push(item)
    }

    protected tokenize() {
        const items = this.items.flatMap((item, index) => {
            const tokens = item.toTokens()

            const preTokens = item.preTokens
                ? []
                : index === 0
                  ? [PdfWhitespaceToken.SPACE]
                  : []
            const postTokens = item.postTokens ? [] : [PdfWhitespaceToken.SPACE]

            return [...preTokens, ...tokens, ...postTokens]
        })

        return [
            new PdfStartArrayToken(),
            ...this.innerTokens,
            ...items,
            new PdfEndArrayToken(),
        ]
    }

    clone(): this {
        return new PdfArray(this.items.map((x) => x.clone())) as this
    }

    isModified(): boolean {
        return (
            super.isModified() || this.items.some((item) => item.isModified())
        )
    }
}
