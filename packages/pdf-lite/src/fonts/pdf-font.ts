import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { buildEncodingMap } from '../utils/decodeWithFontEncoding.js'
import { getStandardEncoding } from '../utils/standardEncodings.js'
import { getGlyphNameFromUnicode } from '../utils/glyphNameToUnicode.js'
import type { CIDWidth, FontParser, AfmFont } from './types.js'
import type { ByteArray } from '../types.js'
import { parseFont } from './parsers/font-parser.js'
import { OtfParser } from './parsers/otf-parser.js'
import { PdfHexadecimal } from '../core/index.js'
import { PdfFontDescriptor } from './pdf-font-descriptor.js'

import HelveticaAfm from './vendor/Adobe/Core14/Helvetica.json'
import HelveticaBoldAfm from './vendor/Adobe/Core14/Helvetica-Bold.json'
import HelveticaObliqueAfm from './vendor/Adobe/Core14/Helvetica-Oblique.json'
import HelveticaBoldObliqueAfm from './vendor/Adobe/Core14/Helvetica-BoldOblique.json'
import TimesRomanAfm from './vendor/Adobe/Core14/Times-Roman.json'
import TimesBoldAfm from './vendor/Adobe/Core14/Times-Bold.json'
import TimesItalicAfm from './vendor/Adobe/Core14/Times-Italic.json'
import TimesBoldItalicAfm from './vendor/Adobe/Core14/Times-BoldItalic.json'
import CourierAfm from './vendor/Adobe/Core14/Courier.json'
import CourierBoldAfm from './vendor/Adobe/Core14/Courier-Bold.json'
import CourierObliqueAfm from './vendor/Adobe/Core14/Courier-Oblique.json'
import CourierBoldObliqueAfm from './vendor/Adobe/Core14/Courier-BoldOblique.json'
import SymbolAfm from './vendor/Adobe/Core14/Symbol.json'
import ZapfDingbatsAfm from './vendor/Adobe/Core14/ZapfDingbats.json'
import { stringToBytes } from '../utils/stringToBytes.js'

type PdfFontDictionary = PdfDictionary<{
    Type: PdfName<'Font'>
    Subtype: PdfName<'Type1' | 'TrueType' | 'Type0'>
    BaseFont: PdfName
    FontDescriptor?: PdfObjectReference
    Encoding?: PdfName
    FirstChar?: PdfNumber
    LastChar?: PdfNumber
    Widths?:
        | PdfArray<PdfNumber>
        | PdfObjectReference<PdfIndirectObject<PdfArray<PdfNumber>>>
    DescendantFonts?: PdfArray<PdfObjectReference>
    ToUnicode?: PdfObjectReference
    FontMatrix?: PdfArray<PdfNumber>
}>

type PdfStandardFontName =
    | 'Helvetica'
    | 'Helvetica-Bold'
    | 'Helvetica-Oblique'
    | 'Helvetica-BoldOblique'
    | 'Times-Roman'
    | 'Times-Bold'
    | 'Times-Italic'
    | 'Times-BoldItalic'
    | 'Courier'
    | 'Courier-Bold'
    | 'Courier-Oblique'
    | 'Courier-BoldOblique'
    | 'Symbol'
    | 'ZapfDingbats'

/**
 * Represents an embedded font in a PDF document.
 * Extends PdfIndirectObject with a PdfDictionary content for the font dict.
 */
export class PdfFont extends PdfIndirectObject<PdfFontDictionary> {
    /**
     * The PDF resource name used in content streams (e.g., 'F1', 'F2').
     * This is the identifier used in PDF operators like `/F1 12 Tf`.
     */
    resourceName: string

    private static _resourceCounter = 0
    private static nextResourceName(): string {
        return `F${++PdfFont._resourceCounter}`
    }

    metrics: PdfFontDescriptor

    constructor(font: PdfIndirectObject)
    constructor(fontName: string)
    constructor(options: {
        fontName?: string
        resourceName?: string
        encoding?: string
        metrics?: PdfFontDescriptor
    })
    constructor(
        optionsOrFontName:
            | string
            | {
                  fontName?: string
                  resourceName?: string
                  encoding?: string
                  metrics?: PdfFontDescriptor
              }
            | PdfIndirectObject,
    ) {
        super(new PdfIndirectObject({ content: new PdfDictionary() }))

        if (optionsOrFontName instanceof PdfIndirectObject) {
            // Handle PdfIndirectObject input (existing font object)
            const fontObj = optionsOrFontName
            if (!(fontObj.content instanceof PdfDictionary)) {
                throw new Error(
                    'PdfIndirectObject content must be a PdfDictionary',
                )
            }
            this.content = fontObj.content as PdfFontDictionary
            this.metrics = PdfFontDescriptor.fromPdfFontDict(this.content)
            // Preserve resourceName from PdfFont sources; fall back to
            // reference key for raw indirect objects already in a document,
            // and finally generate a fresh name for unassigned objects.
            this.resourceName =
                fontObj instanceof PdfFont
                    ? fontObj.resourceName
                    : fontObj.objectNumber >= 0
                      ? fontObj.reference.key
                      : PdfFont.nextResourceName()
            return
        }

        // Handle string parameter (simple fontName)
        if (typeof optionsOrFontName === 'string') {
            this.fontName = optionsOrFontName
            this.resourceName = optionsOrFontName
            this.metrics = new PdfFontDescriptor({})
            return
        }

        // Handle options object
        const options = optionsOrFontName
        this.fontName = options.fontName
        this.resourceName = options.resourceName || PdfFont.nextResourceName()
        this.encoding = options.encoding
        this.metrics = options.metrics ?? new PdfFontDescriptor({})
    }

    get dict(): PdfFontDictionary {
        return this.content
    }

    get fontName(): string | undefined {
        const baseFont = this.content.get('BaseFont')
        if (!baseFont) {
            return undefined
        }
        return baseFont.value
    }

    set fontName(name: string | undefined) {
        if (!name) {
            this.content.delete('BaseFont')
            return
        }
        this.content.set('BaseFont', new PdfName(name))
    }

    get encoding(): string | undefined {
        const encoding = this.content.get('Encoding')
        return encoding ? encoding.value : undefined
    }

