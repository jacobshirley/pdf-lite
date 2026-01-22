import { PdfObject } from '../core/objects/pdf-object.js'
import { PdfObjectStream } from '../core/streams/object-stream.js'
import { ByteArray } from '../types.js'
import { PdfDocument } from './pdf-document.js'

/**
 * A reader for parsing PDF data into PdfDocument instances.
 * Processes streams of PDF objects and constructs documents from them.
 *
 * @example
 * ```typescript
 * // Read PDF from file bytes
 * const document = await PdfReader.fromBytes(fileBytes)
 * ```
 */
export class PdfReader {
    /** The stream of PDF objects to read from */
    protected objectStream: AsyncIterable<PdfObject> | Iterable<PdfObject>

    /**
     * Creates a new PdfReader instance.
     *
     * @param objectStream - An async or sync iterable of PDF objects
     */
    constructor(objectStream: AsyncIterable<PdfObject> | Iterable<PdfObject>) {
        this.objectStream = objectStream
    }

    /**
     * Reads all objects from the stream and constructs a PdfDocument.
     *
     * @returns A promise that resolves to the parsed PdfDocument
     */
    async read(): Promise<PdfDocument> {
        const objects: PdfObject[] = []

        for await (const obj of this.objectStream) {
            objects.push(obj)
        }

        return PdfDocument.fromObjects(objects)
    }

    /**
     * Creates a PdfDocument directly from a byte stream.
     * Convenience method that creates a reader internally.
     *
     * @param input - Async or sync iterable of byte arrays
     * @returns A promise that resolves to the parsed PdfDocument
     */
    static async fromBytes(
        input: AsyncIterable<ByteArray> | Iterable<ByteArray>,
    ): Promise<PdfDocument> {
        const reader = new PdfReader(new PdfObjectStream(input))
        return reader.read()
    }
}
