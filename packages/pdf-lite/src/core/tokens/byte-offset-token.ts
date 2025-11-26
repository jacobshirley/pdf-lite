import { Ref } from '../ref'
import { PdfToken } from './token'

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
