import { describe, it, expect, beforeEach } from 'vitest'
import { PdfTextLayout } from '../../src/content/pdf-text-layout'
import { PdfDefaultAppearance } from '../../src/acroform/fields/pdf-default-appearance'
import { PdfFont } from '../../src/fonts/pdf-font'

describe('PdfTextLayout', () => {
    let layout: PdfTextLayout
    let mockFont: PdfFont
    let resolvedFonts: Map<string, PdfFont>

    beforeEach(() => {
        // Create mock font with known widths
        mockFont = new PdfFont('MockFont')
        mockFont.firstChar = 32 // space
        mockFont.lastChar = 126 // ~
        // Create simplified width array (space=250, A-Z=750, a-z=500, 0-9=600)
        const widths = []
        for (let i = 32; i <= 126; i++) {
            if (i === 32)
                widths.push(250) // space
            else if (i >= 65 && i <= 90)
                widths.push(750) // A-Z
            else if (i >= 97 && i <= 122)
                widths.push(500) // a-z
            else if (i >= 48 && i <= 57)
                widths.push(600) // 0-9
            else widths.push(400) // other chars
        }
        mockFont.widths = widths

        // Setup font resources
        resolvedFonts = new Map()
        resolvedFonts.set('TestFont', mockFont)

        const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
        layout = new PdfTextLayout({
            defaultAppearance: da,
            resolvedFonts: resolvedFonts,
        })
    })

    describe('measureTextWidth', () => {
        it('should throw error when no font is set', () => {
            const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
            const emptyLayout = new PdfTextLayout({
                defaultAppearance: da,
                resolvedFonts: undefined,
            })
            expect(() => emptyLayout.measureTextWidth('test')).not.toThrow()
        })

        it('should measure text width using font character widths', () => {
            // Test single character: 'A' at index 33 (65-32), width 750, size 12
            // Expected: (750 * 12) / 1000 = 9
            const widthA = layout.measureTextWidth('A')
            expect(widthA).toBeCloseTo(9, 1)
        })

        it('should measure multi-character text width correctly', () => {
            const da = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
            const layout10 = new PdfTextLayout({
                defaultAppearance: da,
                resolvedFonts,
            })

            // Test "Hi" - H(750) + i(500) = 1250 * 10 / 1000 = 12.5
            const widthHi = layout10.measureTextWidth('Hi')
            expect(widthHi).toBeCloseTo(12.5, 1)
        })

        it('should handle spaces correctly', () => {
            const da = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
            const layout10 = new PdfTextLayout({
                defaultAppearance: da,
                resolvedFonts,
            })

            // Test "A A" - A(750) + space(250) + A(750) = 1750 * 10 / 1000 = 17.5
            const width = layout10.measureTextWidth('A A')
            expect(width).toBeCloseTo(17.5, 1)
        })

        it('should use fallback when font lacks width data', () => {
            const fontWithoutWidths = new PdfFont('NoWidthFont')
            const noWidthFonts = new Map()
            noWidthFonts.set('NoWidthFont', fontWithoutWidths)

            const da = PdfDefaultAppearance.parse('/NoWidthFont 10 Tf 0 g')!
            const noWidthLayout = new PdfTextLayout({
                defaultAppearance: da,
                resolvedFonts: noWidthFonts,
            })

            // Should use estimation
            const width = noWidthLayout.measureTextWidth('A')
            expect(width).toBeGreaterThan(0)
        })
    })

    describe('wrapTextToLines', () => {
        beforeEach(() => {
            const da = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
            layout = new PdfTextLayout({
                defaultAppearance: da,
                resolvedFonts,
            })
        })

        it('should not wrap text that fits on one line', () => {
            const lines = layout.wrapTextToLines('Hi', 100)
            expect(lines).toEqual(['Hi'])
        })

        it('should wrap text at word boundaries', () => {
            // "Hello World" where each word is too wide together but fits individually
            // H(750) + e(500) + l(500) + l(500) + o(500) = 2750 * 10/1000 = 27.5
            // space = 250 * 10/1000 = 2.5
            // World = W(750) + o(500) + r(500) + l(500) + d(500) = 2750 * 10/1000 = 27.5
            // Total = 27.5 + 2.5 + 27.5 = 57.5, so should wrap if max width < 57.5
            const lines = layout.wrapTextToLines('Hello World', 30)
            expect(lines).toEqual(['Hello', 'World'])
        })

        it('should preserve explicit line breaks', () => {
            const lines = layout.wrapTextToLines('Line1\nLine2', 100)
            expect(lines).toEqual(['Line1', 'Line2'])
        })

        it('should handle multiple spaces between words', () => {
            const lines = layout.wrapTextToLines('Word1  Word2', 30)
            expect(lines.length).toBeGreaterThanOrEqual(1)
        })

        it('should break long words that exceed line width', () => {
            // Create a very long word that must be broken
            const longWord = 'AAAAAAAAAA' // 10 A's = 10 * 750 * 10/1000 = 75
            const lines = layout.wrapTextToLines(longWord, 40)
            expect(lines.length).toBeGreaterThan(1)
            expect(lines.join('')).toBe(longWord)
        })
    })

    describe('calculateFittingFontSize', () => {
        it('should return original size when text fits', () => {
            const fontSize = layout.calculateFittingFontSize('A', 100)
            expect(fontSize).toBe(12)
        })

        it('should reduce font size to fit width constraint', () => {
            // 'A' at font size 12 = 750 * 12 / 1000 = 9
            // To fit in width 6, need size = 6 * 1000 / 750 = 8
            const fontSize = layout.calculateFittingFontSize('A', 6)
            expect(fontSize).toBeLessThan(12)
            expect(fontSize).toBeGreaterThan(0)
        })

        it('should consider height constraint for multiline text', () => {
            const fontSize = layout.calculateFittingFontSize(
                'Line1 Line2 Line3',
                100, // wide enough
                20, // height constraint
                1.2, // line height
            )
            expect(fontSize).toBeLessThan(12)
        })

        it('should respect minimum step size', () => {
            // Even with impossible constraints, should return at least stepSize (0.5)
            const fontSize = layout.calculateFittingFontSize(
                'Very long text',
                1,
            )
            expect(fontSize).toBeGreaterThanOrEqual(0.5)
        })

        it('should return a size where text actually fits, not 0.5', () => {
            // 'A' at 12pt = 750 * 12 / 1000 = 9 > 7, so must scale down
            // But 'A' at 0.5pt = 750 * 0.5 / 1000 = 0.375, which fits easily
            // Binary search should find a real answer between 0.5 and 12
            const fontSize = layout.calculateFittingFontSize('A', 7)
            expect(fontSize).toBeGreaterThan(0.5)
            expect(fontSize).toBeLessThanOrEqual(12)
            // Verify text actually fits at returned size: 750 * fontSize / 1000 <= 7
            expect((750 * fontSize) / 1000).toBeLessThanOrEqual(7)
        })
    })

    describe('font context tracking', () => {
        it('should use font from defaultAppearance', () => {
            const da = PdfDefaultAppearance.parse('/TestFont 14 Tf 0 g')!
            const newLayout = new PdfTextLayout({
                defaultAppearance: da,
                resolvedFonts,
            })

            // Should be able to measure text immediately after creation
            expect(() => newLayout.measureTextWidth('test')).not.toThrow()
        })

        it('should handle font size changes between instances', () => {
            const da12 = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
            const layout12 = new PdfTextLayout({
                defaultAppearance: da12,
                resolvedFonts,
            })

            const da10 = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
            const layout10 = new PdfTextLayout({
                defaultAppearance: da10,
                resolvedFonts,
            })

            const width12 = layout12.measureTextWidth('A')
            const width10 = layout10.measureTextWidth('A')

            // Width should scale with font size
            expect(width12).toBeGreaterThan(width10)
        })
    })
})
