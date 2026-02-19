import { ByteArray } from '../../types.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfCommentToken } from '../tokens/comment-token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfComment extends PdfObject {
    static EOF = new PdfComment('%EOF')

    /**
     * The comment value as raw bytes.
     */
    raw: ByteArray

    constructor(raw: string | ByteArray) {
        super()
        this.raw = typeof raw === 'string' ? stringToBytes(raw) : raw
    }

    isEof(): boolean {
        return this.equals(PdfComment.EOF)
    }

    asString() {
        return new TextDecoder().decode(this.raw)
    }

    isVersionComment(): boolean {
        const str = this.asString().toUpperCase()
        return str.startsWith('PDF-')
    }

    isEOFComment() {
        return this.equals(PdfComment.EOF)
    }

    static versionComment(version: string): PdfComment {
        const comment = new PdfComment(`PDF-${version}`)
        comment.postTokens = [PdfWhitespaceToken.NEWLINE]
        return comment
    }

    protected tokenize() {
        return [new PdfCommentToken(this.raw)]
    }

    cloneImpl(): this {
        return new PdfComment(new Uint8Array(this.raw)) as this
    }
}
