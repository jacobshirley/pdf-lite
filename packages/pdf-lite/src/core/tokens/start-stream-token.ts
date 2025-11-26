import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'
import { PdfWhitespaceToken } from './whitespace-token'

const START_STREAM_WITHOUT_WHITESPACE_BYTES = stringToBytes('stream')
const START_STREAM_BYTES = stringToBytes('stream\n')

export class PdfStartStreamToken extends PdfToken {
    constructor(bytes?: ByteArray) {
        super(bytes ?? START_STREAM_BYTES)
    }

    getTrailingWhitespaceTokens(): PdfWhitespaceToken[] {
        const tokens: PdfWhitespaceToken[] = []
        const bytes = this.toBytes()

        for (let i = bytes.length - 1; i >= 0; i--) {
            const byte = bytes[i]
            if (!PdfWhitespaceToken.isWhitespaceByte(byte)) {
                continue
            }

            tokens.push(new PdfWhitespaceToken(byte))
        }
        return tokens.reverse()
    }

    static withTrailingWhitespace(
        whitespaceTokens: PdfToken[] | undefined,
    ): PdfStartStreamToken {
        if (!whitespaceTokens || whitespaceTokens.length === 0) {
            return new PdfStartStreamToken()
        }

        const totalLength =
            START_STREAM_WITHOUT_WHITESPACE_BYTES.length +
            whitespaceTokens.reduce((sum, token) => sum + token.byteLength, 0)

        const bytes = new Uint8Array(totalLength)
        bytes.set(START_STREAM_WITHOUT_WHITESPACE_BYTES, 0)

        let offset = START_STREAM_WITHOUT_WHITESPACE_BYTES.length
        for (const token of whitespaceTokens) {
            const tokenBytes = token.toBytes()
            bytes.set(tokenBytes, offset)
            offset += tokenBytes.length
        }

        return new PdfStartStreamToken(bytes)
    }
}
