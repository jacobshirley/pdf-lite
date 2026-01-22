import { ByteArray } from '../../types.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

const END_STREAM_BYTES = stringToBytes('endstream')

export class PdfEndStreamToken extends PdfToken {
    constructor(bytes?: ByteArray) {
        super(bytes ?? END_STREAM_BYTES)
    }
}
