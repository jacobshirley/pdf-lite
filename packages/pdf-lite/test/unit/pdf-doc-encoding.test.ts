import { describe, expect, it } from 'vitest'
import { encodeToPDFDocEncoding } from '../../src/utils/encodeToPDFDocEncoding'
import { decodeFromPDFDocEncoding } from '../../src/utils/decodeFromPDFDocEncoding'

describe('PDFDocEncoding', () => {
    describe('encodeToPDFDocEncoding', () => {
        it('should encode ASCII characters (0-127)', () => {
            const result = encodeToPDFDocEncoding('Hello')
            expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]))
        })

        it('should encode empty string', () => {
            const result = encodeToPDFDocEncoding('')
            expect(result.length).toBe(0)
        })

        it('should encode bullet character (U+2022 → 0x80)', () => {
            const result = encodeToPDFDocEncoding('•')
            expect(result).toEqual(new Uint8Array([0x80]))
        })

        it('should encode dagger character (U+2020 → 0x81)', () => {
            const result = encodeToPDFDocEncoding('†')
            expect(result).toEqual(new Uint8Array([0x81]))
        })

        it('should encode em dash character (U+2014 → 0x84)', () => {
            const result = encodeToPDFDocEncoding('—')
            expect(result).toEqual(new Uint8Array([0x84]))
        })

        it('should encode en dash character (U+2013 → 0x85)', () => {
            const result = encodeToPDFDocEncoding('–')
            expect(result).toEqual(new Uint8Array([0x85]))
        })

        it('should encode trademark character (U+2122 → 0x92)', () => {
            const result = encodeToPDFDocEncoding('™')
            expect(result).toEqual(new Uint8Array([0x92]))
        })

        it('should encode fi ligature (U+FB01 → 0x93)', () => {
            const result = encodeToPDFDocEncoding('ﬁ')
            expect(result).toEqual(new Uint8Array([0x93]))
        })

        it('should encode fl ligature (U+FB02 → 0x94)', () => {
            const result = encodeToPDFDocEncoding('ﬂ')
            expect(result).toEqual(new Uint8Array([0x94]))
        })

        it('should encode OE ligature (U+0152 → 0x96)', () => {
            const result = encodeToPDFDocEncoding('Œ')
            expect(result).toEqual(new Uint8Array([0x96]))
        })

        it('should encode ISO Latin-1 characters (160-255)', () => {
            // Non-breaking space (0xA0)
            const result = encodeToPDFDocEncoding('\u00A0')
            expect(result).toEqual(new Uint8Array([0xa0]))
        })

        it('should encode copyright symbol (©, U+00A9 → 0xA9)', () => {
            const result = encodeToPDFDocEncoding('©')
            expect(result).toEqual(new Uint8Array([0xa9]))
        })

        it('should encode mixed ASCII and special characters', () => {
            const result = encodeToPDFDocEncoding('Test • item')
            expect(result).toEqual(
                new Uint8Array([
                    84, 101, 115, 116, 32, 0x80, 32, 105, 116, 101, 109,
                ]),
            )
        })

        it('should encode string with em dash', () => {
            const result = encodeToPDFDocEncoding('Cost—$5')
            expect(result).toEqual(
                new Uint8Array([67, 111, 115, 116, 0x84, 36, 53]),
            )
        })

        it('should handle characters not in PDFDocEncoding with fallback', () => {
            // Emoji not in PDFDocEncoding should use fallback (?)
            const result = encodeToPDFDocEncoding('Test 😀')
            expect(result[result.length - 1]).toBe(0x3f) // '?'
        })
    })

    describe('decodeFromPDFDocEncoding', () => {
        it('should decode ASCII characters (0-127)', () => {
            const bytes = new Uint8Array([72, 101, 108, 108, 111])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('Hello')
        })

        it('should decode empty array', () => {
            const bytes = new Uint8Array([])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('')
        })

        it('should decode bullet character (0x80 → U+2022)', () => {
            const bytes = new Uint8Array([0x80])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('•')
        })

        it('should decode dagger character (0x81 → U+2020)', () => {
            const bytes = new Uint8Array([0x81])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('†')
        })

        it('should decode em dash character (0x84 → U+2014)', () => {
            const bytes = new Uint8Array([0x84])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('—')
        })

        it('should decode en dash character (0x85 → U+2013)', () => {
            const bytes = new Uint8Array([0x85])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('–')
        })

        it('should decode trademark character (0x92 → U+2122)', () => {
            const bytes = new Uint8Array([0x92])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('™')
        })

        it('should decode fi ligature (0x93 → U+FB01)', () => {
            const bytes = new Uint8Array([0x93])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('ﬁ')
        })

        it('should decode fl ligature (0x94 → U+FB02)', () => {
            const bytes = new Uint8Array([0x94])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('ﬂ')
        })

        it('should decode OE ligature (0x96 → U+0152)', () => {
            const bytes = new Uint8Array([0x96])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('Œ')
        })

        it('should decode ISO Latin-1 characters (160-255)', () => {
            // Non-breaking space (0xA0)
            const bytes = new Uint8Array([0xa0])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('\u00A0')
        })

        it('should decode copyright symbol (0xA9 → ©)', () => {
            const bytes = new Uint8Array([0xa9])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('©')
        })

        it('should decode mixed ASCII and special characters', () => {
            const bytes = new Uint8Array([
                84, 101, 115, 116, 32, 0x80, 32, 105, 116, 101, 109,
            ])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('Test • item')
        })

        it('should decode string with em dash', () => {
            const bytes = new Uint8Array([67, 111, 115, 116, 0x84, 36, 53])
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('Cost—$5')
        })

        it('should decode CITT with special characters', () => {
            // Simulating the user's case: CITT followed by special chars
            const bytes = new Uint8Array([67, 73, 84, 84, 0xa0, 50]) // CITT + non-breaking space + '2'
            const result = decodeFromPDFDocEncoding(bytes)
            expect(result).toBe('CITT\u00A0' + '2')
            expect(result).not.toContain('�')
        })
    })

    describe('Round-trip encoding/decoding', () => {
        it('should preserve ASCII strings', () => {
            const original = 'Hello World!'
            const encoded = encodeToPDFDocEncoding(original)
            const decoded = decodeFromPDFDocEncoding(encoded)
            expect(decoded).toBe(original)
        })

        it('should preserve special PDF characters', () => {
            const original = '• † ‡ … — – ƒ'
            const encoded = encodeToPDFDocEncoding(original)
            const decoded = decodeFromPDFDocEncoding(encoded)
            expect(decoded).toBe(original)
        })

        it('should preserve ligatures', () => {
            const original = 'ﬁle ﬂow'
            const encoded = encodeToPDFDocEncoding(original)
            const decoded = decodeFromPDFDocEncoding(encoded)
            expect(decoded).toBe(original)
        })

        it('should preserve mixed content', () => {
            const original = 'Price—$10 • Item™'
            const encoded = encodeToPDFDocEncoding(original)
            const decoded = decodeFromPDFDocEncoding(encoded)
            expect(decoded).toBe(original)
        })

        it('should preserve ISO Latin-1 characters', () => {
            const original = 'Café © 2024'
            const encoded = encodeToPDFDocEncoding(original)
            const decoded = decodeFromPDFDocEncoding(encoded)
            expect(decoded).toBe(original)
        })
    })
})
