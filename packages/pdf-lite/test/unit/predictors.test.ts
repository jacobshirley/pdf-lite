import { describe, expect, it } from 'vitest'
import { PdfStreamPredictor } from '../../src/core/objects/pdf-stream.js'
import { ByteArray } from '../../src/types.js'

describe('PDF predictors', () => {
    describe('TIFFPredictor', () => {
        it('should decode and encode', () => {
            const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 2,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded)
            expect(encoded).toEqual(data)
        })
    })

    describe('PNGPredictor', () => {
        function makePngRow(
            filterType: number,
            row: number[],
            rowLength: number,
        ): ByteArray {
            return new Uint8Array([filterType, ...row.slice(0, rowLength)])
        }

        it('should decode and encode with None filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(0, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 10,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 0)
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Sub filter', () => {
            const row = [10, 30, 50, 70]
            const data = makePngRow(1, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 11,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 1)
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Up filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(2, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 12,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 2)
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Average filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(3, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 13,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 3)
            expect(encoded).toEqual(data)
        })

        it('should decode and encode with Paeth filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(4, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 14,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 4)
            expect(encoded).toEqual(data)
        })
    })

    describe('PNGPredictor - Isolated Filters', () => {
        function makePngRow(
            filterType: number,
            row: number[],
            rowLength: number,
        ): ByteArray {
            return new Uint8Array([filterType, ...row.slice(0, rowLength)])
        }

        it('should correctly encode and decode with None filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(0, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 10,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 0)
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Sub filter', () => {
            const row = [10, 30, 50, 70]
            const data = makePngRow(1, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 11,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 1)
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Up filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(2, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 12,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 2)
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Average filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(3, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 13,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 3)
            expect(encoded).toEqual(data)
        })

        it('should correctly encode and decode with Paeth filter', () => {
            const row = [10, 20, 30, 40]
            const data = makePngRow(4, row, 4)
            const predictor = PdfStreamPredictor.fromDecodeParms({
                Predictor: 14,
                Columns: 4,
                Colors: 1,
                BitsPerComponent: 8,
            })
            const decoded = predictor.decode(data)
            const encoded = predictor.encode(decoded, 4)
            expect(encoded).toEqual(data)
        })
    })
})
