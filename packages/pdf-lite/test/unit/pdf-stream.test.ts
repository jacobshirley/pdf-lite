import { describe, expect, it } from 'vitest'
import { PdfStream } from '../../src/core/objects/pdf-stream.js'

const XML = '<?xml version="1.0"?><root><field>value</field></root>'
const UPDATED_XML = '<?xml version="1.0"?><root><field>updated</field></root>'

describe('PdfStream', () => {
    describe('decodedAsString', () => {
        describe('getter', () => {
            it('returns the string content when there are no filters', () => {
                const stream = new PdfStream(XML)
                expect(stream.decodedAsString).toBe(XML)
            })

            it('returns decompressed content when stream has FlateDecode', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')
                expect(stream.decodedAsString).toBe(XML)
            })

            it('returns decompressed content when stream has multiple filters', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('RunLengthDecode')
                stream.addFilter('FlateDecode')
                expect(stream.decodedAsString).toBe(XML)
            })
        })

        describe('setter', () => {
            it('stores new content when there are no filters', () => {
                const stream = new PdfStream(XML)
                stream.decodedAsString = UPDATED_XML
                expect(stream.decodedAsString).toBe(UPDATED_XML)
                expect(stream.getFilters()).toEqual([])
            })

            it('reapplies FlateDecode after updating content', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')

                stream.decodedAsString = UPDATED_XML

                expect(stream.getFilters()).toEqual(['FlateDecode'])
                expect(stream.decodedAsString).toBe(UPDATED_XML)
            })

            it('round-trips correctly through multiple filters', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('RunLengthDecode')
                stream.addFilter('FlateDecode')

                stream.decodedAsString = UPDATED_XML

                expect(stream.getFilters()).toHaveLength(2)
                expect(stream.decodedAsString).toBe(UPDATED_XML)
            })

            it('raw bytes differ from the decoded string when FlateDecode is active', () => {
                const stream = new PdfStream(XML)
                stream.addFilter('FlateDecode')

                stream.decodedAsString = UPDATED_XML

                expect(stream.rawAsString).not.toBe(UPDATED_XML)
            })
        })
    })
})
