import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { ByteArray } from '../types.js'
import {
    FontDescriptor,
    UnicodeFontDescriptor,
    CIDWidth,
    EmbeddedFont,
} from './types.js'

/**
 * Manages font embedding in PDF documents.
 * Provides methods to embed TrueType and other font formats.
 */
export class PdfFontManager {
    private document: PdfDocument
    private embeddedFonts: Map<string, EmbeddedFont> = new Map()
    private fontResourceCounter: number = 0

    constructor(document: PdfDocument) {
        this.document = document
    }

    /**
     * Embeds a TrueType font into the PDF document.
     *
     * @param fontData - The font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Font metrics and properties
     * @returns The font resource name (e.g., "F1") to use in content streams
     */
    async embedTrueTypeFont(
        fontData: ByteArray,
        fontName: string,
        descriptor: FontDescriptor,
    ): Promise<string> {
        // Check if already embedded
        if (this.embeddedFonts.has(fontName)) {
            return this.embeddedFonts.get(fontName)!.baseFont
        }

        // Create font descriptor
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

        // Create font dictionary
        const fontDict = new PdfDictionary()
        fontDict.set('Type', new PdfName('Font'))
        fontDict.set('Subtype', new PdfName('TrueType'))
        fontDict.set('BaseFont', new PdfName(descriptor.fontName))
        fontDict.set('FontDescriptor', fontDescriptorObject.reference)
        fontDict.set('Encoding', new PdfName('WinAnsiEncoding'))

        // Add width information for proper glyph rendering
        const firstChar = descriptor.firstChar ?? 32
        const lastChar = descriptor.lastChar ?? 255
        fontDict.set('FirstChar', new PdfNumber(firstChar))
        fontDict.set('LastChar', new PdfNumber(lastChar))

        if (descriptor.widths) {
            fontDict.set(
                'Widths',
                new PdfArray(descriptor.widths.map((w) => new PdfNumber(w))),
            )
        } else {
            // Default: 1000 (standard em-square)
            const defaultWidths = Array(lastChar - firstChar + 1)
                .fill(0)
                .map(() => new PdfNumber(1000))
            fontDict.set('Widths', new PdfArray(defaultWidths))
        }

        const fontObject = new PdfIndirectObject({
            content: fontDict,
        })

        // Commit all objects
        await this.document.commit(
            fontFileObject,
            fontDescriptorObject,
            fontObject,
        )

        // Register in resources
        this.fontResourceCounter++
        const resourceName = `F${this.fontResourceCounter}`
        this.embeddedFonts.set(fontName, {
            fontName,
            fontRef: fontObject,
            baseFont: resourceName,
            encoding: 'WinAnsiEncoding',
        })

        // Update page resources
        await this.addFontToPageResources(resourceName, fontObject)

        return resourceName
    }

    /**
     * Embeds a standard PDF font (Type1).
     * These fonts don't require font data as they're built into PDF viewers.
     *
     * @param fontName - One of the 14 standard PDF fonts
     * @returns The font resource name to use in content streams
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
    ): Promise<string> {
        // Check if already embedded
        if (this.embeddedFonts.has(fontName)) {
            return this.embeddedFonts.get(fontName)!.baseFont
        }

        // Create font dictionary for standard font
        const fontDict = new PdfDictionary()
        fontDict.set('Type', new PdfName('Font'))
        fontDict.set('Subtype', new PdfName('Type1'))
        fontDict.set('BaseFont', new PdfName(fontName))

        const fontObject = new PdfIndirectObject({
            content: fontDict,
        })

        await this.document.commit(fontObject)

        // Register in resources
        this.fontResourceCounter++
        const resourceName = `F${this.fontResourceCounter}`
        this.embeddedFonts.set(fontName, {
            fontName,
            fontRef: fontObject,
            baseFont: resourceName,
        })

        // Update page resources
        await this.addFontToPageResources(resourceName, fontObject)

        return resourceName
    }

    /**
     * Gets the font reference by font name or resource name.
     */
    getFont(fontName: string): EmbeddedFont | undefined {
        return this.embeddedFonts.get(fontName)
    }

    /**
     * Gets all embedded fonts.
     */
    getAllFonts(): Map<string, EmbeddedFont> {
        return new Map(this.embeddedFonts)
    }

    /**
     * Embeds a TrueType font with Unicode/Type0 support.
     * Use this for fonts that need to display non-ASCII characters.
     *
     * @param fontData - The font file bytes
     * @param fontName - The name to use for this font in the PDF
     * @param descriptor - Unicode font descriptor with CID metrics
     * @param unicodeMappings - Map of CID to Unicode code point for ToUnicode CMap
     * @returns The font resource name (e.g., "F1") to use in content streams
     */
    async embedTrueTypeFontUnicode(
        fontData: ByteArray,
        fontName: string,
        descriptor: UnicodeFontDescriptor,
        unicodeMappings?: Map<number, number>,
    ): Promise<string> {
        // Check if already embedded
        if (this.embeddedFonts.has(fontName)) {
            return this.embeddedFonts.get(fontName)!.baseFont
        }

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
            cidFontDict.set('W', this.buildCIDWidthArray(descriptor.cidWidths))
        }

