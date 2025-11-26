import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { PdfToken } from './token'

export class PdfObjectReferenceToken extends PdfToken {
    objectNumber: number
    generationNumber: number

    constructor(objectNumber: number, generationNumber: number) {
        super(PdfObjectReferenceToken.toBytes(objectNumber, generationNumber))
        this.objectNumber = objectNumber
        this.generationNumber = generationNumber
    }

    private static toBytes(
        objectNumber: number,
        generationNumber: number,
    ): ByteArray {
        const objNumStr = objectNumber.toString()
        const genNumStr = generationNumber.toString()
        const refStr = `${objNumStr} ${genNumStr} R`
        return stringToBytes(refStr)
    }
}
