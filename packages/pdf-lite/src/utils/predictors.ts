import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfObject } from '../core/objects/pdf-object.js'
import { ByteArray, DecodeParms } from '../types.js'

/**
 * Handles PNG and TIFF predictor encoding and decoding for PDF streams.
 * Predictors are used to improve compression efficiency by transforming
 * image data before or after compression.
 */
export class Predictor {
    /**
     * Decodes data that was encoded with a predictor.
     *
     * @param data - The encoded data to decode.
     * @param params - Optional decode parameters including Predictor, Columns, Colors, and BitsPerComponent.
     * @returns The decoded byte array.
     *
     * @example
     * ```typescript
     * const decoded = Predictor.decode(encodedData, { Predictor: 12, Columns: 100 })
     * ```
     */
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

    /**
     * Encodes data using a predictor algorithm.
     *
     * @param data - The data to encode.
     * @param params - Optional encode parameters including Predictor, Columns, Colors, and BitsPerComponent.
     * @param PdfStreamFilterType - The PNG filter type to use for encoding.
     * @returns The encoded byte array.
     *
     * @example
     * ```typescript
     * const encoded = Predictor.encode(rawData, { Predictor: 12, Columns: 100 }, 1)
     * ```
     */
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

    /**
     * Decodes TIFF predictor encoded data.
     *
     * @param data - The TIFF encoded data.
     * @param columns - The number of columns in the image.
     * @param bpp - Bytes per pixel.
     * @returns The decoded byte array.
     */
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

    /**
     * Encodes data using TIFF predictor.
     *
     * @param data - The data to encode.
     * @param columns - The number of columns in the image.
     * @param bpp - Bytes per pixel.
     * @returns The TIFF encoded byte array.
     */
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

    /**
     * Decodes PNG predictor encoded data.
     *
     * @param data - The PNG encoded data.
     * @param columns - The number of columns in the image.
     * @param bpp - Bytes per pixel.
     * @returns The decoded byte array.
     * @throws Error if an unsupported PNG filter type is encountered.
     */
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

    /**
     * Encodes data using PNG predictor.
     *
     * @param data - The data to encode.
     * @param columns - The number of columns in the image.
     * @param bpp - Bytes per pixel.
     * @param PdfStreamFilterType - The PNG filter type (0-4) to use.
     * @returns The PNG encoded byte array.
     * @throws Error if an unsupported PNG filter type is specified.
     */
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

    /**
     * Implements the Paeth predictor algorithm used in PNG filtering.
     *
     * @param a - The left pixel value.
     * @param b - The above pixel value.
     * @param c - The upper-left pixel value.
     * @returns The predicted pixel value.
     */
    private static paethPredictor(a: number, b: number, c: number): number {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)

        if (pa <= pb && pa <= pc) return a
        if (pb <= pc) return b
        return c
    }

    /**
     * Extracts decode parameters from a PDF dictionary.
     *
     * @param decodeParms - Optional PDF dictionary containing decode parameters.
     * @returns The decode parameters object or null if not applicable.
     *
     * @example
     * ```typescript
     * const params = Predictor.getDecodeParms(dictionary)
     * if (params) {
     *   console.log(params.Predictor)
     * }
     * ```
     */
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

    /**
     * Checks if the decode parameters can be handled by this predictor.
     *
     * @param decodeParms - Optional PDF dictionary containing decode parameters.
     * @returns True if the parameters can be handled, false otherwise.
     *
     * @example
     * ```typescript
     * if (Predictor.canHandleDecodeParms(dictionary)) {
     *   // Process with predictor
     * }
     * ```
     */
    static canHandleDecodeParms(decodeParms?: PdfDictionary): boolean {
        if (Predictor.getDecodeParms(decodeParms) === null) {
            return false
        }
        return true
    }
}
