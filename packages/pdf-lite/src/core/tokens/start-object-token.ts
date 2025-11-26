import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

export class PdfStartObjectToken extends PdfToken {
    objectNumber: number
    generationNumber: number
    byteOffset?: number

    constructor(
        objectNumber: number,
        generationNumber: number,
        byteOffset?: number,
    ) {
        super(PdfStartObjectToken.toBytes(objectNumber, generationNumber))
        this.objectNumber = objectNumber
        this.generationNumber = generationNumber
        this.byteOffset = byteOffset
    }

    private static toBytes(
        objectNumber: number,
        generationNumber: number,
    ): ByteArray {
        const tokenString = `${objectNumber} ${generationNumber} obj`
        return stringToBytes(tokenString)
    }
}
