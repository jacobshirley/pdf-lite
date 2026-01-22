import { stringToBytes } from '../../utils/stringToBytes.js'
import { concatUint8Arrays } from '../../utils/concatUint8Arrays.js'
import { PdfToken } from './token.js'
import { ByteArray } from '../../types.js'
import { bytesToString } from '../../utils/bytesToString.js'

export class PdfCommentToken extends PdfToken {
    static EOF = new PdfCommentToken('%EOF')
    comment: ByteArray

    constructor(comment: ByteArray | string) {
        super(PdfCommentToken.toBytes(comment))
        this.comment =
            typeof comment === 'string' ? stringToBytes(comment) : comment
    }

    get innerComment(): string {
        return bytesToString(this.comment)
    }

    private static toBytes(comment: ByteArray | string): ByteArray {
        const tokenBytes =
            typeof comment === 'string' ? stringToBytes(comment) : comment
        return concatUint8Arrays(stringToBytes('%'), tokenBytes)
    }

    static isEofCommentToken(token: PdfToken): boolean {
        if (!(token instanceof PdfCommentToken)) return false
        const tokenStr = token.innerComment.trim()
        return tokenStr.toLowerCase() === '%eof'
    }
}
