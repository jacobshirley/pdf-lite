import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const START_ARRAY_BYTES = stringToBytes('[')

export class PdfStartArrayToken extends PdfToken {
    constructor() {
        super(START_ARRAY_BYTES)
    }
}
