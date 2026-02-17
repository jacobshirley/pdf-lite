import { PdfDocument } from '../pdf/pdf-document.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfString } from '../core/objects/pdf-string.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { buildEncodingMap } from '../utils/decodeWithFontEncoding.js'
import type { PdfDefaultResourcesDictionary } from './acroform.js'

/**
 * Resolves and caches font encoding maps from the form's default resources.
 */
export class PdfFontEncodingCache {
    readonly fontEncodingMaps: Map<string, Map<number, string>> = new Map()
    private document?: PdfDocument
    private defaultResources: PdfDefaultResourcesDictionary | null

    constructor(
        document: PdfDocument | undefined,
        defaultResources: PdfDefaultResourcesDictionary | null,
    ) {
        this.document = document
        this.defaultResources = defaultResources
    }

    async getFontEncodingMap(
        fontName: string,
    ): Promise<Map<number, string> | null> {
        if (this.fontEncodingMaps.has(fontName)) {
            return this.fontEncodingMaps.get(fontName)!
        }

        const dr = this.defaultResources
        if (!dr) return null

        const fonts = dr.get('Font')?.as(PdfDictionary)
        if (!fonts) return null

        const fontRef = fonts.get(fontName)?.as(PdfObjectReference)
        if (!fontRef || !this.document) return null

        const fontObj = await this.document.readObject({
            objectNumber: fontRef.objectNumber,
            generationNumber: fontRef.generationNumber,
        })
        if (!fontObj) return null

        const fontDict = fontObj.content.as(PdfDictionary)
        const encoding = fontDict.get('Encoding')

        let encodingDict: PdfDictionary | null = null
        if (encoding instanceof PdfObjectReference) {
            const encodingObj = await this.document.readObject({
                objectNumber: encoding.objectNumber,
                generationNumber: encoding.generationNumber,
            })
            encodingDict = encodingObj?.content.as(PdfDictionary) ?? null
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

    async cacheAllFontEncodings(
        fields: Array<{ content: PdfDictionary }>,
    ): Promise<void> {
        const fontNames = new Set<string>()

        for (const field of fields) {
            const da = field.content.get('DA')?.as(PdfString)?.value
            if (da) {
                const fontMatch = da.match(/\/(\w+)\s+[\d.]+\s+Tf/)
                if (fontMatch) {
                    fontNames.add(fontMatch[1])
                }
            }
        }

        for (const fontName of fontNames) {
            await this.getFontEncodingMap(fontName)
        }
    }
}