    set encoding(enc: string | undefined) {
        if (enc) {
            this.content.set('Encoding', new PdfName(enc))
        } else {
            this.content.delete('Encoding')
        }
    }

    /**
     * Gets the encoding map from the font's Encoding.
     * Combines the base encoding (e.g. WinAnsiEncoding) with any
     * Differences overrides. Returns null only when no encoding info exists.
     */
    get encodingMap(): Map<number, string> | null {
        const enc = this.content.get('Encoding')
        if (!enc) return null

        const encObj =
            enc instanceof PdfObjectReference ? enc.resolve()?.content : enc

        // Encoding can be a name (/WinAnsiEncoding) or a dictionary
        let baseEncodingName: string | undefined
        let diffs: PdfArray | undefined

        if (encObj instanceof PdfDictionary) {
            baseEncodingName = encObj.get('BaseEncoding')?.value
            diffs = encObj.get('Differences')?.as(PdfArray)
        } else if (encObj instanceof PdfName) {
            baseEncodingName = encObj.value
        }

        // Start with the standard encoding table if available
        const baseMap = baseEncodingName
            ? getStandardEncoding(baseEncodingName)
            : null

        // Build Differences overlay
        const diffsMap = diffs ? buildEncodingMap(diffs) : null

        if (!baseMap && !diffsMap) return null

        if (baseMap && diffsMap) {
            // Merge: Differences override base encoding
            const merged = new Map(baseMap)
            for (const [code, char] of diffsMap) {
                merged.set(code, char)
            }
            return merged
        }

        return baseMap ?? diffsMap
    }

    /**
     * Gets the reverse encoding map (Unicode character → byte code).
     * Useful for encoding text back into the font's custom encoding.
     */
    get reverseEncodingMap(): Map<string, number> | undefined {
        const map = this.encodingMap
        if (!map) return undefined
        return new Map(Array.from(map, ([code, char]) => [char, code]))
    }

    /**
     * Whether this font uses Unicode (Type0/composite) encoding.
     */
    get isUnicode(): boolean {
        return this.fontType === 'Type0'
    }

    /**
     * Whether this font requires glyph-code encoding via its ToUnicode map
     * (as opposed to standard WinAnsi / MacRoman encoding).
     * True for Type0 (CID) and Type3 fonts.
     */
    get requiresToUnicodeEncoding(): boolean {
        return this.fontType === 'Type0' || this.fontType === 'Type3'
    }

    /**
     * Gets the original font file bytes.
     * Available for embedded fonts, undefined for standard fonts or loaded fonts.
     */
    get fontData(): ByteArray | undefined {
        return this.metrics?.fontData
    }

    /**
     * Lazily parses and returns the ToUnicode CMap for this font.
     * Returns null if no ToUnicode stream is available.
     */
    get toUnicodeMap(): Map<number, string> | null {
        const toUnicodeRef = this.content.get('ToUnicode')
        if (!toUnicodeRef) {
            return null
        }

        const resolved =
            toUnicodeRef instanceof PdfObjectReference
                ? toUnicodeRef.resolve()
                : null
        const stream = resolved?.content
        if (stream instanceof PdfStream) {
            const cmapContent = stream.dataAsString
            if (cmapContent) {
                return PdfFont.parseToUnicodeCMap(cmapContent)
            }
        }

        return null
    }

    /**
     * Gets the font type (Subtype in PDF).
     */
    get fontType():
        | 'Type1'
        | 'TrueType'
        | 'Type0'
        | 'MMType1'
        | 'Type3'
        | undefined {
        const subtype = this.content.get('Subtype')
        return subtype?.value as
            | 'Type1'
            | 'TrueType'
            | 'Type0'
            | 'MMType1'
            | 'Type3'
            | undefined
    }

    /**
     * Sets the font type (Subtype in PDF).
     */
    set fontType(
        type: 'Type1' | 'TrueType' | 'Type0' | 'MMType1' | 'Type3' | undefined,
    ) {
        if (type) {
            this.content.set(
                'Subtype',
                new PdfName(type) as PdfName<'Type1' | 'TrueType' | 'Type0'>,
            )
        } else {
            this.content.delete('Subtype')
        }
    }

    /**
     * Gets the first character code in the Widths array.
     */
    get firstChar(): number | undefined {
        const firstChar = this.content.get('FirstChar')
        return firstChar?.value
    }

    /**
     * Sets the first character code in the Widths array.
     */
    set firstChar(value: number | undefined) {
        if (value !== undefined) {
            this.content.set('FirstChar', new PdfNumber(value))
        } else {
            this.content.delete('FirstChar')
        }
    }

    /**
     * Gets the last character code in the Widths array.
     */
    get lastChar(): number | undefined {
        const lastChar = this.content.get('LastChar')
        return lastChar?.value
    }

    /**
     * Sets the last character code in the Widths array.
     */
    set lastChar(value: number | undefined) {
        if (value !== undefined) {
            this.content.set('LastChar', new PdfNumber(value))
        } else {
            this.content.delete('LastChar')
        }
    }

    /**
     * Gets the character widths array.
     */
    get widths(): number[] | undefined {
        const widths = this.content.get('Widths')
        if (!widths) return undefined
        if (widths instanceof PdfObjectReference) {
            const resolved = widths.resolve()
            return resolved.content.items.map((item) => item.value)
        }
        return widths.items.map((item) => item.value)
    }

    /**
     * Sets the character widths array.
     */
    set widths(values: number[] | undefined) {
        if (values) {
            this.content.set(
                'Widths',
                new PdfArray(values.map((w) => new PdfNumber(w))),
            )
        } else {
            this.content.delete('Widths')
        }
    }

