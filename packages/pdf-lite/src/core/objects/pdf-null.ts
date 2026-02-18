import { PdfObject } from './pdf-object.js'
import { PdfNullToken } from '../tokens/null-token.js'

export class PdfNull extends PdfObject {
    static readonly NULL: PdfNull = new PdfNull()

    protected tokenize() {
        return [new PdfNullToken()]
    }

    cloneImpl(): this {
        const cloned = new PdfNull() as this
        return cloned
    }
}
