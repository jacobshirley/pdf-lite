import { describe, expect, it } from 'vitest'
import { PdfStream } from '../../src/core/objects/pdf-stream.js'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary.js'
import { PdfNumber } from '../../src/core/objects/pdf-number.js'
import { stringToBytes } from '../../src/utils/bytes.js'

const XML = '<?xml version="1.0"?><root><field>value</field></root>'
const UPDATED_XML = '<?xml version="1.0"?><root><field>updated</field></root>'

// Data whose byte length is a multiple of 4 (for Columns=4 predictor tests)
const BINARY_DATA = new Uint8Array([
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
])
const UPDATED_BINARY_DATA = new Uint8Array([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
])

describe('PdfStream', () => {
    describe('dataAsString', () => {
        describe('getter', () => {
            it('returns the string content when there are no filters', () => {
                const stream = new PdfStream(XML)
                expect(stream.dataAsString).toBe(XML)
            })

            it('returns decompressed content when stream has FlateDecode', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')
                expect(stream.dataAsString).toBe(XML)
            })

            it('returns decompressed content when stream has multiple filters', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('RunLengthDecode')
                stream.addFilter('FlateDecode')
                expect(stream.dataAsString).toBe(XML)
            })
        })

        describe('setter', () => {
            it('stores new content when there are no filters', () => {
                const stream = new PdfStream(XML)
                stream.dataAsString = UPDATED_XML
                expect(stream.dataAsString).toBe(UPDATED_XML)
                expect(stream.getFilters()).toEqual([])
            })

            it('reapplies FlateDecode after updating content', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')

                stream.dataAsString = UPDATED_XML

                expect(stream.getFilters()).toEqual(['FlateDecode'])
                expect(stream.dataAsString).toBe(UPDATED_XML)
            })

            it('round-trips correctly through multiple filters', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('RunLengthDecode')
                stream.addFilter('FlateDecode')

                stream.dataAsString = UPDATED_XML

                expect(stream.getFilters()).toHaveLength(2)
                expect(stream.dataAsString).toBe(UPDATED_XML)
            })

            it('raw bytes differ from the decoded string when FlateDecode is active', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')

                stream.dataAsString = UPDATED_XML

                expect(stream.rawAsString).not.toBe(UPDATED_XML)
            })

            it('preserves predictor params when setting data', () => {
                const stream = new PdfStream(BINARY_DATA)
                stream.setPredictor({ Predictor: 12, Columns: 4 })
                stream.addFilter('FlateDecode')

                stream.data = UPDATED_BINARY_DATA

                const decodeParms = stream.header
                    .get('DecodeParms')
                    ?.as(PdfDictionary)
                expect(decodeParms).toBeDefined()
                expect(
                    decodeParms!.get('Predictor')?.as(PdfNumber)?.value,
                ).toBe(12)
                expect(decodeParms!.get('Columns')?.as(PdfNumber)?.value).toBe(
                    4,
                )
            })

            it('round-trips data correctly with predictor and FlateDecode', () => {
                const stream = new PdfStream(BINARY_DATA)
                stream.setPredictor({ Predictor: 12, Columns: 4 })
                stream.addFilter('FlateDecode')

                stream.data = UPDATED_BINARY_DATA

                expect(stream.data).toEqual(UPDATED_BINARY_DATA)
                expect(stream.getFilters()).toEqual(['FlateDecode'])
            })

            it('does not add DecodeParms when no predictor was set', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')

                stream.dataAsString = UPDATED_XML

                expect(stream.header.get('DecodeParms')).toBeUndefined()
            })

            it('preserves all predictor params including Colors and BitsPerComponent', () => {
                const stream = new PdfStream(BINARY_DATA)
                stream.setPredictor({
                    Predictor: 12,
                    Columns: 4,
                    Colors: 1,
                    BitsPerComponent: 8,
                })
                stream.addFilter('FlateDecode')

                stream.data = UPDATED_BINARY_DATA

                expect(stream.data).toEqual(UPDATED_BINARY_DATA)
                const decodeParms = stream.header
                    .get('DecodeParms')
                    ?.as(PdfDictionary)
                expect(
                    decodeParms!.get('Predictor')?.as(PdfNumber)?.value,
                ).toBe(12)
                expect(decodeParms!.get('Columns')?.as(PdfNumber)?.value).toBe(
                    4,
                )
                expect(decodeParms!.get('Colors')?.as(PdfNumber)?.value).toBe(1)
                expect(
                    decodeParms!.get('BitsPerComponent')?.as(PdfNumber)?.value,
                ).toBe(8)
            })

            it('raw bytes differ from decoded data when predictor is active', () => {
                const stream = new PdfStream(BINARY_DATA)
                stream.setPredictor({ Predictor: 12, Columns: 4 })
                stream.addFilter('FlateDecode')

                stream.data = UPDATED_BINARY_DATA

                expect(stream.raw).not.toEqual(UPDATED_BINARY_DATA)
            })
        })
    })
})
