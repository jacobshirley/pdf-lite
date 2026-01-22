import { PdfObject } from './pdf-object.js'
import { PdfNullToken } from '../tokens/null-token.js'

export class PdfNull extends PdfObject {
    static readonly NULL: PdfNull = new PdfNull()

    protected tokenize() {
        return [new PdfNullToken()]
    }

    clone(): this {
        return new PdfNull() as this
    }
}
