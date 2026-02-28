import { describe, expect, it } from 'vitest'
import {
    PdfStream,
    PdfStreamPredictor,
} from '../../src/core/objects/pdf-stream.js'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary.js'
import { PdfNumber } from '../../src/core/objects/pdf-number.js'

const XML = '<?xml version="1.0"?><root><field>value</field></root>'
const UPDATED_XML = '<?xml version="1.0"?><root><field>updated</field></root>'

// Data whose byte length is a multiple of 4 (for Columns=4 predictor tests)
const BINARY_DATA = new Uint8Array([
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
])
const UPDATED_BINARY_DATA = new Uint8Array([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
])

function makePngUp(columns: number): PdfStreamPredictor {
    const p = PdfStreamPredictor.PNG_UP.clone() as PdfStreamPredictor
    p.columns = columns
    return p
}

function makeFullPredictor(): PdfStreamPredictor {
    const p = PdfStreamPredictor.PNG_UP.clone() as PdfStreamPredictor
    p.columns = 4
    p.colors = 1
    p.bitsPerComponent = 8
    return p
}

describe('PdfStreamPredictor', () => {
    describe('static instances', () => {
        it('NONE has predictor 1', () => {
            expect(PdfStreamPredictor.NONE.predictor).toBe(1)
        })

        it('TIFF has predictor 2', () => {
            expect(PdfStreamPredictor.TIFF.predictor).toBe(2)
        })

        it('PNG_UP has predictor 12', () => {
            expect(PdfStreamPredictor.PNG_UP.predictor).toBe(12)
        })

        it('PNG_OPTIMUM has predictor 15', () => {
            expect(PdfStreamPredictor.PNG_OPTIMUM.predictor).toBe(15)
        })

        it('XREF_STREAM has predictor 12 and columns 7', () => {
            expect(PdfStreamPredictor.XREF_STREAM.predictor).toBe(12)
            expect(PdfStreamPredictor.XREF_STREAM.columns).toBe(7)
        })
    })

    describe('accessors', () => {
        it('defaults to predictor=1, columns=1, colors=1, bpc=8', () => {
            const p = new PdfStreamPredictor()
            expect(p.predictor).toBe(1)
            expect(p.columns).toBe(1)
            expect(p.colors).toBe(1)
            expect(p.bitsPerComponent).toBe(8)
        })

        it('get/set predictor', () => {
            const p = new PdfStreamPredictor()
            p.predictor = 12
            expect(p.predictor).toBe(12)
        })

        it('get/set columns', () => {
            const p = new PdfStreamPredictor()
            p.columns = 100
            expect(p.columns).toBe(100)
        })

        it('get/set colors', () => {
            const p = new PdfStreamPredictor()
            p.colors = 3
            expect(p.colors).toBe(3)
        })

        it('get/set bitsPerComponent', () => {
            const p = new PdfStreamPredictor()
            p.bitsPerComponent = 16
            expect(p.bitsPerComponent).toBe(16)
        })
    })

    describe('toDecodeParms', () => {
        it('returns only explicitly set params', () => {
            const p = new PdfStreamPredictor()
            p.predictor = 12
            p.columns = 4
            expect(p.toDecodeParms()).toEqual({
                Predictor: 12,
                Columns: 4,
            })
        })

        it('returns all params when all are set', () => {
            const p = new PdfStreamPredictor()
            p.predictor = 12
            p.columns = 4
            p.colors = 3
            p.bitsPerComponent = 16
            expect(p.toDecodeParms()).toEqual({
                Predictor: 12,
                Columns: 4,
                Colors: 3,
                BitsPerComponent: 16,
            })
        })
    })

    describe('fromDecodeParms', () => {
        it('creates predictor from plain object', () => {
            const p = PdfStreamPredictor.fromDecodeParms({
                Predictor: 12,
                Columns: 4,
                Colors: 3,
                BitsPerComponent: 16,
            })
            expect(p.predictor).toBe(12)
            expect(p.columns).toBe(4)
            expect(p.colors).toBe(3)
            expect(p.bitsPerComponent).toBe(16)
        })

        it('handles partial params', () => {
            const p = PdfStreamPredictor.fromDecodeParms({ Predictor: 2 })
            expect(p.predictor).toBe(2)
            expect(p.columns).toBe(1)
        })
    })
})

describe('PdfStream', () => {
    describe('predictor getter', () => {
        it('returns undefined when no predictor is set', () => {
            const stream = new PdfStream(BINARY_DATA)
            expect(stream.predictor).toBeUndefined()
        })

        it('returns the predictor after setting', () => {
            const stream = new PdfStream(BINARY_DATA)
            stream.predictor = makePngUp(4)
            const p = stream.predictor
            expect(p).toBeDefined()
            expect(p!.predictor).toBe(12)
            expect(p!.columns).toBe(4)
        })
    })

    describe('predictor setter', () => {
        it('does not mutate static instances', () => {
            const stream = new PdfStream(BINARY_DATA)
            stream.predictor = PdfStreamPredictor.PNG_UP
            // Static instance should still have columns=1 (default)
            expect(PdfStreamPredictor.PNG_UP.columns).toBe(1)
        })
    })

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
                stream.predictor = makePngUp(4)
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
                stream.predictor = makePngUp(4)
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
                stream.predictor = makeFullPredictor()
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
                stream.predictor = makePngUp(4)
                stream.addFilter('FlateDecode')

                stream.data = UPDATED_BINARY_DATA

                expect(stream.raw).not.toEqual(UPDATED_BINARY_DATA)
            })
        })
    })
})
