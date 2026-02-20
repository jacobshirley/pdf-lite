import { PdfObject } from '../objects/pdf-object.js'
import { ByteArray } from '../../types.js'
import { IterableReadableStream } from '../../utils/iterable-readable-stream.js'
import { pdfDecoderAsync } from '../generators.js'

export class PdfObjectStream extends IterableReadableStream<PdfObject> {
    constructor(input: AsyncIterable<ByteArray> | Iterable<ByteArray>) {
        super({
            async start(controller) {
                const decoder = pdfDecoderAsync(input)

                for await (const obj of decoder) {
                    controller.enqueue(obj)
                }

                controller.close()
            },
        })
    }
}
