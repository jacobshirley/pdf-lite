import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'

/**
 * Represents a PDF linearization dictionary.
 * The linearization dictionary contains parameters needed for fast web viewing.
 *
 * @example
 * ```typescript
 * const linDict = new LinearizationDictionary({
 *     fileLength: 71443,
 *     hintStreamOffset: 548,
 *     hintStreamLength: 187,
 *     firstPageObjectNumber: 36,
 *     endOfFirstPage: 2636,
 *     pageCount: 1,
 *     xrefStreamOffset: 71078
 * })
 * ```
 */
export class LinearizationDictionary extends PdfDictionary {
    constructor(params: {
        /** Total length of the PDF file in bytes */
        fileLength: number
        /** Byte offset to hint stream */
        hintStreamOffset: number
        /** Length of hint stream in bytes */
        hintStreamLength: number
        /** Object number of first page */
        firstPageObjectNumber: number
        /** Byte offset to end of first page content */
        endOfFirstPage: number
        /** Total number of pages in document */
        pageCount: number
        /** Byte offset to primary xref stream/table */
        xrefStreamOffset: number
    }) {
        super({
            Linearized: new PdfNumber(1),
            L: new PdfNumber(params.fileLength),
            H: new PdfArray([
                new PdfNumber(params.hintStreamOffset),
                new PdfNumber(params.hintStreamLength),
            ]),
            O: new PdfNumber(params.firstPageObjectNumber),
            E: new PdfNumber(params.endOfFirstPage),
            N: new PdfNumber(params.pageCount),
            T: new PdfNumber(params.xrefStreamOffset),
        })
    }

    /**
     * Gets the total file length.
     */
    get fileLength(): number {
        return (this.get('L') as PdfNumber)?.value ?? 0
    }

    /**
     * Sets the total file length.
     */
    set fileLength(value: number) {
        this.set('L', new PdfNumber(value))
    }

    /**
     * Gets the hint stream offset.
     */
    get hintStreamOffset(): number {
        const hintArray = this.get('H') as PdfArray
        return (hintArray?.items[0] as PdfNumber)?.value ?? 0
    }

    /**
     * Gets the hint stream length.
     */
    get hintStreamLength(): number {
        const hintArray = this.get('H') as PdfArray
        return (hintArray?.items[1] as PdfNumber)?.value ?? 0
    }

    /**
     * Gets the first page object number.
     */
    get firstPageObjectNumber(): number {
        return (this.get('O') as PdfNumber)?.value ?? 0
    }

    /**
     * Gets the end of first page byte offset.
     */
    get endOfFirstPage(): number {
        return (this.get('E') as PdfNumber)?.value ?? 0
    }

    /**
     * Gets the page count.
     */
    get pageCount(): number {
        return (this.get('N') as PdfNumber)?.value ?? 0
    }

    /**
     * Gets the xref stream offset.
     */
    get xrefStreamOffset(): number {
        return (this.get('T') as PdfNumber)?.value ?? 0
    }
}