        // CIDToGIDMap
        cidFontDict.set(
            'CIDToGIDMap',
            new PdfName(descriptor.cidToGidMap ?? 'Identity'),
        )

        const cidFontObject = new PdfIndirectObject({
            content: cidFontDict,
        })

        // Create Type0 font dictionary
        const type0FontDict = new PdfDictionary()
        type0FontDict.set('Type', new PdfName('Font'))
        type0FontDict.set('Subtype', new PdfName('Type0'))
        type0FontDict.set(
            'BaseFont',
            new PdfName(`${descriptor.fontName}-Identity-H`),
        )
        type0FontDict.set('Encoding', new PdfName('Identity-H'))
        type0FontDict.set(
            'DescendantFonts',
            new PdfArray([cidFontObject.reference]),
        )

        // Create ToUnicode CMap if mappings provided
        if (unicodeMappings && unicodeMappings.size > 0) {
            const cmapContent = this.generateToUnicodeCMap(unicodeMappings)
            const cmapStream = new PdfStream({
                header: new PdfDictionary(),
                original: new TextEncoder().encode(cmapContent),
            })
            cmapStream.addFilter('FlateDecode')

            const cmapObject = new PdfIndirectObject({
                content: cmapStream,
            })

            type0FontDict.set('ToUnicode', cmapObject.reference)

            await this.document.commit(
                fontFileObject,
                fontDescriptorObject,
                cidFontObject,
                cmapObject,
            )
        } else {
            await this.document.commit(
                fontFileObject,
                fontDescriptorObject,
                cidFontObject,
            )
        }

        const fontObject = new PdfIndirectObject({
            content: type0FontDict,
        })

        await this.document.commit(fontObject)

        // Register in resources
        this.fontResourceCounter++
        const resourceName = `F${this.fontResourceCounter}`
        this.embeddedFonts.set(fontName, {
            fontName,
            fontRef: fontObject,
            baseFont: resourceName,
            encoding: 'Identity-H',
        })

        // Update page resources
        await this.addFontToPageResources(resourceName, fontObject)

        return resourceName
    }

    /**
     * Loads existing fonts from the PDF document.
     * Traverses the page tree and extracts font information from page resources.
     *
     * @returns Map of font names to their embedded font info
     */
    async loadExistingFonts(): Promise<Map<string, EmbeddedFont>> {
        const catalog = this.document.rootDictionary
        if (!catalog) return this.embeddedFonts

        const pagesRef = catalog.get('Pages')
        if (!pagesRef) return this.embeddedFonts

        const pagesObjRef = pagesRef.as(PdfObjectReference)
        if (!pagesObjRef) return this.embeddedFonts

        await this.traversePageTreeForFonts(pagesObjRef)

        return new Map(this.embeddedFonts)
    }

    /**
     * Generates a ToUnicode CMap for mapping CIDs to Unicode code points.
     */
    private generateToUnicodeCMap(mappings: Map<number, number>): string {
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
    private buildCIDWidthArray(widths: CIDWidth[]): PdfArray {
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

    /**
     * Traverses the page tree to find and load existing fonts.
     */
    private async traversePageTreeForFonts(
        nodeRef: PdfObjectReference,
    ): Promise<void> {
        const nodeObject = await this.document.readObject({
            objectNumber: nodeRef.objectNumber,
            generationNumber: nodeRef.generationNumber,
        })

        if (!nodeObject) return

        const nodeDict = nodeObject.content.as(PdfDictionary)
        const type = nodeDict.get('Type')?.as(PdfName)

        if (type?.value === 'Page') {
            await this.extractFontsFromPage(nodeObject, nodeDict)
        } else if (type?.value === 'Pages') {
            const kids = nodeDict.get('Kids')?.as(PdfArray)
            if (kids) {
                for (const kidRef of kids.items) {
                    if (kidRef instanceof PdfObjectReference) {
                        await this.traversePageTreeForFonts(kidRef)
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
            // Skip if already loaded
            if (this.embeddedFonts.has(resourceName)) continue

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
                this.embeddedFonts.set(resourceName, {
                    fontName: baseFont,
                    fontRef: fontIndirectObj,
                    baseFont: resourceName,
                    encoding: encoding,
                })

                // Also register by baseFont name for lookup convenience
                if (!this.embeddedFonts.has(baseFont)) {
                    this.embeddedFonts.set(baseFont, {
                        fontName: baseFont,
                        fontRef: fontIndirectObj,
                        baseFont: resourceName,
                        encoding: encoding,
                    })
                }
            }
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
