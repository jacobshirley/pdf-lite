import { ByteArray } from '../types'
import { Parser } from './parser'
import { PdfByteOffsetToken } from './tokens/byte-offset-token'
import { PdfToken } from './tokens/token'

export class PdfTokenSerializer extends Parser<PdfToken, number> {
    offset: number = 0
    private buffer: PdfToken[] = []

    feed(...input: PdfToken[]): void {
        this.buffer.push(...input)
    }

    *nextItems(): Generator<number> {
        while (this.buffer.length) {
            const obj = this.buffer.shift()!

            if (obj instanceof PdfByteOffsetToken) {
                obj.update(this.offset)
                continue
            }

            const bytes = obj.toBytes()
            yield* bytes
            this.offset += bytes.length
        }
    }

    calculateOffsets(): void {
        let currentOffset = 0

        for (const token of this.buffer) {
            if (token instanceof PdfByteOffsetToken) {
                token.update(currentOffset)
            }
            currentOffset += token.toBytes().length
        }
    }

    toBytes(): ByteArray {
        return new Uint8Array(Array.from(this.nextItems()))
    }
}
