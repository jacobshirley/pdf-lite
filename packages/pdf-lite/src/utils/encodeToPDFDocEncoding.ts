import { ByteArray } from '../types.js'

/**
 * Reverse mapping from Unicode characters to PDFDocEncoding bytes (128-159).
 */
const UNICODE_TO_PDF_DOC_ENCODING: Record<string, number> = {
    '\u2022': 0x80, // BULLET
    '\u2020': 0x81, // DAGGER
    '\u2021': 0x82, // DOUBLE DAGGER
    '\u2026': 0x83, // HORIZONTAL ELLIPSIS
    '\u2014': 0x84, // EM DASH
    '\u2013': 0x85, // EN DASH
    '\u0192': 0x86, // LATIN SMALL LETTER F WITH HOOK
    '\u2044': 0x87, // FRACTION SLASH
    '\u2039': 0x88, // SINGLE LEFT-POINTING ANGLE QUOTATION MARK
    '\u203a': 0x89, // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
    '\u2212': 0x8a, // MINUS SIGN
    '\u2030': 0x8b, // PER MILLE SIGN
    '\u201e': 0x8c, // DOUBLE LOW-9 QUOTATION MARK
    '\u201c': 0x8d, // LEFT DOUBLE QUOTATION MARK
    '\u201d': 0x8e, // RIGHT DOUBLE QUOTATION MARK
    '\u2018': 0x8f, // LEFT SINGLE QUOTATION MARK
    '\u2019': 0x90, // RIGHT SINGLE QUOTATION MARK
    '\u201a': 0x91, // SINGLE LOW-9 QUOTATION MARK
    '\u2122': 0x92, // TRADE MARK SIGN
    '\ufb01': 0x93, // LATIN SMALL LIGATURE FI
    '\ufb02': 0x94, // LATIN SMALL LIGATURE FL
    '\u0141': 0x95, // LATIN CAPITAL LETTER L WITH STROKE
    '\u0152': 0x96, // LATIN CAPITAL LIGATURE OE
    '\u0160': 0x97, // LATIN CAPITAL LETTER S WITH CARON
    '\u0178': 0x98, // LATIN CAPITAL LETTER Y WITH DIAERESIS
    '\u017d': 0x99, // LATIN CAPITAL LETTER Z WITH CARON
    '\u0131': 0x9a, // LATIN SMALL LETTER DOTLESS I
    '\u0142': 0x9b, // LATIN SMALL LETTER L WITH STROKE
    '\u0153': 0x9c, // LATIN SMALL LIGATURE OE
    '\u0161': 0x9d, // LATIN SMALL LETTER S WITH CARON
    '\u017e': 0x9e, // LATIN SMALL LETTER Z WITH CARON
}

/**
 * Encodes a JavaScript string to PDFDocEncoding bytes.
 *
 * PDFDocEncoding is the default encoding for PDF strings:
 * - Bytes 0-127: Standard ASCII
 * - Bytes 128-159: Special Unicode characters (see PDF spec)
 * - Bytes 160-255: ISO Latin-1 (ISO 8859-1)
 *
 * @param str - The string to encode.
 * @returns The encoded byte array.
 *
 * @example
 * ```typescript
 * // Encode "Hello" (ASCII)
 * encodeToPDFDocEncoding('Hello')
 *
 * // Encode with special character (bullet → 0x80)
 * encodeToPDFDocEncoding('H•i')
 * ```
 */
export function encodeToPDFDocEncoding(str: string): ByteArray {
    const bytes: number[] = []

    for (let i = 0; i < str.length; i++) {
        const char = str[i]
        const code = char.charCodeAt(0)

        // Check if it's a special PDF character
        if (UNICODE_TO_PDF_DOC_ENCODING[char] !== undefined) {
            bytes.push(UNICODE_TO_PDF_DOC_ENCODING[char])
        } else if (code < 256) {
            // ASCII or ISO Latin-1 (0-255)
            bytes.push(code)
        } else {
            // Character not representable in PDFDocEncoding
            // This should trigger UTF-16BE encoding instead
            bytes.push(0x3f) // '?' as fallback
        }
    }

    return new Uint8Array(bytes)
}
