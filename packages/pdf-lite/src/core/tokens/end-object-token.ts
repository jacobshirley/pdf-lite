import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const END_OBJECT_BYTES = stringToBytes('endobj')

export class PdfEndObjectToken extends PdfToken {
    constructor() {
        super(END_OBJECT_BYTES)
    }
}
