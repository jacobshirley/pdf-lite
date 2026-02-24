import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { ByteArray } from '../types.js'
import { FontDescriptor, UnicodeFontDescriptor } from './types.js'
import { PdfFont } from './pdf-font.js'
import { parseFont } from './parsers/font-parser.js'

/**
 * Manages font embedding in PDF documents.
 * Provides methods to embed TrueType and other font formats.
 */
export class PdfFontManager {
    private document: PdfDocument
    private fontResourceCounter: number = 0

    constructor(document: PdfDocument) {
        this.document = document
    }

    findFontByName(fontName: string): PdfFont | undefined {
        return this.searchFontInPdf(fontName)
    }

    /**
     * Embeds a TrueType font into the PDF document.
     *
     * @param fontData - The font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Font metrics and properties
     * @returns A PdfFont object representing the embedded font
     */
    embedTrueTypeFont(
        fontData: ByteArray,
        fontName: string,
        descriptor: FontDescriptor,
    ): PdfFont {
        // Create font using factory
        const font = PdfFont.fromTrueTypeData(fontData, fontName, descriptor)

        // Write to PDF
        return this.write(font)
    }

    /**
     * Embeds a standard PDF font (Type1).
     * These fonts don't require font data as they're built into PDF viewers.
     *
     * @param fontName - One of the 14 standard PDF fonts
     * @returns A PdfFont object representing the embedded font
     */
    embedStandardFont(
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
        // Create font using factory
        const font = PdfFont.fromStandardFont(fontName)

        // Write to PDF
        return this.write(font)
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
     * const font = document.fonts.embedFromFile(fontData)
     * field.font = font
     *
     * // With custom name and Unicode support
     * const font = document.fonts.embedFromFile(fontData, {
     *     fontName: 'MyCustomFont',
     *     unicode: true
     * })
     * ```
     */
    embedFromFile(
        fontData: ByteArray,
        options?: {
            fontName?: string
            unicode?: boolean
            unicodeMappings?: Map<number, number>
        },
    ): PdfFont {
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
            return this.embedTrueTypeFontUnicode(
                fontData,
                fontName,
                unicodeDescriptor,
                options.unicodeMappings,
            )
        } else {
            // Use standard TrueType embedding
            return this.embedTrueTypeFont(fontData, fontName, descriptor)
        }
    }

    /**
     * Gets the font reference by font name or resource name.
     */
    getFont(fontName: string): PdfFont | undefined {
        return this.searchFontInPdf(fontName)
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
    write(font: PdfFont): PdfFont {
        // Assign resource name
        this.fontResourceCounter++
        const resourceName = `F${this.fontResourceCounter}`
        font.resourceName = resourceName

        // Create container that wraps the font dictionary
        const fontObject = new PdfIndirectObject({
            content: font,
        })
        font.container = fontObject

        // Get all objects to commit (auxiliary objects + container)
        const objectsToCommit = font.getObjectsToCommit()
        if (objectsToCommit.length > 0) {
            this.document.add(...objectsToCommit)
        }

        // Register in page resources
        this.addFontToPageResources(resourceName, fontObject)

        return font
    }

    /**
     * Gets all embedded fonts.
     * Searches the PDF structure to find all fonts.
     */
    getAllFonts(): Map<string, PdfFont> {
        return this.collectAllFontsFromPdf()
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
    embedTrueTypeFontUnicode(
        fontData: ByteArray,
        fontName: string,
        descriptor: UnicodeFontDescriptor,
        unicodeMappings?: Map<number, number>,
    ): PdfFont {
        // Create font using factory
        const font = PdfFont.fromType0Data(
            fontData,
            fontName,
            descriptor,
            unicodeMappings,
        )

        // Write to PDF
        return this.write(font)
    }

    /**
     * Loads existing fonts from the PDF document.
     * Traverses the page tree and extracts font information from page resources.
     *
     * @returns Map of font names to their PdfFont objects
     */
    loadExistingFonts(): Map<string, PdfFont> {
        return this.collectAllFontsFromPdf()
    }

    /**
     * Traverses the page tree to find and load existing fonts.
     */
    private traversePageTreeForFonts(
        nodeRef: PdfObjectReference,
        fonts: Map<string, PdfFont>,
    ): void {
        const nodeObject = this.document.readObject({
            objectNumber: nodeRef.objectNumber,
            generationNumber: nodeRef.generationNumber,
        })

        if (!nodeObject) return

        const nodeDict = nodeObject.content.as(PdfDictionary)
        const type = nodeDict.get('Type')?.as(PdfName)

        if (type?.value === 'Page') {
            this.extractFontsFromPage(nodeObject, nodeDict, fonts)
        } else if (type?.value === 'Pages') {
            const kids = nodeDict.get('Kids')?.as(PdfArray)
            if (kids) {
                for (const kidRef of kids.items) {
                    if (kidRef instanceof PdfObjectReference) {
                        this.traversePageTreeForFonts(kidRef, fonts)
                    }
                }
            }
        }
    }

    /**
     * Extracts font information from a page's resources.
     */
    private extractFontsFromPage(
        _pageObject: PdfIndirectObject,
        pageDict: PdfDictionary,
        fonts: Map<string, PdfFont>,
    ): void {
        // Get Resources - could be direct dict or reference
        let resources = pageDict.get('Resources')?.as(PdfDictionary)

        if (!resources) {
            const resourcesRef = pageDict
                .get('Resources')
                ?.as(PdfObjectReference)
            if (resourcesRef) {
                const resourcesObj = this.document.readObject({
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
                const fontObj = this.document.readObject({
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
                const obj = this.document.readObject({
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
                    container: fontIndirectObj as PdfIndirectObject,
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
     * Searches the PDF structure for a font by name.
     * @internal
     */
    private searchFontInPdf(fontName: string): PdfFont | undefined {
        const fonts = this.collectAllFontsFromPdf()
        return fonts?.get(fontName)
    }

    /**
     * Collects all fonts from the PDF structure.
     * @internal
     */
    private collectAllFontsFromPdf(): Map<string, PdfFont> {
        const fonts = new Map<string, PdfFont>()

        const catalog = this.document.root
        if (!catalog) return fonts

        const pagesRef = catalog.content.get('Pages')
        if (!pagesRef) return fonts

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) return fonts

        this.traversePageTreeForFonts(pagesObjRef, fonts)
        return fonts
    }

    /**
     * Adds a font to the AcroForm default resources (DR) dictionary.
     * This ensures fonts are available to form fields.
     */
    private addFontToAcroFormResources(
        resourceName: string,
        fontObject: PdfIndirectObject<PdfDictionary>,
    ): void {
        const catalog = this.document.root
        if (!catalog) return

        // Get AcroForm dictionary
        const acroFormRef = catalog.content.get('AcroForm')
        if (!acroFormRef) return

        let acroFormDict: PdfDictionary | undefined
        let acroFormContainer: PdfIndirectObject | undefined

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = this.document.readObject({
                objectNumber: acroFormRef.objectNumber,
                generationNumber: acroFormRef.generationNumber,
            })
            if (acroFormObject) {
                acroFormDict = acroFormObject.content.as(PdfDictionary)
                acroFormContainer = acroFormObject
            }
        } else {
            acroFormDict = acroFormRef.as(PdfDictionary)
        }

        if (!acroFormDict) return

        // Get or create DR (Default Resources) dictionary
        let dr = acroFormDict.get('DR')?.as(PdfDictionary)
        if (!dr) {
            dr = new PdfDictionary()
            acroFormDict.set('DR', dr)
        }

        // Get or create Font dictionary within DR
        let fontDict = dr.get('Font')?.as(PdfDictionary)
        if (!fontDict) {
            fontDict = new PdfDictionary()
            dr.set('Font', fontDict)
        }

        // Add the font reference
        fontDict.set(resourceName, fontObject.reference)

        // Commit the modified AcroForm object if it's an indirect object
        if (acroFormContainer) {
            this.document.add(acroFormContainer)
        }
    }

    /**
     * Adds a font to the global /Pages node Resources dictionary.
     * All child pages will inherit these fonts automatically.
     * This is more efficient than adding to each individual page.
     */
    private addFontToPageResources(
        resourceName: string,
        fontObject: PdfIndirectObject<PdfDictionary>,
    ): void {
        const catalog = this.document.root
        const pagesRef = catalog.content.get('Pages')
        if (!pagesRef) return

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) return

        // Read the root /Pages object
        const pagesObject = this.document.readObject({
            objectNumber: pagesObjRef.objectNumber,
            generationNumber: pagesObjRef.generationNumber,
        })

        if (!pagesObject) return

        const pagesDict = pagesObject.content.as(PdfDictionary)
        if (!pagesDict) return

        // Get or create Resources dictionary on the /Pages node
        let resources = pagesDict.get('Resources')?.as(PdfDictionary)
        if (!resources) {
            resources = new PdfDictionary()
            pagesDict.set('Resources', resources)
        }

        // Get or create Font dictionary within Resources
        let fontDict = resources.get('Font')?.as(PdfDictionary)
        if (!fontDict) {
            fontDict = new PdfDictionary()
            resources.set('Font', fontDict)
        }

        // Add the font reference to the global dictionary
        fontDict.set(resourceName, fontObject.reference)

        // Commit the modified /Pages object
        this.document.add(pagesObject)

        // Also add to AcroForm DR if AcroForm exists
        this.addFontToAcroFormResources(resourceName, fontObject)
    }
}
