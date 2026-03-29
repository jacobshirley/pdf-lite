import { PdfObject } from './pdf-object.js'
import { PdfNullToken } from '../tokens/null-token.js'
import { PdfToken } from '../tokens/token.js'

export class PdfNull extends PdfObject {
    static readonly NULL: PdfNull = new PdfNull()

    protected tokenize(): PdfToken[] {
        return [new PdfNullToken()]
    }

    cloneImpl(): this {
        const cloned = new PdfNull() as this
        return cloned
    }

    toJSON() {
        return { type: 'null' }
    }
}
