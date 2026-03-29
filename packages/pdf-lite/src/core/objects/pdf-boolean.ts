import { PdfBooleanToken } from '../tokens/boolean-token.js'
import { PdfToken } from '../tokens/token.js'
import { PdfObject } from './pdf-object.js'

export class PdfBoolean extends PdfObject {
    value: boolean

    constructor(value: boolean) {
        super()
        this.value = value
    }

    protected tokenize(): PdfToken[] {
        return [new PdfBooleanToken(this.value)]
    }

    cloneImpl(): this {
        const cloned = new PdfBoolean(this.value) as this
        return cloned
    }

    toJSON() {
        return { type: 'boolean', value: this.value }
    }
}
