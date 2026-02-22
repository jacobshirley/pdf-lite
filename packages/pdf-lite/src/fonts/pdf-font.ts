import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfString } from '../core/objects/pdf-string.js'
import type { PdfFontManager } from './manager.js'
import type {
    FontDescriptor,
    UnicodeFontDescriptor,
    CIDWidth,
    FontParser,
} from './types.js'
import type { ByteArray } from '../types.js'
import { parseFont } from './parsers/font-parser.js'
import { OtfParser } from './parsers/otf-parser.js'
import { PdfFontEncoding } from './pdf-font-encoding.js'
import type { PdfDocument } from '../pdf/pdf-document.js'

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

type PdfFontDictionary = PdfDictionary<{
    Type: PdfName<'Font'>
    Subtype: PdfName<'Type1' | 'TrueType' | 'Type0'>
    BaseFont: PdfName
    FontDescriptor?: PdfObjectReference
    Encoding?: PdfName | PdfObjectReference | PdfDictionary
    FirstChar?: PdfNumber
    LastChar?: PdfNumber
    Widths?: PdfArray<PdfNumber>
    DescendantFonts?: PdfArray<PdfObjectReference>
    ToUnicode?: PdfObjectReference
}>

/**
 * Represents an embedded font in a PDF document.
 * Extends PdfDictionary to provide both font metadata and PDF dictionary structure.
 */
export class PdfFont extends PdfIndirectObject<PdfFontDictionary> {
    /**
     * The PDF resource name used in content streams (e.g., 'F1', 'F2').
     * This is the identifier used in PDF operators like `/F1 12 Tf`.
     */
    resourceName: string

    /**
     * Auxiliary objects that must be committed along with the font dict.
     * Includes FontDescriptor, FontFile2, CIDFont, ToUnicode, etc.
     */
    protected auxiliaryObjects: PdfIndirectObject[] = []

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

    /**
     * @internal
     * Custom font encoding object.
     */
    private _encodingObject?: PdfFontEncoding | PdfName

