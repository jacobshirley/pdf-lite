/**
 * Standard PDF encoding tables mapping byte codes to glyph names.
 * Based on PDF Reference 1.7, Appendix D - Character Sets and Encodings.
 */

/**
 * WinAnsiEncoding (Windows Code Page 1252)
 * Used primarily for Latin text on Windows platforms.
 */
export const WIN_ANSI_ENCODING: readonly (string | undefined)[] = [
    // 0-31: Control characters (undefined in encoding)
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    // 32-127: ASCII
    'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quotesingle',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question',
    'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
    'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
    'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', undefined,
    // 128-159: Windows-1252 specific
    'Euro', undefined, 'quotesinglbase', 'florin', 'quotedblbase', 'ellipsis', 'dagger', 'daggerdbl',
    'circumflex', 'perthousand', 'Scaron', 'guilsinglleft', 'OE', undefined, 'Zcaron', undefined,
    undefined, 'quoteleft', 'quoteright', 'quotedblleft', 'quotedblright', 'bullet', 'endash', 'emdash',
    'tilde', 'trademark', 'scaron', 'guilsinglright', 'oe', undefined, 'zcaron', 'Ydieresis',
    // 160-255: ISO Latin-1 supplement
    'space', 'exclamdown', 'cent', 'sterling', 'currency', 'yen', 'brokenbar', 'section',
    'dieresis', 'copyright', 'ordfeminine', 'guillemotleft', 'logicalnot', 'hyphen', 'registered', 'macron',
    'degree', 'plusminus', 'twosuperior', 'threesuperior', 'acute', 'mu', 'paragraph', 'periodcentered',
    'cedilla', 'onesuperior', 'ordmasculine', 'guillemotright', 'onequarter', 'onehalf', 'threequarters', 'questiondown',
    'Agrave', 'Aacute', 'Acircumflex', 'Atilde', 'Adieresis', 'Aring', 'AE', 'Ccedilla',
    'Egrave', 'Eacute', 'Ecircumflex', 'Edieresis', 'Igrave', 'Iacute', 'Icircumflex', 'Idieresis',
    'Eth', 'Ntilde', 'Ograve', 'Oacute', 'Ocircumflex', 'Otilde', 'Odieresis', 'multiply',
    'Oslash', 'Ugrave', 'Uacute', 'Ucircumflex', 'Udieresis', 'Yacute', 'Thorn', 'germandbls',
    'agrave', 'aacute', 'acircumflex', 'atilde', 'adieresis', 'aring', 'ae', 'ccedilla',
    'egrave', 'eacute', 'ecircumflex', 'edieresis', 'igrave', 'iacute', 'icircumflex', 'idieresis',
    'eth', 'ntilde', 'ograve', 'oacute', 'ocircumflex', 'otilde', 'odieresis', 'divide',
    'oslash', 'ugrave', 'uacute', 'ucircumflex', 'udieresis', 'yacute', 'thorn', 'ydieresis',
]

/**
 * MacRomanEncoding (Mac OS Roman)
 * Used primarily for Latin text on Mac OS platforms.
 */
export const MAC_ROMAN_ENCODING: readonly (string | undefined)[] = [
    // 0-31: Control characters (undefined in encoding)
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    // 32-127: ASCII (same as WinAnsi)
    'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quotesingle',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question',
    'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
    'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'grave', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
    'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', undefined,
    // 128-255: Mac Roman specific
    'Adieresis', 'Aring', 'Ccedilla', 'Eacute', 'Ntilde', 'Odieresis', 'Udieresis', 'aacute',
    'agrave', 'acircumflex', 'adieresis', 'atilde', 'aring', 'ccedilla', 'eacute', 'egrave',
    'ecircumflex', 'edieresis', 'iacute', 'igrave', 'icircumflex', 'idieresis', 'ntilde', 'oacute',
    'ograve', 'ocircumflex', 'odieresis', 'otilde', 'uacute', 'ugrave', 'ucircumflex', 'udieresis',
    'dagger', 'degree', 'cent', 'sterling', 'section', 'bullet', 'paragraph', 'germandbls',
    'registered', 'copyright', 'trademark', 'acute', 'dieresis', 'notequal', 'AE', 'Oslash',
    'infinity', 'plusminus', 'lessequal', 'greaterequal', 'yen', 'mu', 'partialdiff', 'summation',
    'product', 'pi', 'integral', 'ordfeminine', 'ordmasculine', 'Omega', 'ae', 'oslash',
    'questiondown', 'exclamdown', 'logicalnot', 'radical', 'florin', 'approxequal', 'Delta', 'guillemotleft',
    'guillemotright', 'ellipsis', 'space', 'Agrave', 'Atilde', 'Otilde', 'OE', 'oe',
    'endash', 'emdash', 'quotedblleft', 'quotedblright', 'quoteleft', 'quoteright', 'divide', 'lozenge',
    'ydieresis', 'Ydieresis', 'fraction', 'currency', 'guilsinglleft', 'guilsinglright', 'fi', 'fl',
    'daggerdbl', 'periodcentered', 'quotesinglbase', 'quotedblbase', 'perthousand', 'Acircumflex', 'Ecircumflex', 'Aacute',
    'Edieresis', 'Egrave', 'Iacute', 'Icircumflex', 'Idieresis', 'Igrave', 'Oacute', 'Ocircumflex',
    'apple', 'Ograve', 'Uacute', 'Ucircumflex', 'Ugrave', 'dotlessi', 'circumflex', 'tilde',
    'macron', 'breve', 'dotaccent', 'ring', 'cedilla', 'hungarumlaut', 'ogonek', 'caron',
]

