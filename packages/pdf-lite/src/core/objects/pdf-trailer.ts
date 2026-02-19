import { Ref } from '../ref.js'
import { PdfByteOffsetToken } from '../tokens/byte-offset-token.js'
import { PdfToken } from '../tokens/token.js'
import { PdfTrailerToken } from '../tokens/trailer-token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfArray } from './pdf-array.js'
import { PdfDictionary } from './pdf-dictionary.js'
import { PdfHexadecimal } from './pdf-hexadecimal.js'
import { PdfNumber } from './pdf-number.js'
import { PdfObject } from './pdf-object.js'
import { PdfObjectReference } from './pdf-object-reference.js'

export type PdfTrailerEntries = {
    Size: PdfNumber
    Root?: PdfObjectReference
    Info?: PdfObjectReference
    Prev?: PdfNumber
    XRefStm?: PdfNumber
    Encrypt?: PdfObjectReference
    ID?: PdfArray<PdfHexadecimal>
}

export type PdfTrailerDictionary = PdfDictionary<PdfTrailerEntries>

export class PdfTrailer extends PdfObject {
    dict: PdfTrailerDictionary
    offset: Ref<number> = new Ref(0)

    constructor(entries: PdfTrailerEntries | PdfDictionary<PdfTrailerEntries>) {
        super()
        this.dict =
            entries instanceof PdfDictionary
                ? entries
                : new PdfDictionary(entries)
    }

    protected tokenize(): PdfToken[] {
        return [
            new PdfByteOffsetToken(this.offset),
            new PdfTrailerToken(),
            ...(this.dict.preTokens ? [] : [PdfWhitespaceToken.NEWLINE]),
            ...this.dict.toTokens(),
        ]
    }

    cloneImpl(): this {
        const cloned = new PdfTrailer(this.dict.clone()) as this
        return cloned
    }

    isModified(): boolean {
        return (
            super.isModified() ||
            this.dict.isModified() ||
            this.offset.isModified
        )
    }
}
