import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { ByteArray } from '../types.js'
import { FontDescriptor, UnicodeFontDescriptor } from './types.js'
import { PdfFont } from './pdf-font.js'
import { PdfFontEncoding } from './pdf-font-encoding.js'
import { parseFont } from './parsers/font-parser.js'

/**
 * Manages font embedding in PDF documents.
 * Provides methods to embed TrueType and other font formats.
 */
export class PdfFontManager {
    private document: PdfDocument
    private fontResourceCounter: number = 0
    private _fontsCache?: Map<string, PdfFont>

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Embeds a TrueType font into the PDF document.
     *
     * @param fontData - The font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Font metrics and properties
     * @returns A PdfFont object representing the embedded font
     */
    async embedTrueTypeFont(
        fontData: ByteArray,
        fontName: string,
        descriptor: FontDescriptor,
    ): Promise<PdfFont> {
        // Create font using factory
        const font = PdfFont.fromTrueTypeData(fontData, fontName, descriptor)

        // Write to PDF
        return await this.write(font)
    }

    /**
     * Embeds a standard PDF font (Type1).
     * These fonts don't require font data as they're built into PDF viewers.
     *
     * @param fontName - One of the 14 standard PDF fonts
     * @returns A PdfFont object representing the embedded font
     */
    async embedStandardFont(
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
    ): Promise<PdfFont> {
        // Create font using factory
        const font = PdfFont.fromStandardFont(fontName)

        // Write to PDF
        return await this.write(font)
    }

    /**
     * Embeds a font from file data with automatic parsing and configuration.
     * This is the recommended high-level API for embedding fonts.
     *
     * @param fontData - The font file bytes (TTF, OTF, or WOFF format)
     * @param options - Optional configuration
     * @param options.fontName - Custom font name (defaults to PostScript name from font)
     * @param options.unicode - Use Unicode/Type0 encoding for non-ASCII characters
     * @param options.unicodeMappings - Custom CID to Unicode mappings for Type0 fonts
     * @returns A PdfFont object representing the embedded font
     *
     * @example
     * ```typescript
     * // Simple embedding with auto-generated name
     * const font = await document.fonts.embedFromFile(fontData)
     * field.font = font
     *
     * // With custom name and Unicode support
     * const font = await document.fonts.embedFromFile(fontData, {
     *     fontName: 'MyCustomFont',
     *     unicode: true
     * })
     * ```
     */
    async embedFromFile(
        fontData: ByteArray,
        options?: {
            fontName?: string
            unicode?: boolean
            unicodeMappings?: Map<number, number>
        },
    ): Promise<PdfFont> {
        // Parse the font to extract metadata
        const parser = parseFont(fontData)
        const info = parser.getFontInfo()

        // Auto-generate font name from metadata if not provided
        const fontName =
            options?.fontName ?? info.postScriptName ?? info.fullName

        // Get the appropriate descriptor based on unicode option
        const descriptor = parser.getFontDescriptor(fontName)

        // Embed using the appropriate method and return PdfFont
        if (options?.unicode) {
            // For Unicode fonts, we need a UnicodeFontDescriptor
            // Create one by extending the base descriptor
            const unicodeDescriptor: UnicodeFontDescriptor = {
                ...descriptor,
                defaultWidth: 1000,
                cidToGidMap: 'Identity',
            }
            return await this.embedTrueTypeFontUnicode(
                fontData,
                fontName,
                unicodeDescriptor,
                options.unicodeMappings,
            )
        } else {
            // Use standard TrueType embedding
            return await this.embedTrueTypeFont(fontData, fontName, descriptor)
        }
    }

    /**
     * Gets the font reference by font name or resource name.
     */
    getFont(fontName: string): PdfFont | undefined {
        return this._fontsCache?.get(fontName)
    }

    /**
     * Writes a font to the PDF document.
     * Assigns resource name, creates container object, commits all objects,
     * and registers it in page resources.
     *
     * @param font - The PdfFont instance to write
     * @param cacheKey - Unused, kept for API compatibility
     * @returns The font with its resourceName and container set
     * @internal
     */
    async write(font: PdfFont): Promise<PdfFont> {
        // Assign resource name
        this.fontResourceCounter++
        const resourceName = `F${this.fontResourceCounter}`
        font.resourceName = resourceName

        // Get all objects to commit (auxiliary objects + container)
        const objectsToCommit = font.getObjectsToCommit()
        if (objectsToCommit.length > 0) {
            await this.document.commit(...objectsToCommit)
        }

        // Add to cache
        if (this._fontsCache) {
            this._fontsCache.set(resourceName, font)
            if (font.fontName) {
                this._fontsCache.set(font.fontName, font)
            }
        }

        return font
    }

    /**
     * Gets the font encoding object for a font.
     * Parses the /Encoding dictionary's /Differences array if present.
     * Returns null if no custom encoding dictionary is defined (e.g., standard encoding names).
     *
     * @param font - The font to get the encoding for
     * @returns The PdfFontEncoding object, or null if no custom encoding
     */
    async getEncoding(
        font: PdfFont,
    ): Promise<PdfFontEncoding | null> {
        // Get the Encoding entry from the font dictionary
        const encoding = font.content.get('Encoding')
        if (!encoding) {
            return null
        }

        // Resolve encoding dictionary (may be indirect reference)
        let encodingDict: PdfDictionary | null = null
        if (encoding instanceof PdfObjectReference) {
            const encodingObj = await this.document.readObject(encoding)
            encodingDict =
                encodingObj?.content instanceof PdfDictionary
                    ? encodingObj.content
                    : null
        } else if (encoding instanceof PdfDictionary) {
            encodingDict = encoding
        } else if (encoding instanceof PdfName) {
            // Standard encoding name (e.g., WinAnsiEncoding) - no Differences
            return null
        }

        if (!encodingDict) {
            return null
        }

        // Parse the encoding dictionary using PdfFontEncoding
        return PdfFontEncoding.fromDictionary(encodingDict)
    }

