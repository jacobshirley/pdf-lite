import { PdfObject } from '../objects/pdf-object'
import { ByteArray } from '../../types'
import { IterableReadableStream } from '../../utils/IterableReadableStream'
import { pdfDecoderAsync } from '../generators'

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
