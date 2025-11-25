import { ByteArray } from '../types'
import { Parser } from './parser'
import { PdfByteOffsetToken } from './tokens/byte-offset-token'
import { PdfToken } from './tokens/token'

/**
 * Serializes PDF tokens into a byte stream.
 * Handles byte offset calculation and token serialization.
 */
export class PdfTokenSerializer extends Parser<PdfToken, number> {
    /** Current byte offset in the output stream */
    offset: number = 0
    private buffer: PdfToken[] = []

    /**
     * Feeds tokens into the serializer buffer.
     *
     * @param input - PDF tokens to serialize
     */
    feed(...input: PdfToken[]): void {
        this.buffer.push(...input)
    }

    /**
     * Generates bytes from the buffered tokens.
     * Updates byte offset tokens as they are encountered.
     *
     * @returns A generator yielding individual bytes
     */
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

    /**
     * Pre-calculates byte offsets for all byte offset tokens in the buffer.
     * Does not consume the buffer.
     */
    calculateOffsets(): void {
        let currentOffset = 0

        for (const token of this.buffer) {
            if (token instanceof PdfByteOffsetToken) {
                token.update(currentOffset)
            }
            currentOffset += token.toBytes().length
        }
    }

    /**
     * Serializes all buffered tokens to a byte array.
     *
     * @returns The serialized PDF as a Uint8Array
     */
    toBytes(): ByteArray {
        return new Uint8Array(Array.from(this.nextItems()))
    }
}
