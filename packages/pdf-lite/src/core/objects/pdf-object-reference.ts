import { PdfToken } from '../tokens/token.js'
import { PdfObjectReferenceToken } from '../tokens/object-reference-token.js'
import { PdfObject } from './pdf-object.js'
import { PdfIndirectObject } from './pdf-indirect-object.js'

export interface IPdfObjectResolver {
    resolve(objectNumber: number, generationNumber: number): PdfIndirectObject
}

export class PdfObjectReference<
    T extends PdfIndirectObject = PdfIndirectObject,
> extends PdfObject {
    objectNumber: number
    generationNumber: number
    resolver?: IPdfObjectResolver

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

    cloneImpl(): this {
        const cloned = new PdfObjectReference(
            this.objectNumber,
            this.generationNumber,
        ) as this
        return cloned
    }

    resolve<U extends PdfIndirectObject = T>(
        cls?: new (options: PdfIndirectObject) => U,
    ): U {
        if (!this.resolver) {
            throw new Error(
                `No resolver set for PdfObjectReference '${this.objectNumber} ${this.generationNumber}'`,
            )
        }

        const object = this.resolver.resolve(
            this.objectNumber,
            this.generationNumber,
        ) as U

        if (cls) {
            return object.becomes(cls)
        }

        return object
    }

    get key(): string {
        return `${this.objectNumber}/${this.generationNumber}`
    }
}
