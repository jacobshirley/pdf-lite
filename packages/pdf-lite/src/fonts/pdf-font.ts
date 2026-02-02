import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfString } from '../core/objects/pdf-string.js'
import type { PdfFontManager } from './font-manager.js'
import type {
    FontDescriptor,
    UnicodeFontDescriptor,
    CIDWidth,
    FontParser,
} from './types.js'
import type { ByteArray } from '../types.js'
import { parseFont } from './parsers/font-parser.js'
import { OtfParser } from './parsers/otf-parser.js'
import { TtfParser } from './parsers/ttf-parser.js'
import { WoffParser } from './parsers/woff-parser.js'

/**
 * Represents an embedded font in a PDF document.
 * Extends PdfDictionary to provide both font metadata and PDF dictionary structure.
 */
export class PdfFont extends PdfDictionary<{
    Type: PdfName<'Font'>
    Subtype: PdfName<'Type1' | 'TrueType' | 'Type0'>
    BaseFont: PdfName
    FontDescriptor?: PdfObjectReference
    Encoding?: PdfName
    FirstChar?: PdfNumber
    LastChar?: PdfNumber
    Widths?: PdfArray<PdfNumber>
    DescendantFonts?: PdfArray<PdfObjectReference>
    ToUnicode?: PdfObjectReference
}> {
    /**
     * The PDF resource name used in content streams (e.g., 'F1', 'F2').
     * This is the identifier used in PDF operators like `/F1 12 Tf`.
     */
    resourceName: string

    /**
     * Reference to the container indirect object that wraps this font dict.
     * Set by FontManager.write() when the font is committed to the PDF.
     */
    container?: PdfIndirectObject

    /**
     * Auxiliary objects that must be committed along with the font dict.
     * Includes FontDescriptor, FontFile2, CIDFont, ToUnicode, etc.
     */
    protected auxiliaryObjects: PdfIndirectObject[] = []

    /**
     * @internal
     * Reference to the font manager that created this font.
     */
    private manager?: PdfFontManager

    /**
     * @internal
     * Font descriptor with metrics and properties.
     */
    private _descriptor?: FontDescriptor | UnicodeFontDescriptor

    /**
     * @internal
     * Original font file bytes.
     */
    private _fontData?: ByteArray

    constructor(options: {
        dict?: PdfDictionary
        fontName?: string
        resourceName?: string
        encoding?: string
        manager?: PdfFontManager
        container?: PdfIndirectObject
        descriptor?: FontDescriptor | UnicodeFontDescriptor
        fontData?: ByteArray
    }) {
        super()
        if (options.dict) {
            this.copyFrom(options.dict)
        }
        this.fontName = options.fontName
        this.resourceName = options.resourceName ?? ''
        this.encoding = options.encoding
        this.manager = options.manager
        this.container = options.container
        this._descriptor = options.descriptor
        this._fontData = options.fontData
    }

    get fontName(): string | undefined {
        const baseFont = this.get('BaseFont')
        if (!baseFont) {
            return undefined
        }
        return baseFont.value
    }

    set fontName(name: string | undefined) {
        if (!name) {
            this.delete('BaseFont')
            return
        }
        this.set('BaseFont', new PdfName(name))
    }

    get encoding(): string | undefined {
        const encoding = this.get('Encoding')
        return encoding ? encoding.value : undefined
    }

    set encoding(enc: string | undefined) {
        if (enc) {
            this.set('Encoding', new PdfName(enc))
        } else {
            this.delete('Encoding')
        }
    }

    /**
     * Gets the font descriptor with metrics and properties.
     * Available for embedded fonts, undefined for standard fonts or loaded fonts without descriptor.
     */
    get descriptor(): FontDescriptor | UnicodeFontDescriptor | undefined {
        return this._descriptor
    }

    /**
     * Gets the original font file bytes.
     * Available for embedded fonts, undefined for standard fonts or loaded fonts.
     */
    get fontData(): ByteArray | undefined {
        return this._fontData
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
        const subtype = this.get('Subtype')
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
            this.set(
                'Subtype',
                new PdfName(type) as PdfName<'Type1' | 'TrueType' | 'Type0'>,
            )
        } else {
            this.delete('Subtype')
        }
    }

    /**
     * Gets the first character code in the Widths array.
     */
    get firstChar(): number | undefined {
        const firstChar = this.get('FirstChar')
        return firstChar?.value
    }

    /**
     * Sets the first character code in the Widths array.
     */
    set firstChar(value: number | undefined) {
        if (value !== undefined) {
            this.set('FirstChar', new PdfNumber(value))
        } else {
            this.delete('FirstChar')
        }
    }

    /**
     * Gets the last character code in the Widths array.
     */
    get lastChar(): number | undefined {
        const lastChar = this.get('LastChar')
        return lastChar?.value
    }

    /**
     * Sets the last character code in the Widths array.
     */
    set lastChar(value: number | undefined) {
        if (value !== undefined) {
            this.set('LastChar', new PdfNumber(value))
        } else {
            this.delete('LastChar')
        }
    }

    /**
     * Gets the character widths array.
     */
    get widths(): number[] | undefined {
        const widths = this.get('Widths')
        if (!widths) return undefined
        return widths.items.map((item) => item.value)
    }

    /**
     * Sets the character widths array.
     */
    set widths(values: number[] | undefined) {
        if (values) {
            this.set(
                'Widths',
                new PdfArray(values.map((w) => new PdfNumber(w))),
            )
        } else {
            this.delete('Widths')
        }
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
     * Returns all objects that need to be committed to the PDF.
     * Includes auxiliary objects (descriptors, streams) and the container.
     */
    getObjectsToCommit(): PdfIndirectObject[] {
        const objects = [...this.auxiliaryObjects]
        if (this.container) {
            objects.push(this.container)
        }
        return objects
    }

    /**
     * @internal
     * Legacy property for backward compatibility with code that accesses fontRef.
     * Returns the container object if available.
     */
    get fontRef(): PdfObjectReference {
        if (!this.container) {
            throw new Error('Font has not been written to PDF yet')
        }
        return this.container.reference
    }

    /**
     * Creates a PdfFont from font file bytes.
     * Automatically detects the font format (TTF, OTF, WOFF) and parses it.
     *
     * @param data - The font file bytes
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromBytes(data: ByteArray): PdfFont {
        const parser = parseFont(data)
        return PdfFont.fromParser(parser)
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
        if (parser instanceof OtfParser && parser.isCFFBased()) {
            throw new Error('CFF-based OTF fonts are not supported yet')
        }

        const fontInfo = parser.getFontInfo()
        const fontName = fontInfo.postScriptName
        const descriptor = parser.getFontDescriptor(fontName)
        const fontData = parser.getFontData()

        return PdfFont.fromTrueTypeData(fontData, fontName, descriptor)
    }

    /**
     * Creates a standard PDF Type1 font (one of the 14 built-in fonts).
     * These fonts don't require font data as they're built into PDF viewers.
     *
     * @param fontName - One of the 14 standard PDF fonts
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromStandardFont(
        fontName:
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
            | 'ZapfDingbats',
    ): PdfFont {
        const font = new PdfFont({ fontName })

        // Build Type1 font dictionary
        font.set('Type', new PdfName('Font'))
        font.set('Subtype', new PdfName('Type1'))
        font.set('BaseFont', new PdfName(fontName))

        return font
    }

    /**
     * Creates a TrueType font from font file data.
     * Uses WinAnsiEncoding for standard 8-bit character support.
     *
     * @param fontData - The TrueType font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Font metrics and properties
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromTrueTypeData(
        fontData: ByteArray,
        fontName: string,
        descriptor: FontDescriptor,
    ): PdfFont {
        const font = new PdfFont({
            fontName,
            encoding: 'WinAnsiEncoding',
            descriptor,
            fontData,
        })

        // Create font descriptor dictionary
        const fontDescriptorDict = new PdfDictionary()
        fontDescriptorDict.set('Type', new PdfName('FontDescriptor'))
        fontDescriptorDict.set('FontName', new PdfName(descriptor.fontName))
        fontDescriptorDict.set('FontFamily', new PdfName(descriptor.fontFamily))
        fontDescriptorDict.set(
            'FontWeight',
            new PdfNumber(descriptor.fontWeight),
        )
        fontDescriptorDict.set('Flags', new PdfNumber(descriptor.flags))
        fontDescriptorDict.set(
            'FontBBox',
            new PdfArray([
                new PdfNumber(descriptor.fontBBox[0]),
                new PdfNumber(descriptor.fontBBox[1]),
                new PdfNumber(descriptor.fontBBox[2]),
                new PdfNumber(descriptor.fontBBox[3]),
            ]),
        )
        fontDescriptorDict.set(
            'ItalicAngle',
            new PdfNumber(descriptor.italicAngle),
        )
        fontDescriptorDict.set('Ascent', new PdfNumber(descriptor.ascent))
        fontDescriptorDict.set('Descent', new PdfNumber(descriptor.descent))
        fontDescriptorDict.set('CapHeight', new PdfNumber(descriptor.capHeight))
        fontDescriptorDict.set('StemV', new PdfNumber(descriptor.stemV))

        // Create font file stream
        const fontFileStream = new PdfStream({
            header: new PdfDictionary(),
            original: fontData,
        })
        fontFileStream.header.set('Length1', new PdfNumber(fontData.length))
        fontFileStream.addFilter('FlateDecode')

        const fontFileObject = new PdfIndirectObject({
            content: fontFileStream,
        })

        fontDescriptorDict.set('FontFile2', fontFileObject.reference)

        const fontDescriptorObject = new PdfIndirectObject({
            content: fontDescriptorDict,
        })

        // Store auxiliary objects
        font.auxiliaryObjects.push(fontFileObject, fontDescriptorObject)

        // Build TrueType font dictionary
        font.set('Type', new PdfName('Font'))
        font.set('Subtype', new PdfName('TrueType'))
        font.set('BaseFont', new PdfName(descriptor.fontName))
        font.set('FontDescriptor', fontDescriptorObject.reference)
        font.set('Encoding', new PdfName('WinAnsiEncoding'))

        // Add width information for proper glyph rendering
        const firstChar = descriptor.firstChar ?? 32
        const lastChar = descriptor.lastChar ?? 255
        font.set('FirstChar', new PdfNumber(firstChar))
        font.set('LastChar', new PdfNumber(lastChar))

        if (descriptor.widths) {
            font.set(
                'Widths',
                new PdfArray(descriptor.widths.map((w) => new PdfNumber(w))),
            )
        } else {
            // Default: 1000 (standard em-square)
            const defaultWidths = Array(lastChar - firstChar + 1)
                .fill(0)
                .map(() => new PdfNumber(1000))
            font.set('Widths', new PdfArray(defaultWidths))
        }

        return font
    }

    /**
     * Creates a Type0 (composite) font with Unicode support.
     * Use this for fonts that need to display non-ASCII characters.
     *
     * @param fontData - The TrueType font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Unicode font descriptor with CID metrics
     * @param unicodeMappings - Optional map of CID to Unicode code point for ToUnicode CMap
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromType0Data(
        fontData: ByteArray,
        fontName: string,
        descriptor: UnicodeFontDescriptor,
        unicodeMappings?: Map<number, number>,
    ): PdfFont {
        const font = new PdfFont({
            fontName,
            encoding: 'Identity-H',
            descriptor,
            fontData,
        })

        // Create font descriptor dictionary
        const fontDescriptorDict = new PdfDictionary()
        fontDescriptorDict.set('Type', new PdfName('FontDescriptor'))
        fontDescriptorDict.set('FontName', new PdfName(descriptor.fontName))
        fontDescriptorDict.set('FontFamily', new PdfName(descriptor.fontFamily))
        fontDescriptorDict.set(
            'FontWeight',
            new PdfNumber(descriptor.fontWeight),
        )
        fontDescriptorDict.set('Flags', new PdfNumber(descriptor.flags))
        fontDescriptorDict.set(
            'FontBBox',
            new PdfArray([
                new PdfNumber(descriptor.fontBBox[0]),
                new PdfNumber(descriptor.fontBBox[1]),
                new PdfNumber(descriptor.fontBBox[2]),
                new PdfNumber(descriptor.fontBBox[3]),
            ]),
        )
        fontDescriptorDict.set(
            'ItalicAngle',
            new PdfNumber(descriptor.italicAngle),
        )
        fontDescriptorDict.set('Ascent', new PdfNumber(descriptor.ascent))
        fontDescriptorDict.set('Descent', new PdfNumber(descriptor.descent))
        fontDescriptorDict.set('CapHeight', new PdfNumber(descriptor.capHeight))
        fontDescriptorDict.set('StemV', new PdfNumber(descriptor.stemV))

        // Create font file stream
        const fontFileStream = new PdfStream({
            header: new PdfDictionary(),
            original: fontData,
        })
        fontFileStream.header.set('Length1', new PdfNumber(fontData.length))
        fontFileStream.addFilter('FlateDecode')

        const fontFileObject = new PdfIndirectObject({
            content: fontFileStream,
        })

        fontDescriptorDict.set('FontFile2', fontFileObject.reference)

        const fontDescriptorObject = new PdfIndirectObject({
            content: fontDescriptorDict,
        })

        // Store descriptor and font file
        font.auxiliaryObjects.push(fontFileObject, fontDescriptorObject)

        // Create CIDFont dictionary (descendant font)
        const cidFontDict = new PdfDictionary()
        cidFontDict.set('Type', new PdfName('Font'))
        cidFontDict.set('Subtype', new PdfName('CIDFontType2'))
        cidFontDict.set('BaseFont', new PdfName(descriptor.fontName))

        // CIDSystemInfo
        const cidSystemInfo = new PdfDictionary()
        cidSystemInfo.set('Registry', new PdfString('Adobe'))
        cidSystemInfo.set('Ordering', new PdfString('Identity'))
        cidSystemInfo.set('Supplement', new PdfNumber(0))
        cidFontDict.set('CIDSystemInfo', cidSystemInfo)

        cidFontDict.set('FontDescriptor', fontDescriptorObject.reference)
        cidFontDict.set('DW', new PdfNumber(descriptor.defaultWidth ?? 1000))

        // Add /W (widths) array if provided
        if (descriptor.cidWidths && descriptor.cidWidths.length > 0) {
            cidFontDict.set(
                'W',
                PdfFont.buildCIDWidthArray(descriptor.cidWidths),
            )
        }

        // CIDToGIDMap
        cidFontDict.set(
            'CIDToGIDMap',
            new PdfName(descriptor.cidToGidMap ?? 'Identity'),
        )

        const cidFontObject = new PdfIndirectObject({
            content: cidFontDict,
        })

        font.auxiliaryObjects.push(cidFontObject)

        // Build Type0 font dictionary
        font.set('Type', new PdfName('Font'))
        font.set('Subtype', new PdfName('Type0'))
        font.set('BaseFont', new PdfName(`${descriptor.fontName}-Identity-H`))
        font.set('Encoding', new PdfName('Identity-H'))
        font.set('DescendantFonts', new PdfArray([cidFontObject.reference]))

        // Create ToUnicode CMap if mappings provided
        if (unicodeMappings && unicodeMappings.size > 0) {
            const cmapContent = PdfFont.generateToUnicodeCMap(unicodeMappings)
            const cmapStream = new PdfStream({
                header: new PdfDictionary(),
                original: new TextEncoder().encode(cmapContent),
            })
            cmapStream.addFilter('FlateDecode')

            const cmapObject = new PdfIndirectObject({
                content: cmapStream,
            })

            font.set('ToUnicode', cmapObject.reference)
            font.auxiliaryObjects.push(cmapObject)
        }

        return font
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

    /**
     * Builds a CID width array for the /W entry in CIDFont dictionaries.
     */
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
