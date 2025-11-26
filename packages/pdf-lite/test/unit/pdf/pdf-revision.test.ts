import { describe, expect, it } from 'vitest'
import { PdfRevision } from '../../../src/pdf/pdf-revision.js'
import { PdfIndirectObject } from '../../../src/core/objects/pdf-indirect-object.js'
import { PdfDictionary } from '../../../src/core/objects/pdf-dictionary.js'
import { PdfName } from '../../../src/core/objects/pdf-name.js'

describe('PdfRevision', () => {
    describe('constructor', () => {
        it('should create an empty revision', () => {
            const revision = new PdfRevision()
            expect(revision.objects).toBeDefined()
            expect(revision.locked).toBe(false)
        })

        it('should create a revision with initial objects', () => {
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({ Type: new PdfName('Test') }),
            })
            const revision = new PdfRevision({ objects: [obj] })
            expect(revision.objects).toContain(obj)
        })

        it('should create a locked revision when specified', () => {
            const revision = new PdfRevision({ locked: true })
            expect(revision.locked).toBe(true)
        })
    })

    describe('addObject', () => {
        it('should add an object to the revision', () => {
            const revision = new PdfRevision()
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({ Type: new PdfName('Test') }),
            })
            revision.addObject(obj)
            expect(revision.contains(obj)).toBe(true)
        })

        it('should throw error when adding to a locked revision', () => {
            const revision = new PdfRevision({ locked: true })
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            expect(() => revision.addObject(obj)).toThrow(
                'Cannot add object to locked PDF revision',
            )
        })
    })

    describe('deleteObject', () => {
        it('should remove an object from the revision', () => {
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            const revision = new PdfRevision({ objects: [obj] })
            revision.deleteObject(obj)
            expect(revision.contains(obj)).toBe(false)
        })

        it('should throw error when deleting from a locked revision', () => {
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            const revision = new PdfRevision({ objects: [obj], locked: true })
            expect(() => revision.deleteObject(obj)).toThrow(
                'Cannot delete object from locked PDF revision',
            )
        })

        it('should handle deletion of non-existent object gracefully', () => {
            const revision = new PdfRevision()
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            // Should not throw
            revision.deleteObject(obj)
        })
    })

    describe('contains', () => {
        it('should return true for objects in the revision', () => {
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            const revision = new PdfRevision({ objects: [obj] })
            expect(revision.contains(obj)).toBe(true)
        })

        it('should return false for objects not in the revision', () => {
            const revision = new PdfRevision()
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            expect(revision.contains(obj)).toBe(false)
        })
    })

    describe('exists', () => {
        it('should return true when an equal object exists', () => {
            const obj1 = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({ Type: new PdfName('Test') }),
            })
            const revision = new PdfRevision({ objects: [obj1] })
            const obj2 = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({ Type: new PdfName('Test') }),
            })
            expect(revision.exists(obj2)).toBe(true)
        })

        it('should return false when no equal object exists', () => {
            const revision = new PdfRevision()
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({ Type: new PdfName('Test') }),
            })
            expect(revision.exists(obj)).toBe(false)
        })
    })

    describe('unshift', () => {
        it('should add objects at the beginning of the revision', () => {
            const obj1 = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            const obj2 = new PdfIndirectObject({
                objectNumber: 2,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            const revision = new PdfRevision({ objects: [obj1] })
            revision.unshift(obj2)
            expect(revision.objects.indexOf(obj2)).toBeLessThan(
                revision.objects.indexOf(obj1),
            )
        })
    })

    describe('clone', () => {
        it('should create a deep copy of the revision', () => {
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary({ Type: new PdfName('Test') }),
            })
            const revision = new PdfRevision({ objects: [obj] })
            const cloned = revision.clone()
            expect(cloned).not.toBe(revision)
            expect(cloned.objects).not.toBe(revision.objects)
            expect(cloned.objects.length).toBe(revision.objects.length)
        })
    })

    describe('trailerDict', () => {
        it('should return the trailer dictionary from the xref', () => {
            const revision = new PdfRevision()
            expect(revision.trailerDict).toBe(revision.xref.trailerDict)
        })
    })

    describe('update', () => {
        it('should update the revision and xref', () => {
            const obj = new PdfIndirectObject({
                objectNumber: 1,
                generationNumber: 0,
                content: new PdfDictionary(),
            })
            const revision = new PdfRevision({ objects: [obj] })
            // Just ensure update doesn't throw
            expect(() => revision.update()).not.toThrow()
        })
    })
})
