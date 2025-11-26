import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const END_ARRAY_BYTES = stringToBytes(']')

export class PdfEndArrayToken extends PdfToken {
    constructor() {
        super(END_ARRAY_BYTES)
    }
}
