/**
 * Standard PDF encoding tables for bytes 0x80-0x9F.
 *
 * Bytes 0x00-0x7F are ASCII in all encodings.
 * Bytes 0xA0-0xFF match ISO 8859-1 (Latin-1) in WinAnsiEncoding.
 *
 * Only the bytes that differ from `String.fromCharCode(byte)` need mapping.
 * These tables are used when a font specifies a named encoding (e.g.
 * /WinAnsiEncoding) without a ToUnicode CMap or Differences array.
 */

/**
 * WinAnsiEncoding (Windows Code Page 1252) mappings for 0x80-0x9F.
 * These bytes differ from ISO 8859-1 / Unicode Latin-1 Supplement.
 */
export const WIN_ANSI_ENCODING: Map<number, string> = new Map([
    [0x80, '\u20AC'], // EURO SIGN
    // 0x81 undefined
    [0x82, '\u201A'], // SINGLE LOW-9 QUOTATION MARK
    [0x83, '\u0192'], // LATIN SMALL LETTER F WITH HOOK
    [0x84, '\u201E'], // DOUBLE LOW-9 QUOTATION MARK
    [0x85, '\u2026'], // HORIZONTAL ELLIPSIS
    [0x86, '\u2020'], // DAGGER
    [0x87, '\u2021'], // DOUBLE DAGGER
    [0x88, '\u02C6'], // MODIFIER LETTER CIRCUMFLEX ACCENT
    [0x89, '\u2030'], // PER MILLE SIGN
    [0x8a, '\u0160'], // LATIN CAPITAL LETTER S WITH CARON
    [0x8b, '\u2039'], // SINGLE LEFT-POINTING ANGLE QUOTATION MARK
    [0x8c, '\u0152'], // LATIN CAPITAL LIGATURE OE
    // 0x8D undefined
    [0x8e, '\u017D'], // LATIN CAPITAL LETTER Z WITH CARON
    // 0x8F undefined
    // 0x90 undefined
    [0x91, '\u2018'], // LEFT SINGLE QUOTATION MARK
    [0x92, '\u2019'], // RIGHT SINGLE QUOTATION MARK
    [0x93, '\u201C'], // LEFT DOUBLE QUOTATION MARK
    [0x94, '\u201D'], // RIGHT DOUBLE QUOTATION MARK
    [0x95, '\u2022'], // BULLET
    [0x96, '\u2013'], // EN DASH
    [0x97, '\u2014'], // EM DASH
    [0x98, '\u02DC'], // SMALL TILDE
    [0x99, '\u2122'], // TRADE MARK SIGN
    [0x9a, '\u0161'], // LATIN SMALL LETTER S WITH CARON
    [0x9b, '\u203A'], // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
    [0x9c, '\u0153'], // LATIN SMALL LIGATURE OE
    // 0x9D undefined
    [0x9e, '\u017E'], // LATIN SMALL LETTER Z WITH CARON
    [0x9f, '\u0178'], // LATIN CAPITAL LETTER Y WITH DIAERESIS
])

/**
 * MacRomanEncoding mappings for 0x80-0xFF.
 * These bytes differ from ISO 8859-1 / Unicode Latin-1.
 */
