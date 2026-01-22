import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

const XREF = stringToBytes('xref')

export class PdfXRefTableStartToken extends PdfToken {
    byteOffset?: number

    constructor(byteOffset?: number) {
        super(XREF)
        this.byteOffset = byteOffset
    }
}
