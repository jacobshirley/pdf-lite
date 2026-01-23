import { ByteArray } from '../../types.js'
import { PdfToken } from './token.js'

export class PdfWhitespaceToken extends PdfToken {
    public static NEWLINE = new PdfWhitespaceToken('\n')
    public static SPACE = new PdfWhitespaceToken(' ')
    public static TAB = new PdfWhitespaceToken('\t')
    public static CARRIAGE_RETURN = new PdfWhitespaceToken('\r')

    constructor(value: string | ByteArray | number) {
        super(PdfWhitespaceToken.toBytes(value))
    }

    private static toBytes(value: string | ByteArray | number): ByteArray {
        if (value instanceof Uint8Array) {
            return value
        }

        if (typeof value === 'number') {
            return new Uint8Array([value])
        }

        switch (value) {
            case ' ':
                return new Uint8Array([0x20]) // space character
            case '\t':
                return new Uint8Array([0x09]) // tab character
            case '\n':
                return new Uint8Array([0x0a]) // newline character
            case '\r':
                return new Uint8Array([0x0d]) // carriage return character
            default:
                throw new Error(`Invalid whitespace character: ${value}`)
        }
    }

    static isWhitespaceByte(byte: number | null | undefined): boolean {
        if (byte === null || byte === undefined) {
            return false
        }
        return byte === 0x20 || byte === 0x0a || byte === 0x0d || byte === 0x09
    }
}