export const MAC_ROMAN_ENCODING: Map<number, string> = new Map([
    [0x80, '\u00C4'], // LATIN CAPITAL LETTER A WITH DIAERESIS
    [0x81, '\u00C5'], // LATIN CAPITAL LETTER A WITH RING ABOVE
    [0x82, '\u00C7'], // LATIN CAPITAL LETTER C WITH CEDILLA
    [0x83, '\u00C9'], // LATIN CAPITAL LETTER E WITH ACUTE
    [0x84, '\u00D1'], // LATIN CAPITAL LETTER N WITH TILDE
    [0x85, '\u00D6'], // LATIN CAPITAL LETTER O WITH DIAERESIS
    [0x86, '\u00DC'], // LATIN CAPITAL LETTER U WITH DIAERESIS
    [0x87, '\u00E1'], // LATIN SMALL LETTER A WITH ACUTE
    [0x88, '\u00E0'], // LATIN SMALL LETTER A WITH GRAVE
    [0x89, '\u00E2'], // LATIN SMALL LETTER A WITH CIRCUMFLEX
    [0x8a, '\u00E4'], // LATIN SMALL LETTER A WITH DIAERESIS
    [0x8b, '\u00E3'], // LATIN SMALL LETTER A WITH TILDE
    [0x8c, '\u00E5'], // LATIN SMALL LETTER A WITH RING ABOVE
    [0x8d, '\u00E7'], // LATIN SMALL LETTER C WITH CEDILLA
    [0x8e, '\u00E9'], // LATIN SMALL LETTER E WITH ACUTE
    [0x8f, '\u00E8'], // LATIN SMALL LETTER E WITH GRAVE
    [0x90, '\u00EA'], // LATIN SMALL LETTER E WITH CIRCUMFLEX
    [0x91, '\u00EB'], // LATIN SMALL LETTER E WITH DIAERESIS
    [0x92, '\u00ED'], // LATIN SMALL LETTER I WITH ACUTE
    [0x93, '\u00EC'], // LATIN SMALL LETTER I WITH GRAVE
    [0x94, '\u00EE'], // LATIN SMALL LETTER I WITH CIRCUMFLEX
    [0x95, '\u00EF'], // LATIN SMALL LETTER I WITH DIAERESIS
    [0x96, '\u00F1'], // LATIN SMALL LETTER N WITH TILDE
    [0x97, '\u00F3'], // LATIN SMALL LETTER O WITH ACUTE
    [0x98, '\u00F2'], // LATIN SMALL LETTER O WITH GRAVE
    [0x99, '\u00F4'], // LATIN SMALL LETTER O WITH CIRCUMFLEX
    [0x9a, '\u00F6'], // LATIN SMALL LETTER O WITH DIAERESIS
    [0x9b, '\u00F5'], // LATIN SMALL LETTER O WITH TILDE
    [0x9c, '\u00FA'], // LATIN SMALL LETTER U WITH ACUTE
    [0x9d, '\u00F9'], // LATIN SMALL LETTER U WITH GRAVE
    [0x9e, '\u00FB'], // LATIN SMALL LETTER U WITH CIRCUMFLEX
    [0x9f, '\u00FC'], // LATIN SMALL LETTER U WITH DIAERESIS
    [0xa0, '\u2020'], // DAGGER
    [0xa1, '\u00B0'], // DEGREE SIGN
    [0xa2, '\u00A2'], // CENT SIGN
    [0xa3, '\u00A3'], // POUND SIGN
    [0xa4, '\u00A7'], // SECTION SIGN
    [0xa5, '\u2022'], // BULLET
    [0xa6, '\u00B6'], // PILCROW SIGN
    [0xa7, '\u00DF'], // LATIN SMALL LETTER SHARP S
    [0xa8, '\u00AE'], // REGISTERED SIGN
    [0xa9, '\u00A9'], // COPYRIGHT SIGN
    [0xaa, '\u2122'], // TRADE MARK SIGN
    [0xab, '\u00B4'], // ACUTE ACCENT
    [0xac, '\u00A8'], // DIAERESIS
    [0xad, '\u2260'], // NOT EQUAL TO
    [0xae, '\u00C6'], // LATIN CAPITAL LETTER AE
    [0xaf, '\u00D8'], // LATIN CAPITAL LETTER O WITH STROKE
    [0xb0, '\u221E'], // INFINITY
    [0xb1, '\u00B1'], // PLUS-MINUS SIGN
    [0xb2, '\u2264'], // LESS-THAN OR EQUAL TO
    [0xb3, '\u2265'], // GREATER-THAN OR EQUAL TO
    [0xb4, '\u00A5'], // YEN SIGN
    [0xb5, '\u00B5'], // MICRO SIGN
    [0xb6, '\u2202'], // PARTIAL DIFFERENTIAL
    [0xb7, '\u2211'], // N-ARY SUMMATION
    [0xb8, '\u220F'], // N-ARY PRODUCT
    [0xb9, '\u03C0'], // GREEK SMALL LETTER PI
    [0xba, '\u222B'], // INTEGRAL
    [0xbb, '\u00AA'], // FEMININE ORDINAL INDICATOR
    [0xbc, '\u00BA'], // MASCULINE ORDINAL INDICATOR
    [0xbd, '\u2126'], // OHM SIGN
    [0xbe, '\u00E6'], // LATIN SMALL LETTER AE
    [0xbf, '\u00F8'], // LATIN SMALL LETTER O WITH STROKE
    [0xc0, '\u00BF'], // INVERTED QUESTION MARK
    [0xc1, '\u00A1'], // INVERTED EXCLAMATION MARK
    [0xc2, '\u00AC'], // NOT SIGN
    [0xc3, '\u221A'], // SQUARE ROOT
    [0xc4, '\u0192'], // LATIN SMALL LETTER F WITH HOOK
    [0xc5, '\u2248'], // ALMOST EQUAL TO
    [0xc6, '\u2206'], // INCREMENT
    [0xc7, '\u00AB'], // LEFT-POINTING DOUBLE ANGLE QUOTATION MARK
    [0xc8, '\u00BB'], // RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK
    [0xc9, '\u2026'], // HORIZONTAL ELLIPSIS
    [0xca, '\u00A0'], // NO-BREAK SPACE
    [0xcb, '\u00C0'], // LATIN CAPITAL LETTER A WITH GRAVE
    [0xcc, '\u00C3'], // LATIN CAPITAL LETTER A WITH TILDE
    [0xcd, '\u00D5'], // LATIN CAPITAL LETTER O WITH TILDE
    [0xce, '\u0152'], // LATIN CAPITAL LIGATURE OE
    [0xcf, '\u0153'], // LATIN SMALL LIGATURE OE
    [0xd0, '\u2013'], // EN DASH
    [0xd1, '\u2014'], // EM DASH
    [0xd2, '\u201C'], // LEFT DOUBLE QUOTATION MARK
    [0xd3, '\u201D'], // RIGHT DOUBLE QUOTATION MARK
    [0xd4, '\u2018'], // LEFT SINGLE QUOTATION MARK
    [0xd5, '\u2019'], // RIGHT SINGLE QUOTATION MARK
    [0xd6, '\u00F7'], // DIVISION SIGN
    [0xd7, '\u25CA'], // LOZENGE
    [0xd8, '\u00FF'], // LATIN SMALL LETTER Y WITH DIAERESIS
    [0xd9, '\u0178'], // LATIN CAPITAL LETTER Y WITH DIAERESIS
    [0xda, '\u2044'], // FRACTION SLASH
    [0xdb, '\u20AC'], // EURO SIGN
    [0xdc, '\u2039'], // SINGLE LEFT-POINTING ANGLE QUOTATION MARK
    [0xdd, '\u203A'], // SINGLE RIGHT-POINTING ANGLE QUOTATION MARK
    [0xde, '\uFB01'], // LATIN SMALL LIGATURE FI
    [0xdf, '\uFB02'], // LATIN SMALL LIGATURE FL
    [0xe0, '\u2021'], // DOUBLE DAGGER
    [0xe1, '\u00B7'], // MIDDLE DOT
    [0xe2, '\u201A'], // SINGLE LOW-9 QUOTATION MARK
    [0xe3, '\u201E'], // DOUBLE LOW-9 QUOTATION MARK
    [0xe4, '\u2030'], // PER MILLE SIGN
    [0xe5, '\u00C2'], // LATIN CAPITAL LETTER A WITH CIRCUMFLEX
    [0xe6, '\u00CA'], // LATIN CAPITAL LETTER E WITH CIRCUMFLEX
    [0xe7, '\u00C1'], // LATIN CAPITAL LETTER A WITH ACUTE
    [0xe8, '\u00CB'], // LATIN CAPITAL LETTER E WITH DIAERESIS
    [0xe9, '\u00C8'], // LATIN CAPITAL LETTER E WITH GRAVE
    [0xea, '\u00CD'], // LATIN CAPITAL LETTER I WITH ACUTE
    [0xeb, '\u00CE'], // LATIN CAPITAL LETTER I WITH CIRCUMFLEX
    [0xec, '\u00CF'], // LATIN CAPITAL LETTER I WITH DIAERESIS
    [0xed, '\u00CC'], // LATIN CAPITAL LETTER I WITH GRAVE
    [0xee, '\u00D3'], // LATIN CAPITAL LETTER O WITH ACUTE
    [0xef, '\u00D4'], // LATIN CAPITAL LETTER O WITH CIRCUMFLEX
    [0xf0, '\uF8FF'], // Apple logo (Private Use Area)
    [0xf1, '\u00D2'], // LATIN CAPITAL LETTER O WITH GRAVE
    [0xf2, '\u00DA'], // LATIN CAPITAL LETTER U WITH ACUTE
    [0xf3, '\u00DB'], // LATIN CAPITAL LETTER U WITH CIRCUMFLEX
    [0xf4, '\u00D9'], // LATIN CAPITAL LETTER U WITH GRAVE
    [0xf5, '\u0131'], // LATIN SMALL LETTER DOTLESS I
    [0xf6, '\u02C6'], // MODIFIER LETTER CIRCUMFLEX ACCENT
    [0xf7, '\u02DC'], // SMALL TILDE
    [0xf8, '\u00AF'], // MACRON
    [0xf9, '\u02D8'], // BREVE
    [0xfa, '\u02D9'], // DOT ABOVE
    [0xfb, '\u02DA'], // RING ABOVE
    [0xfc, '\u00B8'], // CEDILLA
    [0xfd, '\u02DD'], // DOUBLE ACUTE ACCENT
    [0xfe, '\u02DB'], // OGONEK
    [0xff, '\u02C7'], // CARON
])

/**
 * Returns the standard encoding table for a given PDF encoding name.
 * Returns null for unknown encodings.
 */
export function getStandardEncoding(name: string): Map<number, string> | null {
    switch (name) {
        case 'WinAnsiEncoding':
            return WIN_ANSI_ENCODING
        case 'MacRomanEncoding':
            return MAC_ROMAN_ENCODING
        default:
            return null
    }
}
