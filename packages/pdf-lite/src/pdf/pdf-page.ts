import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfStream } from '../core/objects/pdf-stream.js'
import { PdfPages } from './pdf-pages.js'
import {
    parseContentStreamForText,
    parseContentStreamForGraphics,
    type TextBlock,
    type GraphicLine,
} from '../utils/content-stream-parser.js'
import { PdfContentStream } from './pdf-content-stream.js'
import { PdfFont } from '../fonts/pdf-font.js'

type PdfPageDictionary = PdfDictionary<{
    Type: PdfName<'Page'>
    Parent: PdfObjectReference
    MediaBox: PdfArray<PdfNumber>
    CropBox?: PdfArray<PdfNumber>
    BleedBox?: PdfArray<PdfNumber>
    TrimBox?: PdfArray<PdfNumber>
    ArtBox?: PdfArray<PdfNumber>
    Rotate?: PdfNumber
    Contents?: PdfObjectReference | PdfArray<PdfObjectReference>
    Resources?: PdfDictionary | PdfObjectReference
    Annots?: PdfArray<PdfObjectReference> | PdfObjectReference
}>

export class PdfPage extends PdfIndirectObject<PdfPageDictionary> {
    constructor(options?: PdfIndirectObject) {
        super(
            options ??
                new PdfIndirectObject({
                    content: new PdfDictionary(),
                }),
        )
    }

    private getBox(
        name: 'MediaBox' | 'CropBox' | 'BleedBox' | 'TrimBox' | 'ArtBox',
    ): [number, number, number, number] | null {
        const box = this.content.get(name)?.as(PdfArray<PdfNumber>)
        if (!box || box.items.length < 4) return null
        return [
            box.items[0].value,
            box.items[1].value,
            box.items[2].value,
            box.items[3].value,
        ]
    }

    private setBox(
        name: 'MediaBox' | 'CropBox' | 'BleedBox' | 'TrimBox' | 'ArtBox',
        value: [number, number, number, number] | null,
    ): void {
        if (value === null) {
            this.content.delete(name)
        } else {
            this.content.set(
                name,
                new PdfArray(value.map((v) => new PdfNumber(v))),
            )
        }
    }

    get mediaBox(): [number, number, number, number] {
        return this.getBox('MediaBox') ?? [0, 0, 612, 792]
    }

    set mediaBox(value: [number, number, number, number]) {
        this.setBox('MediaBox', value)
    }

    get cropBox(): [number, number, number, number] | null {
        return this.getBox('CropBox')
    }

    set cropBox(value: [number, number, number, number] | null) {
        this.setBox('CropBox', value)
    }

    get bleedBox(): [number, number, number, number] | null {
        return this.getBox('BleedBox')
    }

    set bleedBox(value: [number, number, number, number] | null) {
        this.setBox('BleedBox', value)
    }

    get trimBox(): [number, number, number, number] | null {
        return this.getBox('TrimBox')
    }

    set trimBox(value: [number, number, number, number] | null) {
        this.setBox('TrimBox', value)
    }

    get artBox(): [number, number, number, number] | null {
        return this.getBox('ArtBox')
    }

    set artBox(value: [number, number, number, number] | null) {
        this.setBox('ArtBox', value)
    }

    get width(): number {
        const box = this.mediaBox
        return box[2] - box[0]
    }

    get height(): number {
        const box = this.mediaBox
        return box[3] - box[1]
    }

    get rotate(): number {
        return this.content.get('Rotate')?.as(PdfNumber)?.value ?? 0
    }

    set rotate(value: number) {
        this.content.set('Rotate', new PdfNumber(value))
    }

    get contents(): PdfObjectReference | PdfArray<PdfObjectReference> | null {
        const entry = this.content.get('Contents')
        if (!entry) return null
        if (entry instanceof PdfArray)
            return entry as PdfArray<PdfObjectReference>
        return entry.as(PdfObjectReference) ?? null
    }

    set contents(
        value: PdfObjectReference | PdfArray<PdfObjectReference> | null,
    ) {
        if (value === null) {
            this.content.delete('Contents')
        } else {
            this.content.set('Contents', value)
        }
    }

    get resources(): PdfDictionary | null {
        const entry = this.content.get('Resources')
        if (!entry) return null
        if (entry instanceof PdfObjectReference) {
            const resolved = entry.resolve()
            if (resolved?.content instanceof PdfDictionary) {
                return resolved.content
            }
            return null
        }
        return entry.as(PdfDictionary) ?? null
    }

