import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const START_XREF = stringToBytes('startxref')

export class PdfStartXRefToken extends PdfToken {
    constructor() {
        super(START_XREF)
    }
}
