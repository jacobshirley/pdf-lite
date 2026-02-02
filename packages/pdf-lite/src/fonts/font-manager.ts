import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { ByteArray } from '../types.js'
import { EmbeddedFont, FontDescriptor, UnicodeFontDescriptor } from './types.js'
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

    async findFontByName(fontName: string): Promise<PdfFont | undefined> {
        const font = await this.searchFontInPdf(fontName)
        if (font) {
            return this.wrapFont(font)
        }
        return undefined
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
        return await this.write(font, fontName)
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
        return await this.write(font, fontName)
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
    async getFont(fontName: string): Promise<EmbeddedFont | undefined> {
        return await this.searchFontInPdf(fontName)
    }

    /**
     * Wraps an embedded font in a PdfFont object.
     * @internal
     */
    private wrapFont(embedded: EmbeddedFont): PdfFont {
        return new PdfFont({
            fontName: embedded.fontName,
            resourceName: embedded.baseFont,
            encoding: embedded.encoding,
            manager: this,
            container: embedded.fontRef as PdfIndirectObject,
        })
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
    async write(font: PdfFont, cacheKey: string): Promise<PdfFont> {
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
            await this.document.commit(...objectsToCommit)
        }

        // Register in page resources
        await this.addFontToPageResources(resourceName, fontObject)

        return font
    }

    /**
     * Gets all embedded fonts.
     * Searches the PDF structure to find all fonts.
     */
    async getAllFonts(): Promise<Map<string, EmbeddedFont>> {
        const fonts = await this.collectAllFontsFromPdf()
        return fonts ?? new Map()
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
        return await this.write(font, fontName)
    }

    /**
     * Loads existing fonts from the PDF document.
     * Traverses the page tree and extracts font information from page resources.
     *
     * @returns Map of font names to their embedded font info
     */
    async loadExistingFonts(): Promise<Map<string, EmbeddedFont>> {
        const fonts = new Map<string, EmbeddedFont>()
        const catalog = this.document.rootDictionary
        if (!catalog) return fonts

        const pagesRef = catalog.get('Pages')
        if (!pagesRef) return fonts

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) return fonts

        await this.traversePageTreeForFonts(pagesObjRef, fonts)

        return fonts
    }

    /**
     * Traverses the page tree to find and load existing fonts.
     */
    private async traversePageTreeForFonts(
        nodeRef: PdfObjectReference,
        fonts: Map<string, EmbeddedFont>,
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
        fonts: Map<string, EmbeddedFont>,
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
                const embeddedFont = {
                    fontName: baseFont,
                    fontRef: fontIndirectObj,
                    baseFont: resourceName,
                    encoding: encoding,
                }
                fonts.set(resourceName, embeddedFont)

                // Also register by baseFont name for lookup convenience
                if (!fonts.has(baseFont)) {
                    fonts.set(baseFont, embeddedFont)
                }
            }
        }
    }

    /**
     * Searches the PDF structure for a font by name.
     * @internal
     */
    private async searchFontInPdf(
        fontName: string,
    ): Promise<EmbeddedFont | undefined> {
        const fonts = await this.collectAllFontsFromPdf()
        return fonts?.get(fontName)
    }

    /**
     * Collects all fonts from the PDF structure.
     * @internal
     */
    private async collectAllFontsFromPdf(): Promise<Map<string, EmbeddedFont>> {
        const fonts = new Map<string, EmbeddedFont>()

        const catalog = this.document.rootDictionary
        if (!catalog) return fonts

        const pagesRef = catalog.get('Pages')
        if (!pagesRef) return fonts

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) return fonts

        await this.traversePageTreeForFonts(pagesObjRef, fonts)
        return fonts
    }

    /**
     * Adds a font to the AcroForm default resources (DR) dictionary.
     * This ensures fonts are available to form fields.
     */
    private async addFontToAcroFormResources(
        resourceName: string,
        fontObject: PdfIndirectObject<PdfDictionary>,
    ): Promise<void> {
        const catalog = this.document.rootDictionary
        if (!catalog) return

        // Get AcroForm dictionary
        const acroFormRef = catalog.get('AcroForm')
        if (!acroFormRef) return

        let acroFormDict: PdfDictionary | undefined
        let acroFormContainer: PdfIndirectObject | undefined

        if (acroFormRef instanceof PdfObjectReference) {
            const acroFormObject = await this.document.readObject({
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
            await this.document.commit(acroFormContainer)
        }
    }

    /**
     * Adds a font to the page resources of all pages.
     */
    private async addFontToPageResources(
        resourceName: string,
        fontObject: PdfIndirectObject<PdfDictionary>,
    ): Promise<void> {
        const catalog = this.document.rootDictionary
        if (!catalog) return

        const pagesRef = catalog.get('Pages')
        if (!pagesRef) return

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) return

        await this.traversePageTree(pagesObjRef, resourceName, fontObject)

        // Also add to AcroForm DR if AcroForm exists
        await this.addFontToAcroFormResources(resourceName, fontObject)
    }

    /**
     * Recursively traverses the page tree and adds font to each page's resources.
     */
    private async traversePageTree(
        nodeRef: PdfObjectReference,
        resourceName: string,
        fontObject: PdfIndirectObject<PdfDictionary>,
    ): Promise<void> {
        const nodeObject = await this.document.readObject({
            objectNumber: nodeRef.objectNumber,
            generationNumber: nodeRef.generationNumber,
        })

        if (!nodeObject) return

        const nodeDict = nodeObject.content.as(PdfDictionary)
        const type = nodeDict.get('Type')?.as(PdfName)

        if (type?.value === 'Page') {
            // Leaf node - add font to this page's resources
            await this.addFontToPageDict(
                nodeObject,
                nodeDict,
                resourceName,
                fontObject,
            )
        } else if (type?.value === 'Pages') {
            // Intermediate node - traverse children
            const kids = nodeDict.get('Kids')?.as(PdfArray)
            if (kids) {
                for (const kidRef of kids.items) {
                    if (kidRef instanceof PdfObjectReference) {
                        await this.traversePageTree(
                            kidRef,
                            resourceName,
                            fontObject,
                        )
                    }
                }
            }
        }
    }

    /**
     * Adds a font reference to a page's Resources/Font dictionary.
     */
    private async addFontToPageDict(
        pageObject: PdfIndirectObject,
        pageDict: PdfDictionary,
        resourceName: string,
        fontObject: PdfIndirectObject<PdfDictionary>,
    ): Promise<void> {
        // Get or create Resources dictionary
        let resources = pageDict.get('Resources')?.as(PdfDictionary)
        if (!resources) {
            resources = new PdfDictionary()
            pageDict.set('Resources', resources)
        }

        // Get or create Font dictionary within Resources
        let fontDict = resources.get('Font')?.as(PdfDictionary)
        if (!fontDict) {
            fontDict = new PdfDictionary()
            resources.set('Font', fontDict)
        }

        // Add the font reference
        fontDict.set(resourceName, fontObject.reference)

        // Commit the modified page object
        await this.document.commit(pageObject)
    }
}
