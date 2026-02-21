import { describe, it, expect, beforeEach } from 'vitest'
import { PdfGraphics } from '../../src/acroform/appearance/pdf-graphics'
import { PdfDefaultAppearance } from '../../src/acroform/fields/pdf-default-appearance'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfFont } from '../../src/fonts/pdf-font'

describe('PdfGraphics', () => {
    describe('PdfGraphics Text Measurement', () => {
        let graphics: PdfGraphics
        let mockFont: PdfFont
        let mockFontResources: PdfDictionary
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
            mockFontResources = new PdfDictionary()
            resolvedFonts = new Map()
            resolvedFonts.set('TestFont', mockFont)

            graphics = new PdfGraphics({
                resolvedFonts: resolvedFonts,
            })
        })

        describe('measureTextWidth', () => {
            it('should throw error when no font is set', () => {
                expect(() => graphics.measureTextWidth('test')).toThrow(
                    'No font set',
                )
            })

            it('should measure text width using font character widths', () => {
                const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
                graphics.setDefaultAppearance(da)

                // Test single character: 'A' at index 33 (65-32), width 750, size 12
                // Expected: (750 * 12) / 1000 = 9
                const widthA = graphics.measureTextWidth('A')
                expect(widthA).toBeCloseTo(9, 1)
            })

            it('should measure multi-character text width correctly', () => {
                const da = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
                graphics.setDefaultAppearance(da)

                // Test "Hi" - H(750) + i(500) = 1250 * 10 / 1000 = 12.5
                const widthHi = graphics.measureTextWidth('Hi')
                expect(widthHi).toBeCloseTo(12.5, 1)
            })

            it('should handle spaces correctly', () => {
                const da = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
                graphics.setDefaultAppearance(da)

                // Test "A A" - A(750) + space(250) + A(750) = 1750 * 10 / 1000 = 17.5
                const width = graphics.measureTextWidth('A A')
                expect(width).toBeCloseTo(17.5, 1)
            })

            it('should use fallback when font lacks width data', () => {
                const fontWithoutWidths = new PdfFont('NoWidthFont')
                resolvedFonts.set('NoWidthFont', fontWithoutWidths)

                const da = PdfDefaultAppearance.parse('/NoWidthFont 10 Tf 0 g')!
                graphics.setDefaultAppearance(da)

                // Should use estimation
                const width = graphics.measureTextWidth('A')
                expect(width).toBeGreaterThan(0)
            })
        })

        describe('wrapTextToLines', () => {
            beforeEach(() => {
                const da = PdfDefaultAppearance.parse('/TestFont 10 Tf 0 g')!
                graphics.setDefaultAppearance(da)
            })

            it('should not wrap text that fits on one line', () => {
                const lines = graphics.wrapTextToLines('Hi', 100)
                expect(lines).toEqual(['Hi'])
            })

            it('should wrap text at word boundaries', () => {
                // "Hello World" where each word is too wide together but fits individually
                // H(750) + e(500) + l(500) + l(500) + o(500) = 2750 * 10/1000 = 27.5
                // space = 250 * 10/1000 = 2.5
                // World = W(750) + o(500) + r(500) + l(500) + d(500) = 2750 * 10/1000 = 27.5
                // Total = 27.5 + 2.5 + 27.5 = 57.5, so should wrap if max width < 57.5
                const lines = graphics.wrapTextToLines('Hello World', 30)
                expect(lines).toEqual(['Hello', 'World'])
            })

            it('should preserve explicit line breaks', () => {
                const lines = graphics.wrapTextToLines('Line1\nLine2', 100)
                expect(lines).toEqual(['Line1', 'Line2'])
            })

            it('should handle multiple spaces between words', () => {
                const lines = graphics.wrapTextToLines('Word1  Word2', 30)
                expect(lines.length).toBeGreaterThanOrEqual(1)
            })

            it('should break long words that exceed line width', () => {
                // Create a very long word that must be broken
                const longWord = 'AAAAAAAAAA' // 10 A's = 10 * 750 * 10/1000 = 75
                const lines = graphics.wrapTextToLines(longWord, 40)
                expect(lines.length).toBeGreaterThan(1)
                expect(lines.join('')).toBe(longWord)
            })
        })

        describe('calculateFittingFontSize', () => {
            beforeEach(() => {
                const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
                graphics.setDefaultAppearance(da)
            })

            it('should return original size when text fits', () => {
                const fontSize = graphics.calculateFittingFontSize('A', 100)
                expect(fontSize).toBe(12)
            })

            it('should reduce font size to fit width constraint', () => {
                // 'A' at font size 12 = 750 * 12 / 1000 = 9
                // To fit in width 6, need size = 6 * 1000 / 750 = 8
                const fontSize = graphics.calculateFittingFontSize('A', 6)
                expect(fontSize).toBeLessThan(12)
                expect(fontSize).toBeGreaterThan(0)
            })

            it('should consider height constraint for multiline text', () => {
                const fontSize = graphics.calculateFittingFontSize(
                    'Line1 Line2 Line3',
                    100, // wide enough
                    20, // height constraint
                    1.2, // line height
                )
                expect(fontSize).toBeLessThan(12)
            })

            it('should respect minimum step size', () => {
                // Even with impossible constraints, should return at least stepSize (0.5)
                const fontSize = graphics.calculateFittingFontSize(
                    'Very long text',
                    1,
                )
                expect(fontSize).toBeGreaterThanOrEqual(0.5)
            })

            it('should return a size where text actually fits, not 0.5', () => {
                // 'A' at 12pt = 750 * 12 / 1000 = 9 > 7, so must scale down
                // But 'A' at 0.5pt = 750 * 0.5 / 1000 = 0.375, which fits easily
                // Binary search should find a real answer between 0.5 and 12
                const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
                graphics.setDefaultAppearance(da)
                const fontSize = graphics.calculateFittingFontSize('A', 7)
                expect(fontSize).toBeGreaterThan(0.5)
                expect(fontSize).toBeLessThanOrEqual(12)
                // Verify text actually fits at returned size: 750 * fontSize / 1000 <= 7
                expect((750 * fontSize) / 1000).toBeLessThanOrEqual(7)
            })
        })

        describe('font context tracking', () => {
            it('should track current font after setFont call', () => {
                const da = PdfDefaultAppearance.parse('/TestFont 14 Tf 0 g')!
                graphics.setDefaultAppearance(da)

                // Should be able to measure text immediately after setFont
                expect(() => graphics.measureTextWidth('test')).not.toThrow()
            })

            it('should update font size during calculation', () => {
                const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
                graphics.setDefaultAppearance(da)

                graphics.calculateFittingFontSize('Large Text', 10)

                // Font size should be updated internally for subsequent measurements
                // This is implementation detail but important for correct behavior
                expect(() => graphics.measureTextWidth('test')).not.toThrow()
            })
        })

        describe('PDF content generation', () => {
            it('should generate valid PDF operators', () => {
                const da = PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!
                graphics.setDefaultAppearance(da)
                graphics.beginText()
                graphics.showText('Hello', false)
                graphics.endText()

                const content = graphics.build()
                expect(content).toContain('/TestFont 12 Tf 0 g')
                expect(content).toContain('BT')
                expect(content).toContain('ET')
                expect(content).toContain('(Hello) Tj')
            })
        })

        describe('color methods', () => {
            it('setFillRGB should emit r g b rg operator', () => {
                graphics.setFillRGB(1, 0.5, 0)
                expect(graphics.build()).toContain('1 0.5 0 rg')
            })

            it('setFillRGB with black should emit 0 0 0 rg', () => {
                graphics.setFillRGB(0, 0, 0)
                expect(graphics.build()).toContain('0 0 0 rg')
            })

            it('setFillGray should emit v g operator', () => {
                graphics.setFillGray(0.5)
                expect(graphics.build()).toContain('0.5 g')
            })

            it('setFillGray with 0 should emit 0 g', () => {
                graphics.setFillGray(0)
                expect(graphics.build()).toContain('0 g')
            })
        })

        describe('setFont', () => {
            it('should emit /name size Tf operator', () => {
                graphics.setFont('ZaDb', 12)
                expect(graphics.build()).toContain('/ZaDb 12 Tf')
            })

            it('should emit correct operator for fractional size', () => {
                graphics.setFont('Helvetica', 8.5)
                expect(graphics.build()).toContain('/Helvetica 8.5 Tf')
            })
        })

        describe('path drawing methods', () => {
            it('movePath should emit x y m operator', () => {
                graphics.movePath(10, 20)
                expect(graphics.build()).toContain('10 20 m')
            })

            it('lineTo should emit x y l operator', () => {
                graphics.lineTo(30, 40)
                expect(graphics.build()).toContain('30 40 l')
            })

            it('curveTo should emit x1 y1 x2 y2 x3 y3 c operator', () => {
                graphics.curveTo(1, 2, 3, 4, 5, 6)
                expect(graphics.build()).toContain('1 2 3 4 5 6 c')
            })

            it('fill should emit f operator', () => {
                graphics.fill()
                expect(graphics.build()).toContain('f')
            })

            it('stroke should emit S operator', () => {
                graphics.stroke()
                expect(graphics.build()).toContain('S')
            })

            it('closePath should emit h operator', () => {
                graphics.closePath()
                expect(graphics.build()).toContain('h')
            })

            it('should chain path operations correctly', () => {
                graphics
                    .setFillRGB(0, 0, 0)
                    .movePath(5, 10)
                    .lineTo(15, 10)
                    .lineTo(10, 20)
                    .fill()

                const content = graphics.build()
                expect(content).toContain('0 0 0 rg')
                expect(content).toContain('5 10 m')
                expect(content).toContain('15 10 l')
                expect(content).toContain('10 20 l')
                expect(content).toContain('f')
            })
        })
    })
})
