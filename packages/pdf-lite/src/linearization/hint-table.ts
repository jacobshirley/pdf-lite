import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'

/**
 * Generates hint tables for linearized PDFs.
 * Hint tables provide byte offset information for efficient page access.
 */
export class HintTableGenerator {
    /**
     * Creates a hint stream containing page offset hints.
     *
     * @param pageObjects - Array of page objects in order
     * @param pageByteOffsets - Byte offsets for each page
     * @returns A PDF stream containing the hint table
     */
    generateHintStream(
        pageObjects: PdfIndirectObject[],
        pageByteOffsets: number[],
    ): PdfStream {
        // Create a simple hint table
        // In a full implementation, this would contain detailed offset information
        const hintData = this.createHintTableData(
            pageObjects,
            pageByteOffsets,
        )

        return new PdfStream({
            header: new PdfDictionary({
                Length: new PdfNumber(hintData.length),
            }),
            original: new Uint8Array(hintData),
        })
    }

    /**
     * Creates the binary data for the hint table.
     * This is a simplified version - a full implementation would follow
     * the PDF specification for hint table structure.
     */
    private createHintTableData(
        pageObjects: PdfIndirectObject[],
        pageByteOffsets: number[],
    ): Uint8Array {
        // For this implementation, we create a minimal hint table
        // A full implementation would include:
        // - Page offset hint table
        // - Shared object hint table
        // - Thumbnail hint table (if applicable)
        // - Embedded file hint table (if applicable)

        const data: number[] = []

        // Page count
        this.writeInt32(data, pageObjects.length)

        // Byte offsets for each page
        for (const offset of pageByteOffsets) {
            this.writeInt32(data, offset)
        }

        return new Uint8Array(data)
    }

    /**
     * Writes a 32-bit integer to the data array in big-endian format.
     */
    private writeInt32(data: number[], value: number): void {
        data.push((value >> 24) & 0xff)
        data.push((value >> 16) & 0xff)
        data.push((value >> 8) & 0xff)
        data.push(value & 0xff)
    }
}
