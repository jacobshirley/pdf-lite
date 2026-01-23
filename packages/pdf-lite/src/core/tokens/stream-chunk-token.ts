import { ByteArray } from '../../types.js'
import { PdfToken } from './token.js'

export class PdfStreamChunkToken extends PdfToken {
    constructor(bytes: ByteArray) {
        super(bytes)
    }
}
