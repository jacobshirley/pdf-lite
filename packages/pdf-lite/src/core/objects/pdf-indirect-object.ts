import { PdfEndObjectToken } from '../tokens/end-object-token'
import { PdfStartObjectToken } from '../tokens/start-object-token'
import { PdfWhitespaceToken } from '../tokens/whitespace-token'
import { PdfNull } from './pdf-null'
import { PdfObject } from './pdf-object'
import { PdfObjectReference } from './pdf-object-reference'
import { PdfStream } from './pdf-stream'
import { Ref } from '../ref'
import { PdfByteOffsetToken } from '../tokens/byte-offset-token'

export class PdfIndirectObject<
    T extends PdfObject = PdfObject,
> extends PdfObjectReference {
    static readonly MAX_ORDER_INDEX = 2147483647

    content: T
    offset: Ref<number>
    encryptable?: boolean
    orderIndex?: number

    constructor(
        options:
            | {
                  objectNumber?: number
                  generationNumber?: number
                  content: T
                  offset?: number | Ref<number>
                  encryptable?: boolean
              }
            | T,
    ) {
        if (options instanceof PdfObject) {
            super(-1, 0)
            this.content = options
            this.offset = new Ref(0)
            return
        }

        super(options.objectNumber ?? -1, options.generationNumber ?? 0)
        this.content = options.content
        this.offset =
            options.offset instanceof Ref
                ? options.offset
                : new Ref(options.offset ?? 0)
        this.encryptable = options.encryptable
    }

    get reference(): PdfObjectReference {
        return new Proxy(this, {
            get: (target, prop) => {
                const value = new PdfObjectReference(
                    target.objectNumber,
                    target.generationNumber,
                )
                if (prop === 'objectNumber') {
                    return target.objectNumber
                } else if (prop === 'generationNumber') {
                    return target.generationNumber
                } else {
                    return value[prop as keyof PdfObjectReference]
                }
            },
        })
    }

    isEncryptable() {
        if (this.encryptable === undefined) {
            if (
                this.content instanceof PdfStream &&
                this.content.isType('XRef')
            ) {
                return false
            }
        }

        return this.encryptable ?? true
    }

    static createPlaceholder<T extends PdfObject>(
        objectNumber?: number,
        generationNumber?: number,
        content?: T,
    ): PdfIndirectObject<T extends unknown ? PdfNull : T> {
        return new PdfIndirectObject({
            objectNumber: objectNumber ?? -1,
            generationNumber: generationNumber ?? 0,
            content: content ?? (new PdfNull() as any),
            offset: -1,
        })
    }

    inPdf() {
        return this.objectNumber >= 1
    }

    matchesReference(ref?: PdfObjectReference) {
        if (!ref) {
            return false
        }
        return (
            this.objectNumber === ref.objectNumber &&
            this.generationNumber === ref.generationNumber
        )
    }

    protected tokenize() {
        return [
            new PdfByteOffsetToken(this.offset),
            new PdfStartObjectToken(this.objectNumber, this.generationNumber),
            ...(this.content.preTokens ? [] : [PdfWhitespaceToken.NEWLINE]),
            ...this.content.toTokens(),
            ...(this.content.postTokens ? [] : [PdfWhitespaceToken.NEWLINE]),
            new PdfEndObjectToken(),
        ]
    }

    clone(): this {
        return new PdfIndirectObject({
            objectNumber: this.objectNumber,
            generationNumber: this.generationNumber,
            content: this.content.clone(),
            offset: this.offset.resolve(),
        }) as this
    }

    order(): number {
        return this.orderIndex ?? 0
    }
}
