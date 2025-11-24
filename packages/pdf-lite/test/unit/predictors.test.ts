import { describe, expect, it } from 'vitest'
import { Predictor } from '../../src/utils/predictors.js'
import { ByteArray } from '../../src/types.js'

describe('PDF predictors', () => {
    describe('TIFFPredictor', () => {
        it('should decode and encode', () => {
            const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
            const params = {
                Predictor: 2,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(decoded, params)
            expect(encoded).toEqual(data)
        })
    })

    describe('PNGPredictor', () => {
        function makePngRow(
            PdfStreamFilterType: number,
            row: number[],
            rowLength: number,
        ): ByteArray {
            return new Uint8Array([
                PdfStreamFilterType,
                ...row.slice(0, rowLength),
            ])
        }

        it('should decode and encode with None filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(0, row, 4)
            const params = {
                Predictor: 10,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 10 },
                0,
            )
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Sub filter', () => {
            const row = [10, 30, 50, 70]
            const data = makePngRow(1, row, 4)
            const params = {
                Predictor: 11,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 11 },
                1,
            )
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Up filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(2, row, 4)
            const params = {
                Predictor: 12,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 12 },
                2,
            )
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Average filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(3, row, 4)
            const params = {
                Predictor: 13,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 13 },
                3,
            )
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Paeth filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(4, row, 4)
            const params = {
                Predictor: 14,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 14 },
                4,
            )
            expect(encoded).toEqual(data)
        })
    })

    describe('PNGPredictor - Isolated Filters', () => {
        function makePngRow(
            PdfStreamFilterType: number,
            row: number[],
            rowLength: number,
        ): ByteArray {
            return new Uint8Array([
                PdfStreamFilterType,
                ...row.slice(0, rowLength),
            ])
        }

        it('should correctly encode and decode with None filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(0, row, 4)
            const params = {
                Predictor: 10,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 10 },
                0,
            )
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Sub filter', () => {
            const row = [10, 30, 50, 70]
            const data = makePngRow(1, row, 4)
            const params = {
                Predictor: 11,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 11 },
                1,
            )
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Up filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(2, row, 4)
            const params = {
                Predictor: 12,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 12 },
                2,
            )
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Average filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(3, row, 4)
            const params = {
                Predictor: 13,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 13 },
                3,
            )
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Paeth filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(4, row, 4)
            const params = {
                Predictor: 14,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            }
            const decoded = Predictor.decode(data, params)
            const encoded = Predictor.encode(
                decoded,
                { ...params, Predictor: 14 },
                4,
            )
            expect(encoded).toEqual(data)
        })
    })
})
