import { Ref } from '../ref'
import { PdfByteOffsetToken } from '../tokens/byte-offset-token'
import { PdfToken } from '../tokens/token'
import { PdfTrailerToken } from '../tokens/trailer-token'
import { PdfWhitespaceToken } from '../tokens/whitespace-token'
import { PdfArray } from './pdf-array'
import { PdfDictionary } from './pdf-dictionary'
import { PdfHexadecimal } from './pdf-hexadecimal'
import { PdfNumber } from './pdf-number'
import { PdfObject } from './pdf-object'
import { PdfObjectReference } from './pdf-object-reference'

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

    clone(): this {
        return new PdfTrailer(this.dict.clone()) as this
    }
}
