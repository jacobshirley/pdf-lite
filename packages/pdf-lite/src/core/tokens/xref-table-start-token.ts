import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const XREF = stringToBytes('xref')

export class PdfXRefTableStartToken extends PdfToken {
    byteOffset?: number

    constructor(byteOffset?: number) {
        super(XREF)
        this.byteOffset = byteOffset
    }
}