    /**
     * Gets the raw character width (in 1000-unit em square) for a character code.
     * Returns null if the character is not in the font's width table.
     *
     * @param charCode - The character code to get the width for
     * @returns The raw character width or null if not found
     */
    getRawCharacterWidth(charCode: number): number | null {
        // For Type1/TrueType fonts, prefer the /Widths array from the PDF
        // font dictionary.  It contains the authoritative widths for each
        // character code in the font's encoding, which may differ from the
        // standard AFM metrics when a custom Encoding/Differences is used.
        if (this.widths !== undefined && this.firstChar !== undefined) {
            const widthIndex = charCode - this.firstChar
            if (widthIndex >= 0 && widthIndex < this.widths.length) {
                return this.widths[widthIndex]
            }
        }

        // Try descriptor's charWidths (AFM / parsed font metrics)
        const metricsWidth = this.metrics.getCharWidth(charCode)
        if (metricsWidth !== undefined) {
            return metricsWidth
        }

        // For Type0 fonts, fall back to default width
        if (this.isUnicode) {
            return this.metrics.defaultWidth ?? 1000
        }

        // For standard base-14 fonts the PDF spec allows omitting /Widths.
        // Fall back to the built-in AFM metrics when available.
        const stdFont = this.fontName
            ? PdfFont.getStandardFont(this.fontName)
            : null
        if (stdFont && stdFont !== this) {
            // Direct code lookup (works when PDF encoding matches AFM encoding)
            const directWidth = stdFont.getRawCharacterWidth(charCode)
            if (directWidth !== null) return directWidth

            // Code mismatch (e.g. WinAnsiEncoding code 150 = endash, but AFM
            // uses StandardEncoding code 177).  Resolve through encoding →
            // Unicode → glyph name → width.
            const encMap = this.encodingMap
            const unicode =
                encMap?.get(charCode) ??
                (charCode < 128 ? String.fromCharCode(charCode) : null)
            if (unicode) {
                const glyphName = getGlyphNameFromUnicode(unicode)
                if (glyphName) {
                    const w = stdFont.metrics.getCharWidthByName(glyphName)
                    if (w !== undefined) return w
                }
            }
        }

        return null
    }

    /**
     * Gets the scaling factor from the font matrix's horizontal component.
     * For Type3 fonts this reads the FontMatrix entry; for other fonts
     * the standard 0.001 (1/1000) is used.
     */
    get fontMatrixScale(): number {
        if (this.fontType === 'Type3') {
            const fm = this.content.get('FontMatrix')
            if (fm instanceof PdfArray && fm.items.length >= 1) {
                const val = fm.items[0]
                if (val instanceof PdfNumber) return Math.abs(val.value)
            }
        }
        return 0.001
    }

    /**
     * Gets the character width scaled to the specified font size.
     * For Type3 fonts this accounts for the FontMatrix scaling factor.
     * Returns null if the character is not in the font's width table.
     *
     * @param charCode - The character code to get the width for
     * @param fontSize - The font size to scale to
     * @returns The scaled character width or null if not found
     */
    getCharacterWidth(charCode: number, fontSize: number): number | null {
        const rawWidth = this.getRawCharacterWidth(charCode)
        if (rawWidth === null) return null
        return rawWidth * this.fontMatrixScale * fontSize
    }

    /**
     * Checks if the font has width data for a character code.
     *
     * @param charCode - The character code to check
     * @returns True if width data is available, false otherwise
     */
    hasCharacterWidth(charCode: number): boolean {
        return this.getRawCharacterWidth(charCode) !== null
    }

    /**
     * Gets character widths for all characters in a string.
     * Returns null for characters not in the font's width table.
     *
     * @param text - The text to get character widths for
     * @param fontSize - The font size to scale to
     * @returns Array of character widths (null for missing characters)
     */
    getCharacterWidthsForString(
        text: string,
        fontSize: number,
    ): (number | null)[] {
        const widths: (number | null)[] = []

        for (const char of text) {
            const charCode = char.charCodeAt(0)
            widths.push(this.getCharacterWidth(charCode, fontSize))
        }

        return widths
    }

    /**
     * Sum glyph advances for `text` at `fontSize`. Characters with no
     * width entry fall back to `fontSize * missingWidthFactor` (default
     * 0.6, a common heuristic for proportional Latin fonts).
     */
    measureString(
        text: string,
        fontSize: number,
        opts?: { missingWidthFactor?: number },
    ): number {
        const fallback = fontSize * (opts?.missingWidthFactor ?? 0.6)
        let width = 0
        for (const char of text) {
            const w = this.getCharacterWidth(char.charCodeAt(0), fontSize)
            width += w !== null ? w : fallback
        }
        return width
    }

    /**
     * Returns the resource name for string coercion.
     * This enables using PdfFont objects in template literals like:
     * ```typescript
     * const da = `/${font} 12 Tf 0 g`
     * ```
     */
    toString(): string {
        return this.resourceName
    }

    /**
     * Encodes a Unicode string into a PDF-delimited string operand for use with Tj.
     *
     * - Type0 (CID) fonts: returns `<XXXX...>` (2-byte CIDs, Identity-H assumed)
     * - Fonts with a custom Differences encoding: returns `<XX...>` using the reverse map
     * - Standard/simple fonts: returns `(text)` with PDF literal string escaping
     */
    /**
     * For CFF fonts: maps Unicode code point → glyph ID for all cmap entries.
     * Used by encode() to find the correct CID for any character.
     */
    private _unicodeToGlyphId?: Map<number, number>

    private _reverseToUnicodeMap?: Map<string, number> | null

    get reverseToUnicodeMap(): Map<string, number> | null {
        if (this._reverseToUnicodeMap !== undefined)
            return this._reverseToUnicodeMap
        const fwd = this.toUnicodeMap
        if (!fwd) {
            this._reverseToUnicodeMap = null
            return null
        }
        const rev = new Map<string, number>()
        for (const [cid, unicode] of fwd) {
            rev.set(unicode, cid)
        }
        this._reverseToUnicodeMap = rev
        return rev
    }

    /**
     * Returns characters in the given text that this font cannot encode.
     * An empty array means all characters are supported.
     */
    unsupportedChars(text: string): string[] {
        // Only Type0 (CID) and Type3 fonts require ToUnicode-based encoding.
        // TrueType/Type1 fonts use standard encoding (WinAnsi etc.) and
        // can render characters even if they're not in the ToUnicode subset.
        if (!this.requiresToUnicodeEncoding) return []
        const rev = this.reverseToUnicodeMap
        if (!rev) return []
        const glyphMap = this._unicodeToGlyphId
        const missing: string[] = []
        for (const char of text) {
            if (!rev.has(char)) {
                // CFF fonts: also check the full unicode→glyphId map
                if (glyphMap && glyphMap.has(char.codePointAt(0) ?? 0)) continue
                missing.push(char)
            }
        }
        return [...new Set(missing)]
    }

