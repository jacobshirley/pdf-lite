import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfObject } from '../core/objects/pdf-object.js'
import { ByteArray, DecodeParms } from '../types.js'

export class Predictor {
    static decode(data: ByteArray, params: DecodeParms = {}): ByteArray {
        const predictor = params.Predictor ?? 1
        const columns = params.Columns ?? 1
        const colors = params.Colors ?? 1
        const bpc = params.BitsPerComponent ?? 8

        const bpp = Math.ceil((colors * bpc) / 8)

        if (predictor === 2) {
            return this.tiffDecode(data, columns, bpp)
        } else if (predictor >= 10 && predictor <= 15) {
            return this.pngDecode(data, columns, bpp)
        }

        return data
    }

    static encode(
        data: ByteArray,
        params: DecodeParms = {},
        PdfStreamFilterType: number = 0,
    ): ByteArray {
        const predictor = params.Predictor ?? 1
        const columns = params.Columns ?? 1
        const colors = params.Colors ?? 1
        const bpc = params.BitsPerComponent ?? 8

        const bpp = Math.ceil((colors * bpc) / 8)

        if (predictor === 2) {
            return this.tiffEncode(data, columns, bpp)
        } else if (predictor >= 10 && predictor <= 15) {
            return this.pngEncode(data, columns, bpp, PdfStreamFilterType)
        }

        return data
    }

    static tiffDecode(
        data: ByteArray,
        columns: number,
        bpp: number,
    ): ByteArray {
        const rowLength = columns * bpp
        const output = new Uint8Array(data.length)

        for (let i = 0; i < data.length; i += rowLength) {
            for (let j = 0; j < rowLength; j++) {
                output[i + j] =
                    j < bpp
                        ? data[i + j]
                        : (data[i + j] + output[i + j - bpp]) & 0xff
            }
        }

        return output
    }

    static tiffEncode(
        data: ByteArray,
        columns: number,
        bpp: number,
    ): ByteArray {
        const rowLength = columns * bpp
        const output = new Uint8Array(data.length)

        for (let i = 0; i < data.length; i += rowLength) {
            for (let j = 0; j < rowLength; j++) {
                output[i + j] =
                    j < bpp
                        ? data[i + j]
                        : (data[i + j] - data[i + j - bpp] + 256) & 0xff
            }
        }

        return output
    }

    static pngDecode(data: ByteArray, columns: number, bpp: number): ByteArray {
        const rowLength = columns * bpp
        const output: number[] = []

        for (let i = 0; i < data.length; ) {
            const filter = data[i]
            const row = data.slice(i + 1, i + 1 + rowLength)
            const prior = output.slice(output.length - rowLength, output.length)

            const decodedRow = new Uint8Array(rowLength)
            for (let j = 0; j < rowLength; j++) {
                const left = j >= bpp ? decodedRow[j - bpp] : 0
                const up = prior[j] ?? 0
                const upperLeft = j >= bpp ? (prior[j - bpp] ?? 0) : 0

                switch (filter) {
                    case 0:
                        decodedRow[j] = row[j]
                        break
                    case 1:
                        decodedRow[j] = (row[j] + left) & 0xff
                        break
                    case 2:
                        decodedRow[j] = (row[j] + up) & 0xff
                        break
                    case 3:
                        decodedRow[j] =
                            (row[j] + Math.floor((left + up) / 2)) & 0xff
                        break
                    case 4:
                        decodedRow[j] =
                            (row[j] +
                                this.paethPredictor(left, up, upperLeft)) &
                            0xff
                        break
                    default:
                        throw new Error(`Unsupported PNG filter: ${filter}`)
                }
            }

            output.push(...decodedRow)
            i += 1 + rowLength
        }

        return new Uint8Array(output)
    }

    static pngEncode(
        data: ByteArray,
        columns: number,
        bpp: number,
        PdfStreamFilterType: number,
    ): ByteArray {
        const rowLength = columns * bpp
        const output: number[] = []
        let prior = new Uint8Array(rowLength)

        for (let i = 0; i < data.length; i += rowLength) {
            const row = data.slice(i, i + rowLength)
            const encodedRow = new Uint8Array(rowLength)

            for (let j = 0; j < rowLength; j++) {
                const left = j >= bpp ? row[j - bpp] : 0
                const up = prior[j] ?? 0
                const upperLeft = j >= bpp ? (prior[j - bpp] ?? 0) : 0

                switch (PdfStreamFilterType) {
                    case 0:
                        encodedRow[j] = row[j]
                        break
                    case 1:
                        encodedRow[j] = (row[j] - left + 256) & 0xff
                        break
                    case 2:
                        encodedRow[j] = (row[j] - up + 256) & 0xff
                        break
                    case 3:
                        encodedRow[j] =
                            (row[j] - Math.floor((left + up) / 2) + 256) & 0xff
                        break
                    case 4:
                        encodedRow[j] =
                            (row[j] -
                                this.paethPredictor(left, up, upperLeft) +
                                256) &
                            0xff
                        break
                    default:
                        throw new Error(
                            `Unsupported PNG filter: ${PdfStreamFilterType}`,
                        )
                }
            }

            output.push(PdfStreamFilterType, ...encodedRow)
            prior = row
        }

        return new Uint8Array(output)
    }

    private static paethPredictor(a: number, b: number, c: number): number {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)

        if (pa <= pb && pa <= pc) return a
        if (pb <= pc) return b
        return c
    }

    static getDecodeParms(decodeParms?: PdfDictionary): DecodeParms | null {
        if (!decodeParms) {
            return null
        }

        const predictor = decodeParms.get('Predictor')?.as(PdfNumber)?.value

        if (predictor === undefined) {
            return null
        }

        if (predictor <= 1 || predictor > 15) {
            return null
        }

        const BitsPerComponent = decodeParms
            .get('BitsPerComponent')
            ?.as(PdfNumber)
        const Columns = decodeParms.get('Columns')?.as(PdfNumber)
        const Colors = decodeParms.get('Colors')?.as(PdfNumber)

        return {
            BitsPerComponent: BitsPerComponent?.value,
            Columns: Columns?.value,
            Predictor: predictor,
            Colors: Colors?.value,
        }
    }

    static canHandleDecodeParms(decodeParms?: PdfDictionary): boolean {
        if (Predictor.getDecodeParms(decodeParms) === null) {
            return false
        }
        return true
    }
}
