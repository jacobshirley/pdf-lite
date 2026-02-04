import { describe, it, expect } from 'vitest'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfName } from '../../src/core/objects/pdf-name'
import { PdfNumber } from '../../src/core/objects/pdf-number'
import {
    buildEncodingMap,
    decodeWithFontEncoding,
} from '../../src/utils/decodeWithFontEncoding'

describe('Font Encoding', () => {
    describe('buildEncodingMap', () => {
        it('should build encoding map from Differences array', () => {
            // Create a Differences array: [160 /Euro 164 /currency]
            const differences = new PdfArray([
                new PdfNumber(160),
                new PdfName('Euro'),
                new PdfNumber(164),
                new PdfName('currency'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            expect(encodingMap?.size).toBe(2)
            expect(encodingMap?.get(160)).toBe('\u20AC') // Euro symbol
            expect(encodingMap?.get(164)).toBe('\u00A4') // Currency symbol
        })

        it('should build encoding map with consecutive glyph names', () => {
            // Create a Differences array: [128 /bullet /dagger /daggerdbl]
            const differences = new PdfArray([
                new PdfNumber(128),
                new PdfName('bullet'),
                new PdfName('dagger'),
                new PdfName('daggerdbl'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            expect(encodingMap?.size).toBe(3)
            expect(encodingMap?.get(128)).toBe('\u2022') // Bullet
            expect(encodingMap?.get(129)).toBe('\u2020') // Dagger
            expect(encodingMap?.get(130)).toBe('\u2021') // Double dagger
        })

        it('should handle unknown glyph names gracefully', () => {
            // Create a Differences array with unknown glyph
            const differences = new PdfArray([
                new PdfNumber(160),
                new PdfName('Euro'),
                new PdfName('UnknownGlyph'),
                new PdfNumber(164),
                new PdfName('currency'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            // Should only have 2 mappings (Euro at 160 and currency at 164)
            // UnknownGlyph at 161 should be skipped
            expect(encodingMap?.size).toBe(2)
            expect(encodingMap?.get(160)).toBe('\u20AC')
            expect(encodingMap?.get(161)).toBeUndefined()
            expect(encodingMap?.get(164)).toBe('\u00A4')
        })

        it('should return null for empty Differences array', () => {
            const differences = new PdfArray([])
            const encodingMap = buildEncodingMap(differences)
            expect(encodingMap).toBeNull()
        })

        it('should handle multiple ranges in Differences array', () => {
            // Create a Differences array with multiple ranges
            const differences = new PdfArray([
                new PdfNumber(24),
                new PdfName('breve'),
                new PdfName('caron'),
                new PdfNumber(160),
                new PdfName('Euro'),
                new PdfNumber(192),
                new PdfName('Agrave'),
                new PdfName('Aacute'),
            ])

            const encodingMap = buildEncodingMap(differences)

            expect(encodingMap).toBeDefined()
            expect(encodingMap?.size).toBe(5)
            expect(encodingMap?.get(24)).toBe('\u02D8') // breve
            expect(encodingMap?.get(25)).toBe('\u02C7') // caron
            expect(encodingMap?.get(160)).toBe('\u20AC') // Euro
            expect(encodingMap?.get(192)).toBe('\u00C0') // Agrave
            expect(encodingMap?.get(193)).toBe('\u00C1') // Aacute
        })
    })

    describe('decodeWithFontEncoding', () => {
        it('should decode bytes with custom font encoding', () => {
            // Create encoding map with Euro at byte 160
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro

            // Test string with Euro symbol: byte 160 + "2"
            const bytes = new Uint8Array([160, 50]) // 50 = '2'
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('€2')
        })

        it('should decode bytes without encoding map using PDFDocEncoding', () => {
            // Test with null encoding map (should fall back to PDFDocEncoding)
            const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
            const result = decodeWithFontEncoding(bytes, null)

            expect(result).toBe('Hello')
        })

        it('should fall back to PDFDocEncoding for unmapped bytes', () => {
            // Create encoding map with only Euro
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro

            // Mix of mapped (160) and unmapped bytes (72='H', 101='e')
            const bytes = new Uint8Array([72, 160, 101]) // "H" + Euro + "e"
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('H€e')
        })

        it('should handle special characters from PDFDocEncoding range', () => {
            // Create encoding map with Euro at 160
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC')

            // Byte 0x80 (128) = bullet in PDFDocEncoding
            const bytes = new Uint8Array([128, 160, 50]) // bullet + Euro + "2"
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('•€2') // Bullet + Euro + "2"
        })

        it('should decode multiple currency symbols', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro
            encodingMap.set(164, '\u00A4') // Generic currency
            encodingMap.set(165, '\u00A5') // Yen

            const bytes = new Uint8Array([160, 32, 164, 32, 165]) // Euro + space + currency + space + yen
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('€ ¤ ¥')
        })

        it('should handle accented characters from encoding map', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(200, '\u00C9') // Eacute
            encodingMap.set(201, '\u00E9') // eacute

            const bytes = new Uint8Array([200, 116, 201]) // É + t + é
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('Été')
        })

        it('should handle ligatures from encoding map', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(150, '\uFB01') // fi ligature
            encodingMap.set(151, '\uFB02') // fl ligature

            const bytes = new Uint8Array([150, 110, 100, 151, 121]) // fi + n + d + fl + y
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('ﬁndﬂy')
        })

        it('should handle ASCII characters correctly', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro

            // Pure ASCII text
            const bytes = new Uint8Array([
                72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100,
            ])
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('Hello World')
        })

        it('should handle empty byte array', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC')

            const bytes = new Uint8Array([])
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('')
        })

        it('should handle bytes in Latin-1 range (160-255)', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Override 160 to Euro

            // Byte 161 = ¡ in Latin-1, should fall back to standard decoding
            const bytes = new Uint8Array([160, 161, 162]) // Euro + ¡ + ¢
            const result = decodeWithFontEncoding(bytes, encodingMap)

            expect(result).toBe('€¡¢')
        })

        it('should NOT decode UTF-16BE with custom encoding (should be handled at higher level)', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC')

            // UTF-16BE BOM (0xFE 0xFF) followed by UTF-16BE text
            // This test verifies that decodeWithFontEncoding doesn't try to decode UTF-16BE
            // (UTF-16BE should be detected and handled before calling this function)
            const bytes = new Uint8Array([0xfe, 0xff, 0x00, 0x48, 0x00, 0x69]) // BOM + "Hi" in UTF-16BE

            // This will decode incorrectly because UTF-16BE should be handled at a higher level
            // The function will treat 0xFE and 0xFF as separate bytes
            const result = decodeWithFontEncoding(bytes, encodingMap)

            // Should NOT produce "Hi" - that's correct because UTF-16BE handling
            // happens in PdfString.value or AcroFormField.value before calling this
            expect(result).not.toBe('Hi')
        })

        it('should decode complex text with mixed content', () => {
            const encodingMap = new Map<number, string>()
            encodingMap.set(160, '\u20AC') // Euro
            encodingMap.set(128, '\u2022') // Bullet (override PDFDocEncoding)
            encodingMap.set(150, '\uFB01') // fi ligature

            const bytes = new Uint8Array([
                80,
                114,
                105,
                99,
                101,
                58,
                32, // "Price: "
                160,
                50,
                48, // "€20"
                32, // " "
                128, // "•"
                32, // " "
                66,
                101,
                110,
                101, // "Bene"
                150,
                116, // "fit"
            ])

            const result = decodeWithFontEncoding(bytes, encodingMap)
            expect(result).toBe('Price: €20 • Beneﬁt')
        })
    })
})
