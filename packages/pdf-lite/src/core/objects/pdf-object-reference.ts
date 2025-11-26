import { PdfToken } from '../tokens/token'
import { PdfObjectReferenceToken } from '../tokens/object-reference-token'
import { PdfObject } from './pdf-object'

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
