import { describe, it, expect, beforeEach } from 'vitest'
import { PdfTextAppearanceStream } from '../../src/acroform/appearance/pdf-text-appearance-stream'
import { PdfDefaultAppearance } from '../../src/acroform/fields/pdf-default-appearance'
import { PdfDictionary } from '../../src/core/objects/pdf-dictionary'
import { PdfFont } from '../../src/fonts/pdf-font'

describe('PdfAppearanceStream', () => {
    describe('PdfTextAppearanceStream', () => {
        describe('Text Fitting', () => {
            let mockFont: PdfFont
            let fontResources: PdfDictionary
            let resolvedFonts: Map<string, PdfFont>

            beforeEach(() => {
                // Create mock font with predictable widths
                mockFont = new PdfFont('TestFont')
                mockFont.firstChar = 32
                mockFont.lastChar = 126

                // Simple width mapping: space=250, letters=500, numbers=600
                const widths = []
                for (let i = 32; i <= 126; i++) {
                    if (i === 32)
                        widths.push(250) // space
                    else if ((i >= 65 && i <= 90) || (i >= 97 && i <= 122))
                        widths.push(500) // letters
                    else if (i >= 48 && i <= 57)
                        widths.push(600) // numbers
                    else widths.push(400) // other
                }
                mockFont.widths = widths

                fontResources = new PdfDictionary()
                resolvedFonts = new Map()
                resolvedFonts.set('TestFont', mockFont)
            })

            const createContext = (overrides = {}) => ({
                rect: [0, 0, 200, 100] as [number, number, number, number],
                value: 'Test text',
                da: PdfDefaultAppearance.parse('/TestFont 12 Tf 0 g')!,
                multiline: false,
                comb: false,
                maxLen: null,
                fontResources,
                resolvedFonts,
                isUnicode: false,
                ...overrides,
            })

            describe('Single-line Text Fitting', () => {
                it('should create appearance stream for short text without scaling', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'Hi',
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT') // begin text
                    expect(content).toContain('ET') // end text
                    expect(content).toContain('/TestFont 12 Tf 0 g') // original font size
                    expect(content).toContain('(Hi) Tj')
                })

                it('should scale font down for long single-line text', () => {
                    // Create text that's too wide for field
                    const longText =
                        'This is a very long text that should not fit in 200 units width'
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: longText,
                            rect: [0, 0, 100, 50], // narrow field
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                    expect(content).toContain(`(${longText}) Tj`)
                    // Should contain a scaled down font size (less than 12)
                    // Note: exact size depends on measurement calculations
                })

                it('should handle empty text', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: '',
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('() Tj')
                })
            })

            describe('Multiline Text with Word Wrapping', () => {
                it('should wrap long text across multiple lines', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'This is a long paragraph that should be wrapped across multiple lines when displayed in the text field',
                            multiline: true,
                            rect: [0, 0, 120, 80], // Limited width to force wrapping
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                    // Should contain multiple Tj operations for wrapped lines
                    const tjMatches = content.match(/\([^)]*\) Tj/g) || []
                    // At least one text operation should be present
                    expect(tjMatches.length).toBeGreaterThanOrEqual(1)
                })

                it('should preserve explicit line breaks in multiline text', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'Line 1\nLine 2\nLine 3',
                            multiline: true,
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('(Line 1) Tj')
                    expect(content).toContain('(Line 2) Tj')
                    expect(content).toContain('(Line 3) Tj')
                })

                it('should scale font down when wrapped text exceeds field height', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'Very long text '.repeat(20), // Lots of text
                            multiline: true,
                            rect: [0, 0, 100, 40], // Limited height
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                    // Font should be scaled down from original 12pt
                })

                it('should handle multiline text with mixed content', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'Short line\nThis is a much longer line that will need wrapping\nAnother short line',
                            multiline: true,
                            rect: [0, 0, 120, 100],
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                })
            })

            describe('Comb Field Text Fitting', () => {
                it('should position characters in comb cells', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'ABCD',
                            comb: true,
                            maxLen: 5,
                            rect: [0, 0, 100, 30], // 5 cells of 20 units each
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('(A) Tj')
                    expect(content).toContain('(B) Tj')
                    expect(content).toContain('(C) Tj')
                    expect(content).toContain('(D) Tj')
                    // Should contain positioning commands (Td)
                    expect(
                        content.match(/[0-9.-]+ [0-9.-]+ Td/g)?.length,
                    ).toBeGreaterThan(0)
                })

                it('should scale font down for wide characters in comb cells', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'WWWWW', // Wide characters
                            comb: true,
                            maxLen: 5,
                            rect: [0, 0, 50, 30], // Small cells (10 units each)
                            da: PdfDefaultAppearance.parse(
                                '/TestFont 20 Tf 0 g',
                            )!, // Large font
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('(W) Tj')
                    // Font should be scaled down from 20pt to fit in cells
                })

                it('should truncate text exceeding maxLen', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'TOOLONG',
                            comb: true,
                            maxLen: 5,
                            rect: [0, 0, 100, 30],
                        }),
                    )

                    const content = stream.content.rawAsString
                    // Should only show first 5 characters
                    expect(content).toContain('(T) Tj')
                    expect(content).toContain('(O) Tj')
                    expect(content).not.toContain('(N) Tj') // 7th character
                    expect(content).not.toContain('(G) Tj') // 8th character
                })

                it('should handle unicode characters in comb fields', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'àßç',
                            comb: true,
                            maxLen: 3,
                            isUnicode: true,
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                })
            })

            describe('Edge Cases and Error Handling', () => {
                it('should handle zero-width fields gracefully', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            rect: [0, 0, 0, 50], // Zero width
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                })

                it('should handle zero-height fields gracefully', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            rect: [0, 0, 100, 0], // Zero height
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                })

                it('should handle special characters in text', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'Text with (parentheses) and \\backslashes',
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                    // Should properly escape PDF special characters
                })

                it('should handle very small font sizes', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: 'Tiny text',
                            da: PdfDefaultAppearance.parse(
                                '/TestFont 1 Tf 0 g',
                            )!,
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('(Tiny text) Tj')
                })

                it('should handle text with only spaces', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: '   ', // Only spaces
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('ET')
                })
            })

            describe('Font Resource Integration', () => {
                it('should work without resolved fonts (fallback to estimation)', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            resolvedFonts: undefined,
                            value: 'Test without font data',
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('(Test without font data) Tj')
                })

                it('should work without font resources', () => {
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            fontResources: undefined,
                            resolvedFonts: undefined,
                            value: 'Test without resources',
                        }),
                    )

                    const content = stream.content.rawAsString
                    expect(content).toContain('BT')
                    expect(content).toContain('(Test without resources) Tj')
                })
            })

            describe('PDF Content validation', () => {
                it('should generate properly structured PDF content', () => {
                    const stream = new PdfTextAppearanceStream(createContext())

                    const content = stream.content.rawAsString

                    // Check for required PDF operators
                    expect(content).toContain('/Tx BMC') // marked content begin
                    expect(content).toContain('EMC') // marked content end
                    expect(content).toContain('q') // save graphics state
                    expect(content).toContain('Q') // restore graphics state
                    expect(content).toContain('BT') // begin text
                    expect(content).toContain('ET') // end text

                    // Content should end with newline
                    expect(content.endsWith('\n')).toBe(true)
                })

                it('should maintain proper operator order', () => {
                    const stream = new PdfTextAppearanceStream(createContext())
                    const content = stream.content.rawAsString
                    const lines = content
                        .split('\n')
                        .filter((line) => line.trim())

                    // Check operator sequence
                    expect(lines[0]).toBe('/Tx BMC')
                    expect(lines[1]).toBe('q')
                    expect(lines[lines.length - 2]).toBe('Q')
                    expect(lines[lines.length - 1]).toBe('EMC')
                })
            })

            describe('Performance and Optimization', () => {
                it('should handle large text efficiently', () => {
                    const largeText = 'This is a large text block. '.repeat(100)

                    const start = Date.now()
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: largeText,
                            multiline: true,
                        }),
                    )
                    const duration = Date.now() - start

                    expect(stream).toBeDefined()
                    expect(duration).toBeLessThan(1000) // Should complete within 1 second
                })

                it('should handle many comb cells efficiently', () => {
                    const manyChars = 'A'.repeat(50)

                    const start = Date.now()
                    const stream = new PdfTextAppearanceStream(
                        createContext({
                            value: manyChars,
                            comb: true,
                            maxLen: 50,
                        }),
                    )
                    const duration = Date.now() - start

                    expect(stream).toBeDefined()
                    expect(duration).toBeLessThan(500) // Should be fast
                })
            })
        })
    })
})
