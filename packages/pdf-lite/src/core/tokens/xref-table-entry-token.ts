import { ByteArray } from '../../types'
import { stringToBytes } from '../../utils/stringToBytes'
import { Ref } from '../ref'
import { PdfNumberToken } from './number-token'
import { PdfToken } from './token.js'

export class PdfXRefTableEntryToken extends PdfToken {
    objectNumber: PdfNumberToken
    generationNumber: PdfNumberToken
    offset: PdfNumberToken
    inUse: boolean

    constructor(
        offset: number | Ref<number> | PdfNumberToken,
        generationNumber: number | PdfNumberToken,
        objectNumber: number | PdfNumberToken,
        inUse: boolean,
    ) {
        super()
        this.objectNumber =
            objectNumber instanceof PdfNumberToken
                ? objectNumber
                : new PdfNumberToken({ value: objectNumber })
        this.generationNumber =
            generationNumber instanceof PdfNumberToken
                ? generationNumber
                : new PdfNumberToken({ value: generationNumber })
        this.offset =
            offset instanceof PdfNumberToken
                ? offset
                : new PdfNumberToken({ value: offset })
        this.inUse = inUse
    }

    toBytes(): ByteArray {
        return PdfXRefTableEntryToken.toBytes(
            this.generationNumber,
            this.offset,
            this.inUse,
        )
    }

    private static toBytes(
        generationNumber: number | PdfNumberToken,
        offset: number | PdfNumberToken | Ref<number>,
        inUse: boolean,
    ): ByteArray {
        const offsetString =
            offset instanceof PdfNumberToken
                ? offset.toString()
                : new PdfNumberToken({ value: offset, padTo: 10 }).toString()

        const generationNumberString =
            generationNumber instanceof PdfNumberToken
                ? generationNumber.toString()
                : new PdfNumberToken({
                      value: generationNumber,
                      padTo: 5,
                  }).toString()

        return stringToBytes(
            `${offsetString} ${generationNumberString} ${inUse ? 'n' : 'f'}`,
        )
    }
}
