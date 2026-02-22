import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { buildEncodingMap } from '../utils/decodeWithFontEncoding.js'
import type { PdfDocument } from '../pdf/pdf-document.js'

/**
 * Represents a PDF font encoding dictionary with custom character mappings.
 * 
 * Example structure:
 * ```
 * <<
 *   /Type /Encoding
 *   /BaseEncoding /WinAnsiEncoding
 *   /Differences [ 32 /space /exclam /quotedbl ... ]
 * >>
 * ```
 */
export class PdfFontEncoding extends PdfIndirectObject<
    PdfDictionary<{
        Type?: PdfName<'Encoding'>
        BaseEncoding?: PdfName
        Differences?: PdfArray
    }>
> {
    /**
     * @internal
     * Cached encoding map (code point → Unicode character).
     * undefined = not yet parsed, null = no Differences array
     */
    private _encodingMap?: Map<number, string> | null

    constructor(options?: {
        baseEncoding?: string
        differences?: PdfArray
        encodingMap?: Map<number, string>
    }) {
        super({
            content: new PdfDictionary(),
        })

        if (options?.baseEncoding) {
            this.content.set('Type', new PdfName('Encoding'))
            this.content.set('BaseEncoding', new PdfName(options.baseEncoding))
        }

        if (options?.differences) {
            this.content.set('Differences', options.differences)
        }

        if (options?.encodingMap) {
            this._encodingMap = options.encodingMap
        }
    }

    /**
     * Gets the base encoding name (e.g., 'WinAnsiEncoding', 'MacRomanEncoding').
     */
    get baseEncoding(): string | undefined {
        const base = this.content.get('BaseEncoding')
        return base?.value
    }

    /**
     * Sets the base encoding name.
     */
    set baseEncoding(name: string | undefined) {
        if (name) {
            this.content.set('BaseEncoding', new PdfName(name))
        } else {
            this.content.delete('BaseEncoding')
        }
    }

    /**
     * Gets the Differences array.
     */
    get differences(): PdfArray | undefined {
        return this.content.get('Differences')
    }

    /**
     * Sets the Differences array.
     */
    set differences(array: PdfArray | undefined) {
        if (array) {
            this.content.set('Differences', array)
            // Invalidate cached encoding map
            this._encodingMap = undefined
        } else {
            this.content.delete('Differences')
            this._encodingMap = null
        }
    }

    /**
     * Gets the encoding map (code point → Unicode character).
     * Parses the Differences array if not already cached.
     * Returns null if no Differences array exists.
     */
    getEncodingMap(): Map<number, string> | null {
        // Return cached result if already parsed
        if (this._encodingMap !== undefined) {
            return this._encodingMap
        }

        // Get the Differences array
        const differencesEntry = this.content.get('Differences')
        if (!(differencesEntry instanceof PdfArray)) {
            this._encodingMap = null
            return null
        }

        // Parse and cache the encoding map
        const encodingMap = buildEncodingMap(differencesEntry)
        this._encodingMap = encodingMap
        return encodingMap
    }

    /**
     * Creates a PdfFontEncoding from an existing dictionary.
     * 
     * @param dict - The encoding dictionary
     * @returns A PdfFontEncoding instance
     */
    static fromDictionary(dict: PdfDictionary): PdfFontEncoding {
        const encoding = new PdfFontEncoding()
        encoding.content.copyFrom(dict)
        return encoding
    }

    /**
     * Creates a PdfFontEncoding with a custom Differences array.
     * 
     * @param baseEncoding - Base encoding name (e.g., 'WinAnsiEncoding')
     * @param differences - Array in format [code name1 name2 ...]
     * @returns A PdfFontEncoding instance
     */
    static fromDifferences(
        baseEncoding: string,
        differences: PdfArray,
    ): PdfFontEncoding {
        return new PdfFontEncoding({
            baseEncoding,
            differences,
        })
    }

    /**
     * Creates a PdfFontEncoding from a code point to glyph name mapping.
     * 
     * @param baseEncoding - Base encoding name (e.g., 'WinAnsiEncoding')
     * @param mappings - Map of character code to glyph name
     * @returns A PdfFontEncoding instance
     */
    static fromMappings(
        baseEncoding: string,
        mappings: Map<number, string>,
    ): PdfFontEncoding {
        // Build Differences array from mappings
        const differences: (PdfNumber | PdfName)[] = []
        const sortedCodes = Array.from(mappings.keys()).sort((a, b) => a - b)

        for (let i = 0; i < sortedCodes.length; i++) {
            const code = sortedCodes[i]
            const name = mappings.get(code)!

            // Check if we can continue a run or need to start a new one
            const prevCode = sortedCodes[i - 1]
            if (i === 0 || code !== prevCode + 1) {
                differences.push(new PdfNumber(code))
            }

            differences.push(new PdfName(name))
        }

        const encoding = new PdfFontEncoding({
            baseEncoding,
            differences: new PdfArray(differences),
        })

        // Cache the encoding map since we already have it
        encoding._encodingMap = mappings

        return encoding
    }

    /**
     * Loads a PdfFontEncoding from an existing PDF document.
     * 
     * @param document - The PDF document to load from
     * @param encodingRef - The encoding dictionary or indirect reference
     * @returns A PdfFontEncoding instance, or null if the encoding is a standard name or invalid
     */
    static async fromDocument(
        document: PdfDocument,
        encodingRef: PdfDictionary | PdfObjectReference | PdfName,
    ): Promise<PdfFontEncoding | undefined> {
        let encodingDict: PdfDictionary | null = null

        if (encodingRef instanceof PdfObjectReference) {
            const encodingObj = await document.readObject({
                objectNumber: encodingRef.objectNumber,
                generationNumber: encodingRef.generationNumber,
            })
            encodingDict = encodingObj?.content.as(PdfDictionary) ?? null
        } else if (encodingRef instanceof PdfDictionary) {
            encodingDict = encodingRef
        } else if (encodingRef instanceof PdfName) {
            // Standard encoding name (e.g., WinAnsiEncoding) - no custom dictionary
            return undefined
        }

        if (!encodingDict) {
            return undefined
        }

        return PdfFontEncoding.fromDictionary(encodingDict)
    }
}
