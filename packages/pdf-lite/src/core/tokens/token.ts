import { ByteArray } from '../../types'
import { bytesToString } from '../../utils/bytesToString'

export abstract class PdfToken {
    protected rawBytes: ByteArray

    constructor(bytes?: ByteArray) {
        this.rawBytes = bytes ?? new Uint8Array()
    }

    toBytes(): ByteArray {
        return this.rawBytes
    }

    toString(): string {
        return bytesToString(this.toBytes())
    }

    get type(): string {
        return this.constructor.name
    }

    get byteLength(): number {
        return this.toBytes().length
    }

    equals(other: PdfToken): boolean {
        if (this.byteLength !== other.byteLength) {
            return false
        }

        const bytes = this.toBytes()
        const otherBytes = other.toBytes()

        for (let i = 0; i < this.byteLength; i++) {
            if (bytes[i] !== otherBytes[i]) {
                return false
            }
        }

        return true
    }
}
