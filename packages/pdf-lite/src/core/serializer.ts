import { ByteArray } from '../types.js'
import { Parser } from './parser.js'
import { PdfByteOffsetToken } from './tokens/byte-offset-token.js'
import { PdfToken } from './tokens/token.js'

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
        for (const token of input) {
            this.buffer.push(token)
        }
    }

    /**
     * Efficiently feeds many tokens into the serializer buffer at once.
     * Use this instead of spreading large arrays to avoid stack overflow.
     *
     * @param tokens - Array of PDF tokens to serialize
     */
    feedMany(tokens: PdfToken[]): void {
        // Push tokens in batches to avoid stack overflow with very large arrays
        // while maintaining good performance
        const batchSize = 10000
        for (let i = 0; i < tokens.length; i += batchSize) {
            const end = Math.min(i + batchSize, tokens.length)
            this.buffer.push(...tokens.slice(i, end))
        }
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
