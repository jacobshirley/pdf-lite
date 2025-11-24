import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const START_DICTIONARY_BYTES = stringToBytes('<<')

export class PdfStartDictionaryToken extends PdfToken {
    constructor() {
        super(START_DICTIONARY_BYTES)
    }
}
