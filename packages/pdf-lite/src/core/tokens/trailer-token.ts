import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const TRAILER = stringToBytes('trailer')

export class PdfTrailerToken extends PdfToken {
    byteOffset?: number
    constructor(byteOffset?: number) {
        super(TRAILER)
        this.byteOffset = byteOffset
    }
}
