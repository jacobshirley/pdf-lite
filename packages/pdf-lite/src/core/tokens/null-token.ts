import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const NULL = stringToBytes('null')
export class PdfNullToken extends PdfToken {
    constructor() {
        super(NULL)
    }
}
