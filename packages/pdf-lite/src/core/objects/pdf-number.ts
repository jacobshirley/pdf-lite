import { Ref } from '../ref.js'
import { PdfNumberToken } from '../tokens/number-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfNumber extends PdfObject {
    #value: Ref<number>
    padTo: number
    decimalPlaces: number
    isByteOffset: boolean = false

    constructor(
        options:
            | {
                  value: number | Ref<number>
                  padTo?: number
                  decimalPlaces?: number
              }
            | number
            | Ref<number>
            | PdfNumber = 0,
    ) {
        super()
        if (options instanceof Ref) {
            this.#value = options
            this.padTo = 0
            this.decimalPlaces = 0
        } else if (options instanceof PdfNumber) {
            this.#value = options.ref
            this.padTo = options.padTo
            this.decimalPlaces = options.decimalPlaces
            this.preTokens = options.preTokens
            this.postTokens = options.postTokens
        } else if (typeof options === 'number') {
            this.#value = new Ref(options)
            this.padTo = 0
            this.decimalPlaces = 0
        } else {
            this.#value =
                typeof options.value === 'number'
                    ? new Ref(options.value)
                    : options.value
            this.padTo = options.padTo ?? 0
            this.decimalPlaces = options.decimalPlaces ?? 0
        }

        if (
            this.value === Number.POSITIVE_INFINITY ||
            this.value === Number.NEGATIVE_INFINITY
        ) {
            throw new Error('PDF numbers cannot be infinite')
        }
    }

    get ref() {
        return this.#value
    }

    get value() {
        return this.#value.resolve()
    }

    set value(value: number) {
        this.#value.update(value)
    }

    onChange(callback: (value: number) => void): void {
        this.#value.onUpdate(callback)
    }

    toToken(): PdfNumberToken {
        return new PdfNumberToken({
            value: this.#value,
            padTo: this.padTo,
            decimalPlaces: this.decimalPlaces,
            isByteToken: this.isByteOffset,
        })
    }

    protected tokenize() {
        return [this.toToken()]
    }

    cloneImpl(): this {
        const cloned = new PdfNumber({
            value: this.value,
            padTo: this.padTo,
            decimalPlaces: this.decimalPlaces,
        }) as this
        return cloned
    }

    setModified(modified?: boolean): void {
        super.setModified(modified)
        this.#value.setModified(modified)
    }

    isModified(): boolean {
        return super.isModified() || this.#value.isModified()
    }
}

export class PdfByteOffsetNumber extends PdfNumber {
    isByteOffset: boolean = true
}
