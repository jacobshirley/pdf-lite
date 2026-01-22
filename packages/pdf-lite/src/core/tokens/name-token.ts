import { ByteArray } from '../../types.js'
import { stringToBytes } from '../../utils/stringToBytes.js'
import { PdfToken } from './token.js'

export class PdfNameToken extends PdfToken {
    name: string

    constructor(name: string) {
        if (typeof name !== 'string' || name.length === 0) {
            throw new Error('PdfNameToken name must be a non-empty string')
        }
        super(PdfNameToken.toBytes(name))
        this.name = name
    }

    private static toBytes(name: string): ByteArray {
        return stringToBytes(`/${name}`)
    }
}