    encode(
        text: string | PdfString | PdfHexadecimal,
    ): PdfString | PdfHexadecimal {
        text =
            text instanceof PdfString || text instanceof PdfHexadecimal
                ? this.decode(text)
                : text
        if (this.isUnicode) {
            const rev = this.reverseToUnicodeMap
            const glyphMap = this._unicodeToGlyphId
            let hex = ''
            for (const char of text) {
                let cid = rev?.get(char)
                if (cid === undefined && glyphMap) {
                    // CFF fallback: look up glyph ID from the full cmap
                    cid = glyphMap.get(char.codePointAt(0) ?? 0)
                }
                if (cid !== undefined) {
                    hex += cid.toString(16).padStart(4, '0')
                } else {
                    const cp = char.codePointAt(0) ?? 0
                    hex += cp.toString(16).padStart(4, '0')
                }
            }
            return new PdfHexadecimal(hex, 'hex')
        }

        const reverseMap = this.reverseEncodingMap
        if (reverseMap) {
            let hex = ''
            for (const char of text) {
                const code = reverseMap.get(char) ?? char.charCodeAt(0)
                hex += code.toString(16).padStart(2, '0')
            }
            return new PdfHexadecimal(hex, 'hex')
        }

        // Non-CID fonts that require glyph-code encoding (Type3) with a
        // ToUnicode map: encode via the reverse map using 1-byte hex codes.
        // TrueType/Type1 fonts fall through to PdfString (standard encoding).
        if (this.requiresToUnicodeEncoding) {
            const rev = this.reverseToUnicodeMap
            if (rev) {
                let hex = ''
                for (const char of text) {
                    const cid = rev.get(char)
                    if (cid !== undefined) {
                        hex += cid.toString(16).padStart(2, '0')
                    } else {
                        hex += char.charCodeAt(0).toString(16).padStart(2, '0')
                    }
                }
                return new PdfHexadecimal(hex, 'hex')
            }
        }

        return new PdfString(text)
    }

    /**
     * Extract the glyph codes (the numeric codes used in the font's width
     * tables) from a raw string operand.  For hex strings this parses the
     * hex digits into 2-byte CIDs (Type0) or 1-byte codes (simple fonts).
     * For literal strings the raw byte values are used.
     */
    extractGlyphCodes(operand: PdfString | PdfHexadecimal): number[] {
        if (operand instanceof PdfHexadecimal) {
            const hex = operand.hexString
            if (hex.length === 0) return []
            const codes: number[] = []
            if (this.isUnicode) {
                // 2-byte CIDs (4 hex chars each)
                for (let i = 0; i < hex.length; i += 4) {
                    codes.push(parseInt(hex.substring(i, i + 4), 16))
                }
            } else if (this.encodingMap || this.toUnicodeMap) {
                // 1-byte codes (simple font with Differences or ToUnicode)
                for (let i = 0; i < hex.length; i += 2) {
                    codes.push(parseInt(hex.substring(i, i + 2), 16))
                }
            } else {
                // Fallback: same logic as decode
                const byteWidth = hex.length % 4 === 0 ? 4 : 2
                for (let i = 0; i < hex.length; i += byteWidth) {
                    codes.push(parseInt(hex.substring(i, i + byteWidth), 16))
                }
            }
            return codes
        }
        // Literal string — use raw bytes for glyph codes.
        // Simple fonts (Type1, TrueType) always use 1-byte character codes.
        // Only Type0 (composite/CID) fonts use 2-byte codes.
        const raw = operand.raw
        const codes: number[] = []
        const twoBytes = this.isUnicode
        if (twoBytes) {
            for (let i = 0; i + 1 < raw.length; i += 2) {
                codes.push((raw[i] << 8) | raw[i + 1])
            }
        } else {
            for (let i = 0; i < raw.length; i++) {
                codes.push(raw[i])
            }
        }
        return codes
    }

    /**
     * Decodes a PDF-delimited string operand back to a Unicode string.
     * Inverse of `encode()`.
     *
     * - Hex strings `<XXXX...>` with Type0 (CID) fonts: 2-byte pairs → Unicode code points
     * - Hex strings `<XX...>` with custom Differences encoding: 1-byte pairs → characters via encoding map
     * - Literal strings `(text)`: un-escape PDF special characters
     */
    decode(encoded: PdfString | PdfHexadecimal): string {
        if (encoded instanceof PdfHexadecimal) {
            const cleaned = encoded.hexString
            if (cleaned.length === 0) return ''

            if (this.isUnicode) {
                // 2-byte CIDs → Unicode via ToUnicode map, fallback to raw code points
                const umap = this.toUnicodeMap
                let result = ''
                for (let i = 0; i < cleaned.length; i += 4) {
                    const cid = parseInt(cleaned.substring(i, i + 4), 16)
                    result += umap?.get(cid) ?? String.fromCodePoint(cid)
                }
                return result
            }

            const encodingMap = this.encodingMap
            if (encodingMap) {
                // 1-byte codes → characters via Differences map
                let result = ''
                for (let i = 0; i < cleaned.length; i += 2) {
                    const code = parseInt(cleaned.substring(i, i + 2), 16)
                    result += encodingMap.get(code) ?? String.fromCharCode(code)
                }
                return result
            }

            // Non-CID fonts (e.g. Type3) with a ToUnicode map:
            // use 1-byte codes mapped through the CMap.
            const umap = this.toUnicodeMap
            if (umap) {
                let result = ''
                for (let i = 0; i < cleaned.length; i += 2) {
                    const code = parseInt(cleaned.substring(i, i + 2), 16)
                    result += umap.get(code) ?? String.fromCharCode(code)
                }
                return result
            }

            // Fallback: interpret hex as raw byte values
            let result = ''
            const byteWidth = cleaned.length % 4 === 0 ? 4 : 2
            for (let i = 0; i < cleaned.length; i += byteWidth) {
                result += String.fromCharCode(
                    parseInt(cleaned.substring(i, i + byteWidth), 16),
                )
            }
            return result
        }

        // Literal string — simple fonts (Type1, TrueType) always use
        // 1-byte character codes.  Only Type0 (composite) fonts are 2-byte.
        const raw = encoded.raw
        const twoBytes = this.isUnicode
        if (twoBytes) {
            const umap = this.toUnicodeMap
            let result = ''
            for (let i = 0; i + 1 < raw.length; i += 2) {
                const code = (raw[i] << 8) | raw[i + 1]
                result += umap?.get(code) ?? String.fromCodePoint(code)
            }
            return result
        }

        const umap = this.toUnicodeMap
        if (umap) {
            let result = ''
            for (let i = 0; i < raw.length; i++) {
                result += umap.get(raw[i]) ?? String.fromCharCode(raw[i])
            }
            return result
        }

        const encodingMap = this.encodingMap
        if (encodingMap) {
            let result = ''
            for (let i = 0; i < raw.length; i++) {
                result += encodingMap.get(raw[i]) ?? String.fromCharCode(raw[i])
            }
            return result
        }

        return encoded.value
    }

