import { ByteArray } from '../../types.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfNumberToken } from './number-token.js'
import { PdfToken } from './token.js'

export class PdfXRefTableSectionStartToken extends PdfToken {
    start: PdfNumberToken
    count: PdfNumberToken

    constructor(
        start: number | PdfNumberToken,
        count: number | PdfNumberToken,
    ) {
        super(PdfXRefTableSectionStartToken.toBytes(start, count))
        this.start =
            start instanceof PdfNumberToken
                ? start
                : new PdfNumberToken({ value: start })
        this.count =
            count instanceof PdfNumberToken
                ? count
                : new PdfNumberToken({ value: count })
    }

    private static toBytes(
        start: PdfNumberToken | number,
        count: PdfNumberToken | number,
    ): ByteArray {
        return stringToBytes(`${start.toString()} ${count.toString()}`)
    }
}
