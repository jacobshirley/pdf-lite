import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

const TRAILER = stringToBytes('trailer')

export class PdfTrailerToken extends PdfToken {
    byteOffset?: number
    constructor(byteOffset?: number) {
        super(TRAILER)
        this.byteOffset = byteOffset
    }
}
