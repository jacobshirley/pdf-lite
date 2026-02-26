import { needsPreWhitespace } from '../../utils/needsPreWhitespace.js'
import { PdfObjectReference } from '../index.js'
import { PdfEndArrayToken } from '../tokens/end-array-token.js'
import { PdfStartArrayToken } from '../tokens/start-array-token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfBoolean } from './pdf-boolean.js'
import { PdfDictionary } from './pdf-dictionary.js'
import { PdfHexadecimal } from './pdf-hexadecimal.js'
import { PdfIndirectObject } from './pdf-indirect-object.js'
import { PdfName } from './pdf-name.js'
import { PdfNull } from './pdf-null.js'
import { PdfNumber } from './pdf-number.js'
import { PdfObject } from './pdf-object.js'
import { PdfString } from './pdf-string.js'

export type PdfArrayItem =
    | PdfString
    | PdfName
    | PdfArray
    | PdfDictionary
    | PdfNumber
    | PdfNull
    | PdfHexadecimal
    | PdfBoolean
    | PdfIndirectObject
    | PdfObjectReference

function formatArrayItem(item: PdfArrayItem): PdfArrayItem {
    if (item instanceof PdfIndirectObject) {
        return item.reference
    } else {
        return item
    }
}

export class PdfArray<T extends PdfObject = PdfObject> extends PdfObject {
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

    protected tokenize() {
        const items = this.items.flatMap((item, index) => {
            const tokens = item.toTokens()

            const preTokens = item.preTokens
                ? []
                : index === 0
                  ? [PdfWhitespaceToken.SPACE]
                  : []

            if (needsPreWhitespace(this.items[index - 1], item)) {
                preTokens.push(PdfWhitespaceToken.SPACE)
            }

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
}
