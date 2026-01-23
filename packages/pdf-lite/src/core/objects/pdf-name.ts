import { PdfNameToken } from '../tokens/name-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfName<T extends string = string> extends PdfObject {
    value: T

    constructor(value: T) {
        super()
        this.value = value
    }

    protected tokenize() {
        return [new PdfNameToken(this.value)]
    }

    clone(): this {
        return new PdfName(this.value) as this
    }
}
