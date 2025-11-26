import { Ref } from '../ref'
import { PdfStartXRefToken } from '../tokens/start-xref-token'
import { PdfWhitespaceToken } from '../tokens/whitespace-token'
import { PdfNumber } from './pdf-number'
import { PdfObject } from './pdf-object'

export class PdfStartXRef extends PdfObject {
    offset: PdfNumber

    constructor(offset: number | PdfNumber | Ref<number> = -1) {
        // default to -1 for unknown offset
        super()
        this.offset =
            offset instanceof PdfNumber
                ? offset
                : new PdfNumber({ value: offset })
        this.offset.isByteOffset = true
    }

    protected tokenize() {
        const whiteSpaceTokens = this.offset.preTokens
            ? []
            : [PdfWhitespaceToken.NEWLINE]

        return [
            new PdfStartXRefToken(),
            ...whiteSpaceTokens,
            ...this.offset.toTokens(),
        ]
    }

    clone(): this {
        return new PdfStartXRef(this.offset.clone()) as this
    }

    isModified(): boolean {
        return super.isModified() || this.offset.isModified()
    }
}