    /**
     * @internal
     * Legacy property for backward compatibility with code that accesses fontRef.
     * Returns this font's reference since PdfFont IS the indirect object.
     */
    get fontRef(): PdfObjectReference {
        return this.reference
    }

    /**
     * Creates a PdfFont from font file bytes.
     * Automatically detects the font format (TTF, OTF, WOFF) and parses it.
     *
     * @param data - The font file bytes
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromBytes(data: ByteArray): PdfFont {
        return PdfFont.fromFile(data)
    }

    /**
     * Creates a PdfFont from a FontParser instance.
     * Extracts all necessary information from the parser including font name,
     * descriptor, and font data.
     *
     * @param parser - A FontParser instance (TtfParser, OtfParser, or WoffParser)
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromParser(parser: FontParser): PdfFont {
        const isCFF = parser instanceof OtfParser && parser.isCFFBased()

        if (isCFF) {
            // CFF-based OTF fonts are always embedded as Type0 composite fonts
            return PdfFont.fromFile(parser.getFontData())
        }

        const metrics = parser.getPdfFontDescriptor()
        return PdfFont.fromTrueTypeData(metrics)
    }

    /**
     * Creates a standard PDF Type1 font (one of the 14 built-in fonts).
     * These fonts don't require font data as they're built into PDF viewers.
     *
     * @param fontName - One of the 14 standard PDF fonts
     * @param metrics - PdfFontDescriptor built from AFM data
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromStandardFont(
        fontName: PdfStandardFontName,
        metrics: PdfFontDescriptor = new PdfFontDescriptor({}),
    ): PdfFont {
        const font = new PdfFont({ fontName, metrics })

        // Build Type1 font dictionary
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('Type1'))
        font.content.set('BaseFont', new PdfName(fontName))

        if (metrics && metrics.charWidths.size > 0) {
            const firstChar = 32
            const lastChar = 126
            const widths: number[] = []
            for (let code = firstChar; code <= lastChar; code++) {
                widths.push(metrics.getCharWidth(code) ?? 1000)
            }
            font.firstChar = firstChar
            font.lastChar = lastChar
            font.widths = widths
        }

        return font
    }

    static readonly HELVETICA = PdfFont.fromStandardFont(
        'Helvetica',
        PdfFontDescriptor.fromAfm(HelveticaAfm as AfmFont),
    )
    static readonly HELVETICA_BOLD = PdfFont.fromStandardFont(
        'Helvetica-Bold',
        PdfFontDescriptor.fromAfm(HelveticaBoldAfm as AfmFont),
    )
    static readonly HELVETICA_OBLIQUE = PdfFont.fromStandardFont(
        'Helvetica-Oblique',
        PdfFontDescriptor.fromAfm(HelveticaObliqueAfm as AfmFont),
    )
    static readonly HELVETICA_BOLD_OBLIQUE = PdfFont.fromStandardFont(
        'Helvetica-BoldOblique',
        PdfFontDescriptor.fromAfm(HelveticaBoldObliqueAfm as AfmFont),
    )
    static readonly TIMES_ROMAN = PdfFont.fromStandardFont(
        'Times-Roman',
        PdfFontDescriptor.fromAfm(TimesRomanAfm as AfmFont),
    )
    static readonly TIMES_BOLD = PdfFont.fromStandardFont(
        'Times-Bold',
        PdfFontDescriptor.fromAfm(TimesBoldAfm as AfmFont),
    )
    static readonly TIMES_ITALIC = PdfFont.fromStandardFont(
        'Times-Italic',
        PdfFontDescriptor.fromAfm(TimesItalicAfm as AfmFont),
    )
    static readonly TIMES_BOLD_ITALIC = PdfFont.fromStandardFont(
        'Times-BoldItalic',
        PdfFontDescriptor.fromAfm(TimesBoldItalicAfm as AfmFont),
    )
    static readonly COURIER = PdfFont.fromStandardFont(
        'Courier',
        PdfFontDescriptor.fromAfm(CourierAfm as AfmFont),
    )
    static readonly COURIER_BOLD = PdfFont.fromStandardFont(
        'Courier-Bold',
        PdfFontDescriptor.fromAfm(CourierBoldAfm as AfmFont),
    )
    static readonly COURIER_OBLIQUE = PdfFont.fromStandardFont(
        'Courier-Oblique',
        PdfFontDescriptor.fromAfm(CourierObliqueAfm as AfmFont),
    )
    static readonly COURIER_BOLD_OBLIQUE = PdfFont.fromStandardFont(
        'Courier-BoldOblique',
        PdfFontDescriptor.fromAfm(CourierBoldObliqueAfm as AfmFont),
    )
    static readonly SYMBOL = PdfFont.fromStandardFont(
        'Symbol',
        PdfFontDescriptor.fromAfm(SymbolAfm as AfmFont),
    )
    static readonly ZAPF_DINGBATS = PdfFont.fromStandardFont(
        'ZapfDingbats',
        PdfFontDescriptor.fromAfm(ZapfDingbatsAfm as AfmFont),
    )

    private static readonly BY_BASE_FONT: ReadonlyMap<string, PdfFont> =
        new Map([
            ['Helvetica', PdfFont.HELVETICA],
            ['Helv', PdfFont.HELVETICA], // Alias for backward compatibility with old code using 'Helv'
            ['Helvetica-Bold', PdfFont.HELVETICA_BOLD],
            ['Helv-Bold', PdfFont.HELVETICA_BOLD], // Alias for backward compatibility with old code using 'Helv-Bold'
            ['Helvetica-Oblique', PdfFont.HELVETICA_OBLIQUE],
            ['Helv-Oblique', PdfFont.HELVETICA_OBLIQUE], // Alias for backward compatibility with old code using 'Helv-Oblique'
            ['Helvetica-BoldOblique', PdfFont.HELVETICA_BOLD_OBLIQUE],
            ['Helv-BoldOblique', PdfFont.HELVETICA_BOLD_OBLIQUE], // Alias for backward compatibility with old code using 'Helv-BoldOblique'
            ['Times-Roman', PdfFont.TIMES_ROMAN],
            ['TiRo', PdfFont.TIMES_ROMAN],
            ['Times-Bold', PdfFont.TIMES_BOLD],
            ['TiBo', PdfFont.TIMES_BOLD],
            ['Times-Italic', PdfFont.TIMES_ITALIC],
            ['TiIt', PdfFont.TIMES_ITALIC],
            ['Times-BoldItalic', PdfFont.TIMES_BOLD_ITALIC],
            ['TiBI', PdfFont.TIMES_BOLD_ITALIC],
            ['Courier', PdfFont.COURIER],
            ['Cour', PdfFont.COURIER], // Alias for backward compatibility with old code using 'Cour'
            ['Courier-Bold', PdfFont.COURIER_BOLD],
            ['Cour-Bold', PdfFont.COURIER_BOLD], // Alias for backward compatibility with old code using 'Cour-Bold'
            ['Courier-Oblique', PdfFont.COURIER_OBLIQUE],
            ['Cour-Oblique', PdfFont.COURIER_OBLIQUE], // Alias for backward compatibility with old code using 'Cour-Oblique'
            ['Courier-BoldOblique', PdfFont.COURIER_BOLD_OBLIQUE],
            ['Cour-BoldOblique', PdfFont.COURIER_BOLD_OBLIQUE], // Alias for backward compatibility with old code using 'Cour-BoldOblique'
            ['Symbol', PdfFont.SYMBOL],
            ['ZapfDingbats', PdfFont.ZAPF_DINGBATS],
            ['ZaDb', PdfFont.ZAPF_DINGBATS],
        ])

    /**
     * The 14 standard PDF fonts available in every PDF viewer without embedding.
     */
    static readonly STANDARD_FONTS: readonly { name: string; font: PdfFont }[] =
        [
            { name: 'Helvetica', font: PdfFont.HELVETICA },
            { name: 'Helvetica-Bold', font: PdfFont.HELVETICA_BOLD },
            { name: 'Helvetica-Oblique', font: PdfFont.HELVETICA_OBLIQUE },
            {
                name: 'Helvetica-BoldOblique',
                font: PdfFont.HELVETICA_BOLD_OBLIQUE,
            },
            { name: 'Times-Roman', font: PdfFont.TIMES_ROMAN },
            { name: 'Times-Bold', font: PdfFont.TIMES_BOLD },
            { name: 'Times-Italic', font: PdfFont.TIMES_ITALIC },
            { name: 'Times-BoldItalic', font: PdfFont.TIMES_BOLD_ITALIC },
            { name: 'Courier', font: PdfFont.COURIER },
            { name: 'Courier-Bold', font: PdfFont.COURIER_BOLD },
            { name: 'Courier-Oblique', font: PdfFont.COURIER_OBLIQUE },
            {
                name: 'Courier-BoldOblique',
                font: PdfFont.COURIER_BOLD_OBLIQUE,
            },
            { name: 'Symbol', font: PdfFont.SYMBOL },
            { name: 'ZapfDingbats', font: PdfFont.ZAPF_DINGBATS },
        ]

