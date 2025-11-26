import { PdfObject } from './pdf-object'
import { PdfNullToken } from '../tokens/null-token'
import { PdfToken } from '../tokens/token'

export class PdfNull extends PdfObject {
    static readonly NULL: PdfNull = new PdfNull()

    protected tokenize() {
        return [new PdfNullToken()]
    }

    clone(): this {
        return new PdfNull() as this
    }
}