    set resources(value: PdfDictionary | PdfObjectReference | null) {
        if (value === null) {
            this.content.delete('Resources')
        } else {
            this.content.set('Resources', value)
        }
    }

    get annotations(): PdfArray<PdfObjectReference> {
        const entry = this.content.get('Annots')
        if (entry instanceof PdfArray) {
            return entry as PdfArray<PdfObjectReference>
        }
        if (entry instanceof PdfObjectReference) {
            const resolved = entry.resolve()
            if (resolved?.content instanceof PdfArray) {
                return resolved.content as PdfArray<PdfObjectReference>
            }
        }
        const newArray = new PdfArray<PdfObjectReference>()
        this.content.set('Annots', newArray)
        return newArray
    }

    set annotations(value: PdfArray<PdfObjectReference>) {
        this.content.set('Annots', value)
    }

    get parentRef(): PdfObjectReference {
        return this.content.get('Parent')!.as(PdfObjectReference)!
    }

    set parentRef(value: PdfObjectReference) {
        this.content.set('Parent', value)
    }

    get parent(): PdfPages {
        return this.parentRef.resolve(PdfPages)
    }

    set parent(value: PdfPages) {
        this.parentRef = value.reference
    }

    get fontMap(): Map<string, PdfFont> {
        const resources = this.resources
        const fontDictEntry = resources?.get('Font')
        const fontDict =
            fontDictEntry instanceof PdfDictionary
                ? fontDictEntry
                : fontDictEntry instanceof PdfObjectReference
                  ? fontDictEntry.resolve(PdfIndirectObject<PdfDictionary>)
                        ?.content
                  : null

        const map = new Map<string, PdfFont>()

        if (fontDict) {
            for (const [key, value] of fontDict.entries()) {
                if (value instanceof PdfObjectReference) {
                    const resolved = value.resolve(PdfFont)
                    map.set(key, resolved)
                }
            }
        }

        return map
    }

    /**
     * Get all content streams for this page as an array.
     * Handles both single stream and array of streams cases.
     * Returns empty array if no content streams exist.
     */
    get contentStreams(): PdfContentStream[] {
        const contentsEntry = this.contents
        if (!contentsEntry) return []

        const streams: PdfContentStream[] = []

        if (contentsEntry instanceof PdfArray) {
            // Multiple content streams
            for (const ref of contentsEntry.items) {
                const resolved = ref.resolve(PdfContentStream)
                streams.push(resolved)
            }
        } else if (contentsEntry instanceof PdfObjectReference) {
            // Single content stream
            const resolved = contentsEntry.resolve(PdfContentStream)
            streams.push(resolved)
        }

        return streams
    }

    /**
     * Extract all text blocks from this page's content streams with their bounding boxes.
     * This parses all page content streams and returns text operators with position information.
     * Note: Does not include AcroForm field appearance streams - only page content.
     *
     * @returns Array of text blocks with bounding box information
     */
    extractTextBlocks(): TextBlock[] {
        const streams = this.contentStreams
        const allBlocks: TextBlock[] = []

        // Get font resources from the page to enable accurate text width calculations
        const resources = this.resources
        const fontDictEntry = resources?.get('Font')
        const fontDict =
            fontDictEntry instanceof PdfDictionary
                ? fontDictEntry
                : fontDictEntry instanceof PdfObjectReference
                  ? fontDictEntry
                  : null

        for (const stream of streams) {
            try {
                // Decode the stream to get the content string
                const contentString = stream.dataAsString
                const blocks = parseContentStreamForText(contentString, {
                    resources,
                    fontDict,
                })
                allBlocks.push(...blocks)
            } catch (error) {
                // Skip streams that can't be decoded
                console.warn('Failed to parse content stream:', error)
            }
        }

        return allBlocks
    }

    extractGraphicLines(): GraphicLine[] {
        const streams = this.contentStreams
        const allLines: GraphicLine[] = []

        for (const stream of streams) {
            try {
                const contentString = stream.dataAsString
                const lines = parseContentStreamForGraphics(contentString)
                allLines.push(...lines)
            } catch (error) {
                console.warn(
                    'Failed to parse content stream for graphics:',
                    error,
                )
            }
        }

        return allLines
    }
}
