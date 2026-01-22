import { PdfBooleanToken } from '../tokens/boolean-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfBoolean extends PdfObject {
    value: boolean

    constructor(value: boolean) {
        super()
        this.value = value
    }

    protected tokenize() {
        return [new PdfBooleanToken(this.value)]
    }

    clone(): this {
        return new PdfBoolean(this.value) as this
    }
}
