import { Ref } from '../ref.js'
import { PdfToken } from './token.js'

export class PdfByteOffsetToken extends PdfToken {
    value: Ref<number>

    constructor(value: Ref<number> = new Ref(0)) {
        super(new Uint8Array())

        this.value = value
    }

    resolve(): number {
        return this.value.resolve()
    }

    update(offset: number | Ref<number>): void {
        this.value.update(offset)
    }
}
