import { PdfToken } from '../tokens/token.js'
import { PdfObjectReferenceToken } from '../tokens/object-reference-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfObjectReference extends PdfObject {
    objectNumber: number
    generationNumber: number

    constructor(objectNumber: number, generationNumber: number) {
        super()
        this.objectNumber = objectNumber
        this.generationNumber = generationNumber
    }

    protected tokenize(): PdfToken[] {
        return [
            new PdfObjectReferenceToken(
                this.objectNumber,
                this.generationNumber,
            ),
        ]
    }

    clone(): this {
        return new PdfObjectReference(
            this.objectNumber,
            this.generationNumber,
        ) as this
    }
}