    /**
     * Returns the static PdfFont instance for a standard font name, or null if not found.
     */
    static getStandardFont(fontName: string): PdfFont | null {
        const font = PdfFont.BY_BASE_FONT.get(fontName)
        return font ?? null
    }

    /**
     * Creates a TrueType font from font file data.
     * Uses WinAnsiEncoding for standard 8-bit character support.
     *
     * @param metrics - PdfFontDescriptor with font data and properties
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromTrueTypeData(metrics: PdfFontDescriptor): PdfFont {
        const fontName = metrics.fontName ?? 'Unknown'
        const font = new PdfFont({
            fontName,
            encoding: 'WinAnsiEncoding',
            metrics,
        })

        // Embed font file via descriptor
        if (metrics.fontData) {
            metrics.data = metrics.fontData
        }

        // Build TrueType font dictionary
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('TrueType'))
        font.content.set('BaseFont', new PdfName(fontName))
        font.content.set('FontDescriptor', metrics.reference)
        font.content.set('Encoding', new PdfName('WinAnsiEncoding'))

        // Add width information
        const firstChar = metrics.firstChar ?? 32
        const lastChar = metrics.lastChar ?? 255
        font.content.set('FirstChar', new PdfNumber(firstChar))
        font.content.set('LastChar', new PdfNumber(lastChar))

        if (metrics.charWidths.size > 0) {
            const widths: PdfNumber[] = []
            for (let code = firstChar; code <= lastChar; code++) {
                widths.push(new PdfNumber(metrics.getCharWidth(code) ?? 1000))
            }
            font.content.set('Widths', new PdfArray(widths))
        } else {
            const defaultWidths = Array(lastChar - firstChar + 1)
                .fill(0)
                .map(() => new PdfNumber(1000))
            font.content.set('Widths', new PdfArray(defaultWidths))
        }

        return font
    }

    /**
     * Creates a Type0 (composite) font with Unicode support.
     * Use this for fonts that need to display non-ASCII characters.
     *
     * @param metrics - PdfFontDescriptor with font data and CID properties
     * @param unicodeMappings - Optional map of CID to Unicode code point for ToUnicode CMap
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromType0Data(
        metrics: PdfFontDescriptor,
        unicodeMappings?: Map<number, number>,
        cffGlyphToUnicode?: Map<number, number>,
    ): PdfFont {
        const fontName = metrics.fontName ?? 'Unknown'
        const font = new PdfFont({
            fontName,
            encoding: 'Identity-H',
            metrics,
        })

        // Embed font file via descriptor
        if (metrics.fontData) {
            metrics.data = metrics.fontData
        }

        // Create CIDFont dictionary (descendant font)
        const cidFontDict = new PdfDictionary()
        cidFontDict.set('Type', new PdfName('Font'))
        cidFontDict.set(
            'Subtype',
            new PdfName(metrics.isCFF ? 'CIDFontType0' : 'CIDFontType2'),
        )
        cidFontDict.set('BaseFont', new PdfName(fontName))

        // CIDSystemInfo
        const cidSystemInfo = new PdfDictionary()
        cidSystemInfo.set('Registry', new PdfString('Adobe'))
        cidSystemInfo.set('Ordering', new PdfString('Identity'))
        cidSystemInfo.set('Supplement', new PdfNumber(0))
        cidFontDict.set('CIDSystemInfo', cidSystemInfo)

        cidFontDict.set('FontDescriptor', metrics.reference)
        cidFontDict.set('DW', new PdfNumber(metrics.defaultWidth ?? 1000))

        // Add /W (widths) array if provided
        if (metrics.cidWidths && metrics.cidWidths.length > 0) {
            cidFontDict.set('W', PdfFont.buildCIDWidthArray(metrics.cidWidths))
        }

        // CIDToGIDMap — CFF fonts use their own internal CID mapping,
        // so CIDToGIDMap is only needed for TrueType-based CID fonts.
        if (!metrics.isCFF) {
            if (unicodeMappings && unicodeMappings.size > 0) {
                const maxCid = Math.max(...Array.from(unicodeMappings.keys()))
                const cidToGidData = new Uint8Array((maxCid + 1) * 2)

                for (let i = 0; i < cidToGidData.length; i++) {
                    cidToGidData[i] = 0
                }

                for (const [unicode, glyphId] of unicodeMappings.entries()) {
                    const offset = unicode * 2
                    cidToGidData[offset] = (glyphId >> 8) & 0xff
                    cidToGidData[offset + 1] = glyphId & 0xff
                }

                const cidToGidStream = new PdfStream({
                    header: new PdfDictionary(),
                    original: cidToGidData as ByteArray,
                })
                cidToGidStream.addFilter('FlateDecode')

                const cidToGidObject = new PdfIndirectObject({
                    content: cidToGidStream,
                })

                cidFontDict.set('CIDToGIDMap', cidToGidObject.reference)
            } else {
                cidFontDict.set(
                    'CIDToGIDMap',
                    new PdfName(metrics.cidToGidMap ?? 'Identity'),
                )
            }
        }

        const cidFontObject = new PdfIndirectObject({
            content: cidFontDict,
        })

        // Build Type0 font dictionary
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('Type0'))
        font.content.set('BaseFont', new PdfName(`${fontName}-Identity-H`))
        font.content.set('Encoding', new PdfName('Identity-H'))
        font.content.set(
            'DescendantFonts',
            new PdfArray([cidFontObject.reference]),
        )

        // Create ToUnicode CMap if mappings provided.
        // CFF fonts: CIDs are glyph IDs, so use cffGlyphToUnicode (glyphId → unicode).
        // TrueType fonts: CIDs are Unicode code points, so use identity (unicode → unicode).
        if (unicodeMappings && unicodeMappings.size > 0) {
            let cidToUnicode: Map<number, number>
            if (cffGlyphToUnicode && cffGlyphToUnicode.size > 0) {
                cidToUnicode = cffGlyphToUnicode
            } else {
                cidToUnicode = new Map<number, number>()
                for (const [unicode] of unicodeMappings) {
                    cidToUnicode.set(unicode, unicode)
                }
            }
            const cmapContent = PdfFont.generateToUnicodeCMap(cidToUnicode)
            const cmapStream = new PdfStream({
                header: new PdfDictionary(),
                original: stringToBytes(cmapContent),
            })
            cmapStream.addFilter('FlateDecode')

            const cmapObject = new PdfIndirectObject({
                content: cmapStream,
            })

            font.content.set('ToUnicode', cmapObject.reference)
        }

        return font
    }

    static fromFile(
        fontData: ByteArray,
        options?: {
            fontName?: string
            unicode?: boolean
            unicodeMappings?: Map<number, number>
        },
    ): PdfFont {
        const parser = parseFont(fontData)
        const isCFF = parser instanceof OtfParser && parser.isCFFBased()

        const info = parser.getFontInfo()
        const fontName =
            options?.fontName ?? info.postScriptName ?? info.fullName
        const metrics = parser.getPdfFontDescriptor(fontName)

        // Auto-detect if Unicode font is needed.
        // CFF-based OTF fonts are always embedded as Type0 (unicode).
        let useUnicode = options?.unicode
        if (isCFF) {
            useUnicode = true
        } else if (useUnicode === undefined) {
            const cmap = parser.parseCmap()
            useUnicode = Array.from(cmap.keys()).some(
                (unicode) => unicode > 0xff,
            )
        }

        if (useUnicode) {
            const unicodeMappings =
                options?.unicodeMappings ?? parser.parseCmap()

            // Build CID widths from cmap + hmtx.
            // For CFF fonts: CIDs must be glyph IDs (no CIDToGIDMap to translate).
            // For TrueType fonts: CIDs are Unicode code points (CIDToGIDMap translates to glyph IDs).
            const hmtx = parser.parseHmtx()
            const unitsPerEm = info.unitsPerEm
            const cidWidths: CIDWidth[] = []
            const charWidths = new Map<number, number>()

            // For CFF fonts, build a glyphId→unicode map for the ToUnicode CMap
            const cffGlyphToUnicode = isCFF
                ? new Map<number, number>()
                : undefined

            for (const [unicode, glyphId] of unicodeMappings.entries()) {
                const glyphWidth = hmtx.get(glyphId) ?? 0
                const scaledWidth = Math.round((glyphWidth * 1000) / unitsPerEm)
                const cid = isCFF ? glyphId : unicode
                cidWidths.push({ cid, width: scaledWidth })
                charWidths.set(cid, scaledWidth)

                if (cffGlyphToUnicode) {
                    // Multiple Unicode code points may share the same glyph ID.
                    // Prefer the lowest code point as the primary mapping so that
                    // common characters (e.g. U+0020 SPACE) aren't overwritten by
                    // alternates (e.g. U+00A0 NO-BREAK SPACE).
                    const existing = cffGlyphToUnicode.get(glyphId)
                    if (existing === undefined || unicode < existing) {
                        cffGlyphToUnicode.set(glyphId, unicode)
                    }
                }
            }

            const avgWidth =
                cidWidths.length > 0
                    ? Math.round(
                          cidWidths.reduce((sum, entry) => {
                              if ('width' in entry) {
                                  return sum + entry.width
                              } else {
                                  const rangeSum = entry.widths.reduce(
                                      (a, b) => a + b,
                                      0,
                                  )
                                  return sum + rangeSum / entry.widths.length
                              }
                          }, 0) / cidWidths.length,
                      )
                    : 1000

            const unicodeMetrics = new PdfFontDescriptor({
                fontData: metrics.fontData,
                fontName: metrics.fontName,
                familyName: metrics.familyName,
                fontWeight: metrics.fontWeight,
                isBold: metrics.isBold,
                isItalic: metrics.isItalic,
                isFixedPitch: metrics.isFixedPitch,
                italicAngle: metrics.italicAngle,
                ascender: metrics.ascender,
                descender: metrics.descender,
                capHeight: metrics.capHeight,
                xHeight: metrics.xHeight,
                stdVW: metrics.stdVW,
                stdHW: metrics.stdHW,
                unitsPerEm: metrics.unitsPerEm,
                bbox: metrics.bbox,
                kernPairs: metrics.kernPairs,
                glyphMetrics: metrics.glyphMetrics,
                glyphNameToCode: metrics.glyphNameToCode,
                charWidths,
                defaultWidth: avgWidth,
                cidWidths,
                cidToGidMap: isCFF ? undefined : 'Identity',
                isCFF,
            })

            const font = PdfFont.fromType0Data(
                unicodeMetrics,
                unicodeMappings,
                cffGlyphToUnicode,
            )

            // For CFF fonts, store the full unicode→glyphId map so encode()
            // can find the correct CID for any character (including alternates
            // that share a glyph ID, like U+0020 and U+00A0).
            if (isCFF) {
                font._unicodeToGlyphId = new Map(unicodeMappings)
            }

            return font
        } else {
            return PdfFont.fromTrueTypeData(metrics)
        }
    }

    /**
     * Parses a ToUnicode CMap stream to build a mapping from CID to Unicode string.
     */
    private static parseToUnicodeCMap(
        cmapContent: string,
    ): Map<number, string> {
        const map = new Map<number, string>()

        const bfcharRegex = /beginbfchar\s*([\s\S]*?)endbfchar/g
        let match
        while ((match = bfcharRegex.exec(cmapContent)) !== null) {
            const section = match[1]
            const lineRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
            let lineMatch
            while ((lineMatch = lineRegex.exec(section)) !== null) {
                const cid = parseInt(lineMatch[1], 16)
                const unicode = lineMatch[2]
                let str = ''
                for (let j = 0; j < unicode.length; j += 4) {
                    str += String.fromCharCode(
                        parseInt(unicode.substring(j, j + 4), 16),
                    )
                }
                map.set(cid, str)
            }
        }

        const bfrangeRegex = /beginbfrange\s*([\s\S]*?)endbfrange/g
        while ((match = bfrangeRegex.exec(cmapContent)) !== null) {
            const section = match[1]
            const rangeRegex =
                /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g
            let rangeMatch
            while ((rangeMatch = rangeRegex.exec(section)) !== null) {
                const start = parseInt(rangeMatch[1], 16)
                const end = parseInt(rangeMatch[2], 16)
                let unicodeStart = parseInt(rangeMatch[3], 16)
                for (let cid = start; cid <= end; cid++) {
                    map.set(cid, String.fromCharCode(unicodeStart++))
                }
            }
        }

        return map
    }

