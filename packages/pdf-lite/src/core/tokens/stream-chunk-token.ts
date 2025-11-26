import { ByteArray } from '../../types'
import { PdfToken } from './token'

export class PdfStreamChunkToken extends PdfToken {
    constructor(bytes: ByteArray) {
        super(bytes)
    }
}
