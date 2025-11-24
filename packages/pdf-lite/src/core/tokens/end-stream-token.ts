import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

const END_STREAM_BYTES = stringToBytes('endstream')

export class PdfEndStreamToken extends PdfToken {
    constructor(bytes?: ByteArray) {
        super(bytes ?? END_STREAM_BYTES)
    }
}
