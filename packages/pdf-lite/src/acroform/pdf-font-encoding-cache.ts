import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { buildEncodingMap } from '../utils/decodeWithFontEncoding.js'
import { PdfDefaultResourcesDictionary } from '../annotations/pdf-default-resources.js'

/**
 * Resolves and caches font encoding maps from the form's default resources.
 */
export class PdfFontEncodingCache {
    readonly fontEncodingMaps: Map<string, Map<number, string>> = new Map()
    readonly fontTypes: Map<string, string> = new Map()
    /** Object references for all resolved fonts, keyed by resource name. */
    readonly fontRefs: Map<string, PdfObjectReference> = new Map()
    private document?: PdfDocument
    private defaultResources: PdfDefaultResourcesDictionary | null

    constructor(
        document: PdfDocument | undefined,
        defaultResources: PdfDefaultResourcesDictionary | null,
    ) {
        this.document = document
        this.defaultResources = defaultResources
    }

    getFontEncodingMap(fontName: string): Map<number, string> | null {
        if (this.fontEncodingMaps.has(fontName)) {
            return this.fontEncodingMaps.get(fontName)!
        }

        const dr = this.defaultResources
        if (!dr) return null

        const fontDictEntry = dr.get('Font')
        const fonts =
            fontDictEntry instanceof PdfDictionary ? fontDictEntry : null
        if (!fonts) return null

        const fontEntry = fonts.get(fontName)
        const fontRef =
            fontEntry instanceof PdfObjectReference ? fontEntry : null
        if (!fontRef) return null

        this.fontRefs.set(fontName, fontRef)

        const fontObj = this.document?.readObject(fontRef)
        if (!fontObj) return null

        const fontDict =
            fontObj.content instanceof PdfDictionary ? fontObj.content : null
        if (!fontDict) return null

        // Cache font subtype (Type0, TrueType, Type1, etc.)
        const subtypeEntry = fontDict.get('Subtype')
        const subtype =
            subtypeEntry instanceof PdfName ? subtypeEntry.value : undefined
        if (subtype) {
            this.fontTypes.set(fontName, subtype)
        }

        const encoding = fontDict.get('Encoding')

        let encodingDict: PdfDictionary | null = null
        if (encoding instanceof PdfObjectReference) {
            const encodingObj = this.document?.readObject(encoding)
            encodingDict =
                encodingObj?.content instanceof PdfDictionary
                    ? encodingObj.content
                    : null
        } else if (encoding instanceof PdfDictionary) {
            encodingDict = encoding
        }

        if (!encodingDict) return null

        const differences = encodingDict.get('Differences')?.as(PdfArray)
        if (!differences) return null

        const encodingMap = buildEncodingMap(differences)
        if (!encodingMap) return null

        this.fontEncodingMaps.set(fontName, encodingMap)
        return encodingMap
    }

    cacheAllFontEncodings(fields: Array<{ content: PdfDictionary }>): void {
        // Collect font names with an associated page ref for the first field
        // that uses them (needed to fall back to page resources).
        const fontPageRefs = new Map<string, PdfObjectReference | null>()

        for (const field of fields) {
            const daEntry = field.content.get('DA')
            const da = daEntry instanceof PdfString ? daEntry.value : undefined
            if (da) {
                const fontMatch = da.match(/\/(\w+)\s+[\d.]+\s+Tf/)
                if (fontMatch) {
                    const fontName = fontMatch[1]
                    if (!fontPageRefs.has(fontName)) {
                        const pageEntry = field.content.get('P')
                        const pageRef =
                            pageEntry instanceof PdfObjectReference
                                ? pageEntry
                                : null
                        fontPageRefs.set(fontName, pageRef)
                    }
                }
            }
        }

        for (const [fontName, pageRef] of fontPageRefs) {
            this.getFontEncodingMap(fontName)
            // If the font was not in the AcroForm DR, try the field's page resources
            if (!this.fontRefs.has(fontName) && pageRef) {
                this.resolveFontFromPage(fontName, pageRef)
            }
        }
    }

    /**
     * Walks the page-tree (page → parent → … → Pages root), looking for the
     * font in each node's /Resources/Font dict. Stops as soon as it finds the
     * font. PDF resource inheritance means any ancestor can supply the font.
     */
    private resolveFontFromPage(
        fontName: string,
        pageRef: PdfObjectReference,
    ): void {
        if (!this.document) return

        // Walk up the parent chain (max 16 levels to avoid infinite loops)
        let currentRef: PdfObjectReference | null = pageRef
        for (let depth = 0; depth < 16 && currentRef; depth++) {
            const nodeObj = this.document.readObject({
                objectNumber: currentRef.objectNumber,
                generationNumber: currentRef.generationNumber,
            })
            const nodeDict =
                nodeObj?.content instanceof PdfDictionary
                    ? nodeObj.content
                    : null
            if (!nodeDict) break

            // Try Resources.Font in this node
            const resourcesEntry = nodeDict.get('Resources')
            const resources =
                resourcesEntry instanceof PdfDictionary ? resourcesEntry : null
            if (resources) {
                const fontsEntry = resources.get('Font')
                const fonts =
                    fontsEntry instanceof PdfDictionary ? fontsEntry : null
                if (fonts) {
                    const fontEntry = fonts.get(fontName)
                    const fontRef =
                        fontEntry instanceof PdfObjectReference
                            ? fontEntry
                            : null
                    if (fontRef) {
                        // Found — cache and finish
                        currentRef = fontRef
                        break
                    }
                }
            }

            // Walk to parent
            const parentEntry = nodeDict.get('Parent')
            currentRef =
                parentEntry instanceof PdfObjectReference ? parentEntry : null
        }

        const fontRef = currentRef
        if (!fontRef) return

        this.fontRefs.set(fontName, fontRef)

        const fontObj = this.document.readObject({
            objectNumber: fontRef.objectNumber,
            generationNumber: fontRef.generationNumber,
        })
        const fontDict =
            fontObj?.content instanceof PdfDictionary ? fontObj.content : null
        if (!fontDict) return

        const subtypeEntry = fontDict.get('Subtype')
        const subtype =
            subtypeEntry instanceof PdfName ? subtypeEntry.value : undefined
        if (subtype) this.fontTypes.set(fontName, subtype)

        // Also resolve encoding map if present
        const encoding = fontDict.get('Encoding')
        let encodingDict: PdfDictionary | null = null
        if (encoding instanceof PdfObjectReference) {
            const encodingObj = this.document.readObject({
                objectNumber: encoding.objectNumber,
                generationNumber: encoding.generationNumber,
            })
            encodingDict =
                encodingObj?.content instanceof PdfDictionary
                    ? encodingObj.content
                    : null
        } else if (encoding instanceof PdfDictionary) {
            encodingDict = encoding
        }

        if (!encodingDict) return

        const differencesEntry = encodingDict.get('Differences')
        if (!(differencesEntry instanceof PdfArray)) return

        const encodingMap = buildEncodingMap(differencesEntry)
        if (encodingMap) {
            this.fontEncodingMaps.set(fontName, encodingMap)
        }
    }

    isFontUnicode(fontName: string): boolean {
        return this.fontTypes.get(fontName) === 'Type0'
    }
}