/**
 * StandardEncoding (Adobe Standard Encoding)
 * The default encoding for Type 1 fonts.
 */
export const STANDARD_ENCODING: readonly (string | undefined)[] = [
    // 0-31: Control characters (undefined in encoding)
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    // 32-127: Standard printable ASCII
    'space', 'exclam', 'quotedbl', 'numbersign', 'dollar', 'percent', 'ampersand', 'quoteright',
    'parenleft', 'parenright', 'asterisk', 'plus', 'comma', 'hyphen', 'period', 'slash',
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine', 'colon', 'semicolon', 'less', 'equal', 'greater', 'question',
    'at', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
    'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W',
    'X', 'Y', 'Z', 'bracketleft', 'backslash', 'bracketright', 'asciicircum', 'underscore',
    'quoteleft', 'a', 'b', 'c', 'd', 'e', 'f', 'g',
    'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
    'x', 'y', 'z', 'braceleft', 'bar', 'braceright', 'asciitilde', undefined,
    // 128-159: Undefined
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    // 160-255: Adobe Standard specific
    undefined, 'exclamdown', 'cent', 'sterling', 'fraction', 'yen', 'florin', 'section',
    'currency', 'quotesingle', 'quotedblleft', 'guillemotleft', 'guilsinglleft', 'guilsinglright', 'fi', 'fl',
    undefined, 'endash', 'dagger', 'daggerdbl', 'periodcentered', undefined, 'paragraph', 'bullet',
    'quotesinglbase', 'quotedblbase', 'quotedblright', 'guillemotright', 'ellipsis', 'perthousand', undefined, 'questiondown',
    undefined, 'grave', 'acute', 'circumflex', 'tilde', 'macron', 'breve', 'dotaccent',
    'dieresis', undefined, 'ring', 'cedilla', undefined, 'hungarumlaut', 'ogonek', 'caron',
    'emdash', undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    undefined, 'AE', undefined, 'ordfeminine', undefined, undefined, undefined, undefined,
    'Lslash', 'Oslash', 'OE', 'ordmasculine', undefined, undefined, undefined, undefined,
    undefined, 'ae', undefined, undefined, undefined, 'dotlessi', undefined, undefined,
    'lslash', 'oslash', 'oe', 'germandbls', undefined, undefined, undefined, undefined,
]

/**
 * Gets the glyph name for a byte code in the specified encoding.
 */
export function getGlyphName(encoding: string, code: number): string | undefined {
    if (code < 0 || code > 255) return undefined
    
    switch (encoding) {
        case 'WinAnsiEncoding':
            return WIN_ANSI_ENCODING[code]
        case 'MacRomanEncoding':
            return MAC_ROMAN_ENCODING[code]
        case 'StandardEncoding':
            return STANDARD_ENCODING[code]
        default:
            return undefined
    }
}

/**
 * Builds a complete encoding map (byte → Unicode) for a standard encoding.
 * Combines the standard encoding table with glyph name to Unicode mapping.
 */
export function buildStandardEncodingMap(encoding: string): Map<number, string> | null {
    const { GLYPH_NAME_TO_UNICODE } = require('./glyphNameToUnicode.js')
    const encodingTable = getEncodingTable(encoding)
    
    if (!encodingTable) return null
    
    const map = new Map<number, string>()
    
    for (let code = 0; code < 256; code++) {
        const glyphName = encodingTable[code]
        if (glyphName) {
            const unicode = GLYPH_NAME_TO_UNICODE[glyphName]
            if (unicode) {
                map.set(code, unicode)
            }
        }
    }
    
    return map.size > 0 ? map : null
}

/**
 * Gets the encoding table for a standard encoding name.
 */
function getEncodingTable(encoding: string): readonly (string | undefined)[] | null {
    switch (encoding) {
        case 'WinAnsiEncoding':
            return WIN_ANSI_ENCODING
        case 'MacRomanEncoding':
            return MAC_ROMAN_ENCODING
        case 'StandardEncoding':
            return STANDARD_ENCODING
        default:
            return null
    }
}
