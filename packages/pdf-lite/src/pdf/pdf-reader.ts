import { PdfObject } from '../core/objects/pdf-object'
import { PdfObjectStream } from '../core/streams/object-stream'
import { ByteArray } from '../types'
import { PdfDocument } from './pdf-document'

export class PdfReader {
    protected objectStream: AsyncIterable<PdfObject> | Iterable<PdfObject>

    constructor(objectStream: AsyncIterable<PdfObject> | Iterable<PdfObject>) {
        this.objectStream = objectStream
    }

    async read(): Promise<PdfDocument> {
        const objects: PdfObject[] = []

        for await (const obj of this.objectStream) {
            objects.push(obj)
        }

        return PdfDocument.fromObjects(objects)
    }

    static async fromBytes(
        input: AsyncIterable<ByteArray> | Iterable<ByteArray>,
    ): Promise<PdfDocument> {
        const reader = new PdfReader(new PdfObjectStream(input))
        return reader.read()
    }
}