    /**
     * Generates a ToUnicode CMap for mapping CIDs to Unicode code points.
     */
    private static generateToUnicodeCMap(
        mappings: Map<number, number>,
    ): string {
        const lines: string[] = []

        lines.push('/CIDInit /ProcSet findresource begin')
        lines.push('12 dict begin')
        lines.push('begincmap')
        lines.push('/CIDSystemInfo')
        lines.push('<< /Registry (Adobe)')
        lines.push('/Ordering (UCS)')
        lines.push('/Supplement 0')
        lines.push('>> def')
        lines.push('/CMapName /Adobe-Identity-UCS def')
        lines.push('/CMapType 2 def')
        lines.push('1 begincodespacerange')
        lines.push('<0000> <FFFF>')
        lines.push('endcodespacerange')

        // Convert mappings to array and sort by CID
        const sortedMappings = Array.from(mappings.entries()).sort(
            (a, b) => a[0] - b[0],
        )

        // Output in chunks of 100 (PDF limit per beginbfchar section)
        for (let i = 0; i < sortedMappings.length; i += 100) {
            const chunk = sortedMappings.slice(i, i + 100)
            lines.push(`${chunk.length} beginbfchar`)

            for (const [cid, unicode] of chunk) {
                const cidHex = cid.toString(16).padStart(4, '0').toUpperCase()
                const unicodeHex = unicode
                    .toString(16)
                    .padStart(4, '0')
                    .toUpperCase()
                lines.push(`<${cidHex}> <${unicodeHex}>`)
            }

            lines.push('endbfchar')
        }

        lines.push('endcmap')
        lines.push('CMapName currentdict /CMap defineresource pop')
        lines.push('end')
        lines.push('end')

        return lines.join('\n')
    }

    private static buildCIDWidthArray(widths: CIDWidth[]): PdfArray {
        const items: (PdfNumber | PdfArray)[] = []

        for (const entry of widths) {
            if ('width' in entry) {
                // Single CID with width: c [w]
                items.push(new PdfNumber(entry.cid))
                items.push(new PdfArray([new PdfNumber(entry.width)]))
            } else {
                // Range of CIDs with widths: c [w1 w2 w3 ...]
                items.push(new PdfNumber(entry.startCid))
                items.push(
                    new PdfArray(entry.widths.map((w) => new PdfNumber(w))),
                )
            }
        }

        return new PdfArray(items)
    }
}
