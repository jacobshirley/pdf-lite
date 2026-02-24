import { PdfEndObjectToken } from '../tokens/end-object-token.js'
import { PdfStartObjectToken } from '../tokens/start-object-token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfNull } from './pdf-null.js'
import { PdfObject } from './pdf-object.js'
import { PdfObjectReference } from './pdf-object-reference.js'
import { PdfStream } from './pdf-stream.js'
import { Ref } from '../ref.js'
import { PdfByteOffsetToken } from '../tokens/byte-offset-token.js'

export type PdfIndirectObjectOptions<T extends PdfObject = PdfObject> =
    | {
          objectNumber?: number
          generationNumber?: number
          content?: T
          offset?: number | Ref<number>
          encryptable?: boolean
          compressed?: boolean
      }
    | T
    | PdfIndirectObject
    | undefined

export class PdfIndirectObject<
    T extends PdfObject = PdfObject,
> extends PdfObject {
    static readonly MAX_ORDER_INDEX = 2147483647

    objectNumber: number
    generationNumber: number
    content: T
    offset: Ref<number>
    encryptable?: boolean
    compressed?: boolean
    orderIndex?: number

    constructor(options?: PdfIndirectObjectOptions<T>) {
        if (options instanceof PdfIndirectObject) {
            super()
            this.objectNumber = options.objectNumber
            this.generationNumber = options.generationNumber
            this.content = options.content.clone() as T
            this.offset = options.offset.clone()
            this.compressed = options.compressed
            return
        }

        if (options instanceof PdfObject) {
            super()
            this.objectNumber = -1
            this.generationNumber = 0
            this.content = options
            this.offset = new Ref(0)
            return
        }

        super()
        this.objectNumber = options?.objectNumber ?? -1
        this.generationNumber = options?.generationNumber ?? 0
        this.content = options?.content ?? (new PdfNull() as unknown as T)
        this.offset =
            options?.offset instanceof Ref
                ? options.offset
                : new Ref(options?.offset ?? 0)
        this.encryptable = options?.encryptable
        this.compressed = options?.compressed
    }

    get reference(): PdfObjectReference {
        return new Proxy(this as any, {
            get: (target, prop) => {
                const value = new PdfObjectReference(
                    target.objectNumber,
                    target.generationNumber,
                )
                if (prop === 'resolve') {
                    return () => target // resolve returns the indirect object itself, not the content, since it's already a reference to the content. This allows for chaining .reference.resolve() to get back to the indirect object when needed.
                } else if (prop === 'objectNumber') {
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

    copyFrom(other: PdfIndirectObject) {
        this.objectNumber = other.objectNumber
        this.generationNumber = other.generationNumber
        this.content = other.content.clone() as T
        this.offset = other.offset.clone()
        this.modified = true
    }

    cloneImpl(): this {
        return new PdfIndirectObject({
            objectNumber: this.objectNumber,
            generationNumber: this.generationNumber,
            content: this.content.clone(),
            offset: this.offset.resolve(),
            encryptable: this.encryptable,
            compressed: this.compressed,
        }) as this
    }

    order(): number {
        return this.orderIndex ?? 0
    }

    setModified(modified = true): void {
        super.setModified(modified)
        this.content.setModified(modified)
        this.offset.setModified(modified)
    }

    isModified(): boolean {
        return (
            super.isModified() ||
            this.content.isModified() ||
            this.offset.isModified()
        )
    }

    setImmutable(immutable?: boolean): void {
        super.setImmutable(immutable)
        this.content.setImmutable(immutable)
        this.offset.setImmutable(immutable)
    }

    becomes<T>(cls: new (options: PdfIndirectObject) => T): T {
        if (this instanceof cls) {
            return this as T
        }
        Object.setPrototypeOf(this, cls.prototype)
        return this as unknown as T
    }

    resolve() {
        return this
    }
}
