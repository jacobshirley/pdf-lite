import { PdfToken } from '../tokens/token.js'
import { PdfObjectReferenceToken } from '../tokens/object-reference-token.js'
import { PdfObject } from './pdf-object.js'
import { PdfIndirectObject } from './pdf-indirect-object.js'

/**
 * Represents a reference to an indirect PDF object, identified by its object number and generation number.
 * Provides a method to resolve the reference to the actual object using a provided resolver.
 */
export interface PdfObjectResolver {
    /**
     * Resolves a PdfObjectReference to the actual PdfObject it points to.
     * @param ref - The PdfObjectReference to resolve
     * @returns A promise that resolves to the actual PdfObject
     */
    resolve(
        ref: PdfObjectReference,
    ): Promise<PdfIndirectObject<PdfObject> | undefined>
}

export class PdfObjectReference extends PdfObject {
    objectNumber: number
    generationNumber: number
    resolver?: PdfObjectResolver

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

    async resolve<T extends PdfObject>(): Promise<PdfIndirectObject<T>> {
        if (!this.resolver) {
            throw new Error(
                `Cannot resolve object reference ${this.objectNumber} ${this.generationNumber} R: no resolver provided`,
            )
        }

        const resolved = await this.resolver.resolve(this)
        if (!resolved) {
            throw new Error(
                `Unable to resolve reference: ${this.objectNumber} ${this.generationNumber}`,
            )
        }

        return resolved.as(PdfIndirectObject)
    }
}
