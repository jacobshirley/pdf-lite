import { needsCentralWhitespace } from '../../utils/needsCentralWhitespace.js'
import { PdfObjectReference } from '../index.js'
import { PdfEndArrayToken } from '../tokens/end-array-token.js'
import { PdfStartArrayToken } from '../tokens/start-array-token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfIndirectObject } from './pdf-indirect-object.js'
import { PdfObject } from './pdf-object.js'

export class PdfArray<T extends PdfObject = PdfObject>
    extends PdfObject
    implements Iterable<T>
{
    items: T[]
    innerTokens: PdfWhitespaceToken[] = []

    constructor(items: T[] = []) {
        super()
        this.items = items
    }

    static refs(items: PdfIndirectObject[]): PdfArray<PdfObjectReference> {
        return new PdfArray(items.map((item) => item.reference))
    }

    get length(): number {
        return this.items.length
    }

    push(item: T) {
        this.items.push(item)
    }

    override get isTrailingDelimited(): boolean {
        return true
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

            if (
                index !== this.items.length - 1 &&
                postTokens.length === 0 &&
                needsCentralWhitespace(item, this.items[index + 1])
            ) {
                postTokens.push(PdfWhitespaceToken.SPACE)
            }

            return [...preTokens, ...tokens, ...postTokens]
        })

        return [
            new PdfStartArrayToken(),
            ...this.innerTokens,
            ...items,
            new PdfEndArrayToken(),
        ]
    }

    cloneImpl(): this {
        const cloned = new PdfArray(this.items.map((x) => x.clone())) as this
        return cloned
    }

    setModified(modified?: boolean): void {
        super.setModified(modified)
        this.items.forEach((item) => item.setModified(modified))
    }

    isModified(): boolean {
        return (
            super.isModified() || this.items.some((item) => item.isModified())
        )
    }

    setImmutable(immutable?: boolean): void {
        super.setImmutable(immutable)
        this.items.forEach((item) => item.setImmutable(immutable))
    }

    refs(): PdfArray<PdfObjectReference> {
        const refs = this.items.map((item) => {
            if (item instanceof PdfIndirectObject) {
                return item.reference
            } else {
                throw new Error(
                    'Cannot get reference of non-indirect object in array',
                )
            }
        })
        return new PdfArray(refs)
    }

    [Symbol.iterator](): Iterator<T> {
        return this.items[Symbol.iterator]()
    }
}
