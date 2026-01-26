import { ByteArray } from '../../types.js'
import { FontFormat, FontParser } from '../types.js'
import { TtfParser } from './ttf-parser.js'
import { OtfParser } from './otf-parser.js'
import { WoffParser, detectFontFormat } from './woff-parser.js'

/**
 * Parses font files of various formats (TTF, OTF, WOFF).
 * Automatically detects the format and returns the appropriate parser.
 *
 * @example
 * ```typescript
 * const fontData = readFileSync('myfont.woff')
 * const parser = parseFont(fontData)
 * const descriptor = parser.getFontDescriptor()
 * ```
 */
export function parseFont(data: ByteArray): FontParser {
    const format = detectFontFormat(data)

    switch (format) {
        case 'ttf':
            return new TtfParser(data)
        case 'otf':
            return new OtfParser(data)
        case 'woff':
            return new WoffParser(data)
        case 'woff2':
            throw new Error(
                'WOFF2 format is not supported (requires Brotli decompression)',
            )
        default:
            throw new Error(`Unknown or unsupported font format`)
    }
}

/**
 * Checks if a font format is supported.
 */
export function isSupportedFontFormat(format: string): format is FontFormat {
    return format === 'ttf' || format === 'otf' || format === 'woff'
}