    constructor(fontName: string)
    constructor(options: {
        dict?: PdfDictionary
        fontName?: string
        resourceName?: string
        encoding?: PdfFontEncoding | PdfName | string
        manager?: PdfFontManager
        descriptor?: FontDescriptor | UnicodeFontDescriptor
        fontData?: ByteArray
    })
    constructor(
        optionsOrFontName:
            | string
            | {
                  dict?: PdfDictionary
                  fontName?: string
                  resourceName?: string
                  encoding?: PdfFontEncoding | PdfName | string
                  container?: PdfIndirectObject
                  descriptor?: FontDescriptor | UnicodeFontDescriptor
                  fontData?: ByteArray
              },
    ) {
        super({
            content: new PdfDictionary()
        })

        // Handle string parameter (simple fontName)
        if (typeof optionsOrFontName === 'string') {
            this.fontName = optionsOrFontName
            this.resourceName = optionsOrFontName
            return
        }

        // Handle options object (existing behavior)
        const options = optionsOrFontName
        if (options.dict) {
            this.content.copyFrom(options.dict)
        }
        this.fontName = options.fontName
        this.resourceName = options.resourceName ?? ''
        this._encodingObject = typeof options.encoding === 'string' ? new PdfName(options.encoding) : options.encoding
        this._descriptor = options.descriptor
        this._fontData = options.fontData
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
     * Gets the custom font encoding object.
     * Returns undefined if using a standard encoding name or no encoding.
     */
    get encoding(): PdfFontEncoding | PdfName | undefined {
        return this._encodingObject
    }

    /**
     * Sets the custom font encoding object.
     * This will also update the Encoding entry in the dictionary to reference this object.
     */
    set encoding(encoding: PdfFontEncoding | PdfName | string | undefined) {
        this._encodingObject = typeof encoding === 'string' ? new PdfName(encoding) : encoding

        if (encoding) {
            this.content.set('Encoding', this._encodingObject instanceof PdfFontEncoding ? this._encodingObject.reference : this._encodingObject)
        } else {
            this.content.delete('Encoding')
        }
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
     * Checks if this font uses Unicode encoding (Type0 composite font).
     */
    isUnicode(): boolean {
        // Fall back to fontType getter
        return this.fontType === 'Type0'
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
        if (this.widths === undefined || this.firstChar === undefined) {
            return null
        }

        const widthIndex = charCode - this.firstChar
        if (widthIndex >= 0 && widthIndex < this.widths.length) {
            return this.widths[widthIndex]
        }

        return null
    }

    /**
     * Gets the character width scaled to the specified font size.
     * Returns null if the character is not in the font's width table.
     *
     * @param charCode - The character code to get the width for
     * @param fontSize - The font size to scale to
     * @returns The scaled character width or null if not found
     */
    getCharacterWidth(charCode: number, fontSize: number): number | null {
        const rawWidth = this.getRawCharacterWidth(charCode)
        return rawWidth !== null ? (rawWidth * fontSize) / 1000 : null
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
        const objects = [this, ...this.auxiliaryObjects]
        if (this._encodingObject instanceof PdfFontEncoding) {
            objects.push(this._encodingObject)
        }
        
        return objects
    }

    /**
     * Loads a PdfFont from an existing PDF font reference.
     * Reads the font dictionary and extracts key properties.
     *
     * @param document - PdfDocument to read the font object
     * @param ref - Reference to the font object
     * @param resourceName - The resource name (e.g., 'F1') used in content streams
     * @returns A PdfFont instance representing the existing font
     */
    static async fromReference(
        document: PdfDocument,
        ref: PdfObjectReference,
        resourceName: string,
    ): Promise<PdfFont | null> {
        const fontObj = await document.readObject(ref)
        if (!fontObj) return null

        const fontDict =
            fontObj.content instanceof PdfDictionary ? fontObj.content : null
        if (!fontDict) return null

        // Don't extract encoding value - preserve original Encoding entry (could be reference or dict)
        // Create PdfFont with the loaded dictionary (copyFrom will preserve all entries)
        const font = new PdfFont({
            dict: fontDict,
            resourceName,
        })

        return font
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
     * Loads a PdfFont from an existing PDF document.
     * 
     * @param document - The PDF document to load from
     * @param fontRef - The font dictionary or indirect reference
     * @param resourceName - Optional resource name for the font (e.g., 'F1')
     * @returns A PdfFont instance, or null if invalid
     */
    static async fromDocument(
        document: PdfDocument,
        fontRef: PdfDictionary | PdfObjectReference,
        resourceName?: string,
    ): Promise<PdfFont | null> {
        let fontObjDict: PdfFontDictionary | undefined
        let fontIndirectObj: PdfIndirectObject<PdfFontDictionary> | undefined

        if (fontRef instanceof PdfObjectReference) {
            const obj = await document.readObject({
                objectNumber: fontRef.objectNumber,
                generationNumber: fontRef.generationNumber,
            })
            fontObjDict = obj?.content.as(PdfDictionary) as PdfFontDictionary
            fontIndirectObj = obj as PdfIndirectObject<PdfFontDictionary>
        } else if (fontRef instanceof PdfDictionary) {
            fontObjDict = fontRef as PdfFontDictionary
        }

        if (!fontObjDict) {
            return null
        }

        const baseFont = fontObjDict.get('BaseFont')?.as(PdfName)?.value
        const encoding = fontObjDict.get('Encoding')

        if (!baseFont) {
            return null
        }

        const font = new PdfFont({
            dict: fontObjDict,
            fontName: baseFont,
            resourceName: resourceName ?? baseFont,
            encoding: encoding ? await PdfFontEncoding.fromDocument(document, encoding) : undefined,
        })

        // If we have an indirect object, copy its reference information
        if (fontIndirectObj) {
            font.objectNumber = fontIndirectObj.objectNumber
            font.generationNumber = fontIndirectObj.generationNumber
        }

        return font
    }

    /**
     * Creates a standard PDF Type1 font (one of the 14 built-in fonts).
     * These fonts don't require font data as they're built into PDF viewers.
     *
     * @param fontName - One of the 14 standard PDF fonts
     * @param widths - Optional AFM widths array (1/1000 em units) for chars 32–126
     * @returns A PdfFont instance ready to be written to the PDF
     */
    static fromStandardFont(
        fontName: PdfStandardFontName,
        widths?: number[],
    ): PdfFont {
        const font = new PdfFont({ fontName })

        // Build Type1 font dictionary
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('Type1'))
        font.content.set('BaseFont', new PdfName(fontName))

        if (widths) {
            font.firstChar = 32
            font.lastChar = 32 + widths.length - 1
            font.widths = widths
        }

        return font
    }

    // Helvetica AFM widths, chars 32–126 (95 values, 1/1000 em units)
    private static readonly _HELVETICA_WIDTHS: readonly number[] = [
        278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333,
        278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278,
        584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278,
        500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944,
        667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556,
        278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500,
        278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
    ]

    // Helvetica-Bold AFM widths, chars 32–126
    private static readonly _HELVETICA_BOLD_WIDTHS: readonly number[] = [
        278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333,
        278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333,
        584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278,
        556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944,
        667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556,
        333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556,
        333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
    ]

    // Times-Roman AFM widths, chars 32–126
    private static readonly _TIMES_ROMAN_WIDTHS: readonly number[] = [
        250, 333, 408, 500, 500, 833, 778, 180, 333, 333, 500, 564, 250, 333,
        250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 278, 278,
        564, 564, 564, 444, 921, 722, 667, 667, 722, 611, 556, 722, 722, 333,
        389, 722, 611, 889, 722, 722, 556, 722, 667, 556, 611, 722, 722, 944,
        722, 722, 611, 333, 278, 333, 469, 500, 333, 444, 500, 444, 500, 444,
        333, 500, 500, 278, 278, 500, 278, 778, 500, 500, 500, 500, 333, 389,
        278, 500, 500, 722, 500, 500, 444, 480, 200, 480, 541,
    ]

    // Times-Bold AFM widths, chars 32–126
    private static readonly _TIMES_BOLD_WIDTHS: readonly number[] = [
        250, 333, 555, 500, 500, 1000, 833, 278, 333, 333, 500, 570, 250, 333,
        250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333,
        570, 570, 570, 500, 930, 722, 667, 722, 722, 667, 611, 778, 778, 389,
        500, 778, 667, 944, 722, 778, 611, 778, 722, 556, 667, 722, 722, 1000,
        722, 722, 667, 333, 278, 333, 581, 500, 333, 500, 556, 444, 556, 444,
        333, 500, 556, 278, 333, 556, 278, 833, 556, 500, 556, 556, 444, 389,
        333, 556, 500, 722, 500, 500, 444, 394, 220, 394, 520,
    ]

    // Times-Italic AFM widths, chars 32–126
    private static readonly _TIMES_ITALIC_WIDTHS: readonly number[] = [
        250, 333, 420, 500, 500, 833, 778, 214, 333, 333, 500, 675, 250, 333,
        250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333,
        675, 675, 675, 500, 920, 611, 611, 667, 722, 611, 611, 722, 722, 333,
        444, 667, 556, 833, 667, 722, 611, 722, 611, 500, 556, 722, 611, 833,
        611, 556, 556, 389, 278, 389, 422, 500, 333, 500, 500, 444, 500, 444,
        278, 500, 500, 278, 278, 444, 278, 722, 500, 500, 500, 500, 389, 389,
        278, 500, 444, 667, 444, 444, 389, 400, 275, 400, 541,
    ]

    // Times-BoldItalic AFM widths, chars 32–126
    private static readonly _TIMES_BOLD_ITALIC_WIDTHS: readonly number[] = [
        250, 389, 555, 500, 500, 833, 778, 278, 333, 333, 500, 570, 250, 333,
        250, 278, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 333, 333,
        570, 570, 570, 500, 832, 667, 667, 667, 722, 667, 667, 722, 778, 389,
        500, 667, 611, 889, 722, 722, 611, 722, 667, 556, 611, 722, 667, 889,
        667, 611, 611, 333, 278, 333, 570, 500, 333, 500, 500, 444, 500, 444,
        333, 500, 556, 278, 278, 500, 278, 778, 556, 500, 500, 500, 389, 389,
        278, 556, 444, 667, 500, 444, 389, 348, 220, 348, 570,
    ]

    static readonly HELVETICA = PdfFont.fromStandardFont('Helvetica', [
        ...PdfFont._HELVETICA_WIDTHS,
    ])
    static readonly HELVETICA_BOLD = PdfFont.fromStandardFont(
        'Helvetica-Bold',
        [...PdfFont._HELVETICA_BOLD_WIDTHS],
    )
    static readonly HELVETICA_OBLIQUE = PdfFont.fromStandardFont(
        'Helvetica-Oblique',
        [...PdfFont._HELVETICA_WIDTHS],
    )
    static readonly HELVETICA_BOLD_OBLIQUE = PdfFont.fromStandardFont(
        'Helvetica-BoldOblique',
        [...PdfFont._HELVETICA_BOLD_WIDTHS],
    )
    static readonly TIMES_ROMAN = PdfFont.fromStandardFont('Times-Roman', [
        ...PdfFont._TIMES_ROMAN_WIDTHS,
    ])
    static readonly TIMES_BOLD = PdfFont.fromStandardFont('Times-Bold', [
        ...PdfFont._TIMES_BOLD_WIDTHS,
    ])
    static readonly TIMES_ITALIC = PdfFont.fromStandardFont('Times-Italic', [
        ...PdfFont._TIMES_ITALIC_WIDTHS,
    ])
    static readonly TIMES_BOLD_ITALIC = PdfFont.fromStandardFont(
        'Times-BoldItalic',
        [...PdfFont._TIMES_BOLD_ITALIC_WIDTHS],
    )
    static readonly COURIER = PdfFont.fromStandardFont(
        'Courier',
        Array(95).fill(600),
    )
    static readonly COURIER_BOLD = PdfFont.fromStandardFont(
        'Courier-Bold',
        Array(95).fill(600),
    )
    static readonly COURIER_OBLIQUE = PdfFont.fromStandardFont(
        'Courier-Oblique',
        Array(95).fill(600),
    )
    static readonly COURIER_BOLD_OBLIQUE = PdfFont.fromStandardFont(
        'Courier-BoldOblique',
        Array(95).fill(600),
    )
    static readonly SYMBOL = PdfFont.fromStandardFont('Symbol')
    static readonly ZAPF_DINGBATS = PdfFont.fromStandardFont('ZapfDingbats')

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
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('TrueType'))
        font.content.set('BaseFont', new PdfName(descriptor.fontName))
        font.content.set('FontDescriptor', fontDescriptorObject.reference)
        font.content.set('Encoding', new PdfName('WinAnsiEncoding'))

        // Add width information for proper glyph rendering
        const firstChar = descriptor.firstChar ?? 32
        const lastChar = descriptor.lastChar ?? 255
        font.content.set('FirstChar', new PdfNumber(firstChar))
        font.content.set('LastChar', new PdfNumber(lastChar))

        if (descriptor.widths) {
            font.content.set(
                'Widths',
                new PdfArray(descriptor.widths.map((w) => new PdfNumber(w))),
            )
        } else {
            // Default: 1000 (standard em-square)
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
        font.content.set('Type', new PdfName('Font'))
        font.content.set('Subtype', new PdfName('Type0'))
        font.content.set('BaseFont', new PdfName(`${descriptor.fontName}-Identity-H`))
        font.content.set('Encoding', new PdfName('Identity-H'))
        font.content.set('DescendantFonts', new PdfArray([cidFontObject.reference]))

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

            font.content.set('ToUnicode', cmapObject.reference)
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
