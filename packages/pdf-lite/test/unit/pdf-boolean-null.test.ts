import { describe, expect, it } from 'vitest'
import { PdfBoolean } from '../../src/core/objects/pdf-boolean'
import { PdfNull } from '../../src/core/objects/pdf-null'

describe('PdfBoolean', () => {
    describe('constructor', () => {
        it('should create a true boolean', () => {
            const pdfTrue = new PdfBoolean(true)
            expect(pdfTrue.value).toBe(true)
        })

        it('should create a false boolean', () => {
            const pdfFalse = new PdfBoolean(false)
            expect(pdfFalse.value).toBe(false)
        })
    })

    describe('toString', () => {
        it('should serialize true correctly', () => {
            const pdfTrue = new PdfBoolean(true)
            expect(pdfTrue.toString()).toBe('true')
        })

        it('should serialize false correctly', () => {
            const pdfFalse = new PdfBoolean(false)
            expect(pdfFalse.toString()).toBe('false')
        })
    })

    describe('clone', () => {
        it('should create an independent copy with true value', () => {
            const original = new PdfBoolean(true)
            const cloned = original.clone()
            expect(cloned).not.toBe(original)
            expect(cloned.value).toBe(true)
        })

        it('should create an independent copy with false value', () => {
            const original = new PdfBoolean(false)
            const cloned = original.clone()
            expect(cloned).not.toBe(original)
            expect(cloned.value).toBe(false)
        })
    })

    describe('tokenize', () => {
        it('should produce correct tokens for true', () => {
            const pdfTrue = new PdfBoolean(true)
            const tokens = pdfTrue.toTokens()
            expect(tokens).toHaveLength(1)
            expect(tokens[0].toString()).toBe('true')
        })

        it('should produce correct tokens for false', () => {
            const pdfFalse = new PdfBoolean(false)
            const tokens = pdfFalse.toTokens()
            expect(tokens).toHaveLength(1)
            expect(tokens[0].toString()).toBe('false')
        })
    })
})

describe('PdfNull', () => {
    describe('constructor', () => {
        it('should create a null object', () => {
            const pdfNull = new PdfNull()
            expect(pdfNull).toBeInstanceOf(PdfNull)
        })
    })

    describe('static NULL', () => {
        it('should provide a singleton null instance', () => {
            expect(PdfNull.NULL).toBeInstanceOf(PdfNull)
        })
    })

    describe('toString', () => {
        it('should serialize as "null"', () => {
            const pdfNull = new PdfNull()
            expect(pdfNull.toString()).toBe('null')
        })

        it('should serialize static NULL as "null"', () => {
            expect(PdfNull.NULL.toString()).toBe('null')
        })
    })

    describe('clone', () => {
        it('should create a new PdfNull instance', () => {
            const original = new PdfNull()
            const cloned = original.clone()
            expect(cloned).not.toBe(original)
            expect(cloned).toBeInstanceOf(PdfNull)
        })
    })

    describe('tokenize', () => {
        it('should produce correct tokens', () => {
            const pdfNull = new PdfNull()
            const tokens = pdfNull.toTokens()
            expect(tokens).toHaveLength(1)
            expect(tokens[0].toString()).toBe('null')
        })
    })
})
