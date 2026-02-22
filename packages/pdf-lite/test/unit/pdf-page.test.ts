import { describe, it, expect } from 'vitest'
import { PdfPage } from '../../src/pages/pdf-page.js'
import { PdfArray } from '../../src/core/objects/pdf-array.js'
import { PdfNumber } from '../../src/core/objects/pdf-number.js'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary.js'
import { PdfName } from '../../src/core/objects/pdf-name.js'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../../src/core/objects/pdf-object-reference.js'

describe('PdfPage', () => {
    describe('constructor', () => {
        it('should create a new page with specified dimensions', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            expect(page.content).toBeInstanceOf(PdfDictionary)
            const type = page.content.get('Type') as PdfName
            expect(type.value).toBe('Page')

            const mediaBox = page.mediaBox
            expect(mediaBox).toBeInstanceOf(PdfArray)
            expect(mediaBox?.length).toBe(4)
        })

        it('should create a page with rotation', () => {
            const page = new PdfPage({ width: 612, height: 792, rotate: 90 })

            const rotate = page.rotate
            expect(rotate).toBe(90)
        })

        it('should create a page with parent reference', () => {
            const parentRef = new PdfObjectReference(1, 0)
            const page = new PdfPage({
                width: 612,
                height: 792,
                parent: parentRef,
            })

            expect(page.parent).toBe(parentRef)
        })

        it('should wrap an existing page dictionary', () => {
            const pageDict = new PdfDictionary()
            pageDict.set('Type', new PdfName('Page'))
            pageDict.set(
                'MediaBox',
                new PdfArray([
                    new PdfNumber(0),
                    new PdfNumber(0),
                    new PdfNumber(612),
                    new PdfNumber(792),
                ]),
            )

            const pageObj = new PdfIndirectObject({ content: pageDict })
            const page = new PdfPage(pageObj)

            expect(page.content).toStrictEqual(pageDict)
        })

        it('should throw error for invalid page dictionary', () => {
            const invalidDict = new PdfDictionary()
            invalidDict.set('Type', new PdfName('NotAPage'))

            const pageObj = new PdfIndirectObject({ content: invalidDict })

            expect(() => new PdfPage(pageObj)).toThrow(
                /Invalid page dictionary/,
            )
        })
    })

    describe('mediaBox', () => {
        it('should get and set mediaBox', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const newBox = new PdfArray([
                new PdfNumber(0),
                new PdfNumber(0),
                new PdfNumber(400),
                new PdfNumber(600),
            ])
            page.mediaBox = newBox

            expect(page.mediaBox).toBe(newBox)
        })

        it('should validate mediaBox has 4 numbers', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const invalidBox = new PdfArray([
                new PdfNumber(0),
                new PdfNumber(0),
                new PdfNumber(612),
            ])

            expect(() => {
                page.mediaBox = invalidBox
            }).toThrow(/must have exactly 4 numbers/)
        })

        it('should validate upper-right > lower-left', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const invalidBox = new PdfArray([
                new PdfNumber(100),
                new PdfNumber(100),
                new PdfNumber(50), // urx < llx
                new PdfNumber(200),
            ])

            expect(() => {
                page.mediaBox = invalidBox
            }).toThrow(/upper-right corner must be greater/)
        })
    })

    describe('rotate', () => {
        it('should accept valid rotation values', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            page.rotate = 0
            expect(page.rotate).toBe(0)

            page.rotate = 90
            expect(page.rotate).toBe(90)

            page.rotate = 180
            expect(page.rotate).toBe(180)

            page.rotate = 270
            expect(page.rotate).toBe(270)
        })

        it('should reject invalid rotation values', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            expect(() => {
                page.rotate = 45 as 0
            }).toThrow(/must be 0, 90, 180, or 270/)
        })
    })

    describe('boxes', () => {
        it('should get and set cropBox', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const cropBox = new PdfArray([
                new PdfNumber(10),
                new PdfNumber(10),
                new PdfNumber(602),
                new PdfNumber(782),
            ])
            page.cropBox = cropBox

            expect(page.cropBox).toBe(cropBox)
        })

        it('should get and set trimBox', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const trimBox = new PdfArray([
                new PdfNumber(10),
                new PdfNumber(10),
                new PdfNumber(602),
                new PdfNumber(782),
            ])
            page.trimBox = trimBox

            expect(page.trimBox).toBe(trimBox)
        })

        it('should get and set bleedBox', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const bleedBox = new PdfArray([
                new PdfNumber(5),
                new PdfNumber(5),
                new PdfNumber(607),
                new PdfNumber(787),
            ])
            page.bleedBox = bleedBox

            expect(page.bleedBox).toBe(bleedBox)
        })

        it('should get and set artBox', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const artBox = new PdfArray([
                new PdfNumber(20),
                new PdfNumber(20),
                new PdfNumber(592),
                new PdfNumber(772),
            ])
            page.artBox = artBox

            expect(page.artBox).toBe(artBox)
        })
    })

    describe('resources', () => {
        it('should auto-create resources dictionary', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const resources = page.resources
            expect(resources).toBeInstanceOf(PdfDictionary)
        })

        it('should set resources dictionary', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const newResources = new PdfDictionary()
            newResources.set('Font', new PdfDictionary())
            page.resources = newResources

            expect(page.resources).toBe(newResources)
        })
    })

    describe('contents', () => {
        it('should get and set single content stream', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamRef = new PdfObjectReference(10, 0)
            page.contents = streamRef

            expect(page.contents).toBe(streamRef)
        })

        it('should get and set array of content streams', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamArray = new PdfArray([
                new PdfObjectReference(10, 0),
                new PdfObjectReference(11, 0),
            ])
            page.contents = streamArray

            expect(page.contents).toBe(streamArray)
        })
    })

    describe('getDimensions', () => {
        it('should return width and height from mediaBox', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const dimensions = page.getDimensions()
            expect(dimensions).toEqual({ width: 612, height: 792 })
        })

        it('should return undefined if no mediaBox', () => {
            const pageDict = new PdfDictionary()
            pageDict.set('Type', new PdfName('Page'))

            const pageObj = new PdfIndirectObject({ content: pageDict })
            const page = new PdfPage(pageObj)

            expect(page.getDimensions()).toBeUndefined()
        })
    })

    describe('addContentStream', () => {
        it('should add first content stream as single reference', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamRef = new PdfObjectReference(10, 0)
            page.addContentStream(streamRef)

            expect(page.contents).toBe(streamRef)
        })

        it('should convert single reference to array when adding second', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamRef1 = new PdfObjectReference(10, 0)
            const streamRef2 = new PdfObjectReference(11, 0)

            page.addContentStream(streamRef1)
            page.addContentStream(streamRef2)

            const contents = page.contents as PdfArray
            expect(contents).toBeInstanceOf(PdfArray)
            expect(contents.length).toBe(2)
            expect(contents.items[0]).toBe(streamRef1)
            expect(contents.items[1]).toBe(streamRef2)
        })

        it('should append to existing array', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamRef1 = new PdfObjectReference(10, 0)
            const streamRef2 = new PdfObjectReference(11, 0)
            const streamRef3 = new PdfObjectReference(12, 0)

            page.addContentStream(streamRef1)
            page.addContentStream(streamRef2)
            page.addContentStream(streamRef3)

            const contents = page.contents as PdfArray
            expect(contents.length).toBe(3)
        })
    })

    describe('setContentStreams', () => {
        it('should set single stream reference', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamRef = new PdfObjectReference(10, 0)
            page.setContentStreams(streamRef)

            expect(page.contents).toBe(streamRef)
        })

        it('should set array of streams', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const refs = [
                new PdfObjectReference(10, 0),
                new PdfObjectReference(11, 0),
            ]
            page.setContentStreams(refs)

            const contents = page.contents as PdfArray
            expect(contents).toBeInstanceOf(PdfArray)
            expect(contents.length).toBe(2)
        })

        it('should set single reference for array of length 1', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const refs = [new PdfObjectReference(10, 0)]
            page.setContentStreams(refs)

            expect(page.contents).toBeInstanceOf(PdfObjectReference)
        })

        it('should clear contents for empty array', () => {
            const page = new PdfPage({ width: 612, height: 792 })

            const streamRef = new PdfObjectReference(10, 0)
            page.contents = streamRef

            page.setContentStreams([])

            expect(page.contents).toBeUndefined()
        })
    })
})