    /**
     * Embeds a TrueType font with Unicode/Type0 support.
     * Use this for fonts that need to display non-ASCII characters.
     *
     * @param fontData - The font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Unicode font descriptor with CID metrics
     * @param unicodeMappings - Map of CID to Unicode code point for ToUnicode CMap
     * @returns A PdfFont object representing the embedded font
     */
    async embedTrueTypeFontUnicode(
        fontData: ByteArray,
        fontName: string,
        descriptor: UnicodeFontDescriptor,
        unicodeMappings?: Map<number, number>,
    ): Promise<PdfFont> {
        // Create font using factory
        const font = PdfFont.fromType0Data(
            fontData,
            fontName,
            descriptor,
            unicodeMappings,
        )

        // Write to PDF
        return await this.write(font)
    }

    /**
     * Clears the internal fonts cache.
     * Call this if the PDF structure has been modified externally.
     */
    clearFontsCache(): void {
        this._fontsCache = undefined
    }

    /**
     * Traverses the page tree to find and load existing fonts.
     */
    private async traversePageTreeForFonts(
        nodeRef: PdfObjectReference,
        fonts: Map<string, PdfFont>,
    ): Promise<void> {
        const nodeObject = await this.document.readObject({
            objectNumber: nodeRef.objectNumber,
            generationNumber: nodeRef.generationNumber,
        })

        if (!nodeObject) return

        const nodeDict = nodeObject.content.as(PdfDictionary)
        const type = nodeDict.get('Type')?.as(PdfName)

        if (type?.value === 'Page') {
            await this.extractFontsFromPage(nodeObject, nodeDict, fonts)
        } else if (type?.value === 'Pages') {
            const kids = nodeDict.get('Kids')?.as(PdfArray)
            if (kids) {
                for (const kidRef of kids.items) {
                    if (kidRef instanceof PdfObjectReference) {
                        await this.traversePageTreeForFonts(kidRef, fonts)
                    }
                }
            }
        }
    }

    /**
     * Extracts font information from a page's resources.
     */
    private async extractFontsFromPage(
        _pageObject: PdfIndirectObject,
        pageDict: PdfDictionary,
        fonts: Map<string, PdfFont>,
    ): Promise<void> {
        // Get Resources - could be direct dict or reference
        let resources = pageDict.get('Resources')?.as(PdfDictionary)

        if (!resources) {
            const resourcesRef = pageDict
                .get('Resources')
                ?.as(PdfObjectReference)
            if (resourcesRef) {
                const resourcesObj = await this.document.readObject({
                    objectNumber: resourcesRef.objectNumber,
                    generationNumber: resourcesRef.generationNumber,
                })
                resources = resourcesObj?.content.as(PdfDictionary)
            }
        }

        if (!resources) return

        // Get Font dictionary - could be direct dict or reference
        let fontDict = resources.get('Font')?.as(PdfDictionary)

        if (!fontDict) {
            const fontRef = resources.get('Font')?.as(PdfObjectReference)
            if (fontRef) {
                const fontObj = await this.document.readObject({
                    objectNumber: fontRef.objectNumber,
                    generationNumber: fontRef.generationNumber,
                })
                fontDict = fontObj?.content.as(PdfDictionary)
            }
        }

        if (!fontDict) return

        // Iterate through fonts in the Font dictionary
        for (const [resourceName, fontValue] of fontDict.entries()) {
            // Skip if already in this collection
            if (fonts.has(resourceName)) continue

            let fontObjDict: PdfDictionary | undefined
            let fontIndirectObj: PdfIndirectObject<PdfDictionary> | undefined

            const fontRef = fontValue.as(PdfObjectReference)
            if (fontRef) {
                const obj = await this.document.readObject({
                    objectNumber: fontRef.objectNumber,
                    generationNumber: fontRef.generationNumber,
                })
                fontObjDict = obj?.content.as(PdfDictionary)
                fontIndirectObj = obj as PdfIndirectObject<PdfDictionary>
            } else {
                fontObjDict = fontValue.as(PdfDictionary)
            }

            if (!fontObjDict || !fontIndirectObj) continue

            const baseFont = fontObjDict.get('BaseFont')?.as(PdfName)?.value
            const encoding = fontObjDict.get('Encoding')?.as(PdfName)?.value

            if (baseFont) {
                const pdfFont = new PdfFont({
                    fontName: baseFont,
                    resourceName: resourceName,
                    encoding: encoding,
                    manager: this,
                })
                fonts.set(resourceName, pdfFont)

                // Also register by baseFont name for lookup convenience
                if (!fonts.has(baseFont)) {
                    fonts.set(baseFont, pdfFont)
                }
            }
        }
    }

    /**
     * Collects all fonts from the PDF structure.
     * Uses cached fonts if available.
     * @internal
     */
    async cacheFonts(): Promise<void> {
        const fonts = new Map<string, PdfFont>()

        const catalog = this.document.root
        if (!catalog) {
            this._fontsCache = fonts
            return
        }

        const pagesRef = catalog.content.get('Pages')
        if (!pagesRef) {
            this._fontsCache = fonts
            return
        }

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) {
            this._fontsCache = fonts
            return 
        }

        await this.traversePageTreeForFonts(pagesObjRef, fonts)
        
        // Cache the collected fonts
        this._fontsCache = fonts
        return
    }
}
