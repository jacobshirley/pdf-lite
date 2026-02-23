import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import type { ByteArray } from '../../types.js'

export class PdfFontFileObject extends PdfIndirectObject<PdfStream> {
    constructor(fontData: ByteArray) {
        const stream = new PdfStream({
            header: new PdfDictionary(),
            original: fontData,
        })
        stream.header.set('Length1', new PdfNumber(fontData.length))
        stream.addFilter('FlateDecode')

        super({ content: stream })
    }
}
