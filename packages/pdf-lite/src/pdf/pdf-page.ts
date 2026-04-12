import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfPages } from './pdf-pages.js'
import {
    GraphicsBlock,
    PdfContentStreamObject,
    TextBlock,
} from '../graphics/pdf-content-stream.js'
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
     * Register a font in this page's /Resources/Font dictionary.
     * Avoids overwriting existing font entries by generating a unique
     * resource name when a collision is detected.
     * Returns the resource name used (e.g. "F1").
     */
    addFont(font: PdfFont): string {
        let resources = this.resources
        if (!resources) {
            resources = new PdfDictionary()
            this.resources = resources
        }

        let fontDict = resources.get('Font')
        if (!fontDict || !(fontDict instanceof PdfDictionary)) {
            fontDict = new PdfDictionary()
            resources.set('Font', fontDict)
        }

        const fd = fontDict as PdfDictionary
        const existing = new Set([...fd.entries()].map(([k]) => k))

        // Pick a resource name that doesn't collide with existing entries
        let resName = font.resourceName
        if (!resName || existing.has(resName)) {
            let idx = 1
            while (existing.has(`F${idx}`)) idx++
            resName = `F${idx}`
        }

        fd.set(resName, font.reference)
        return resName
    }

    /**
     * Get all content streams for this page as an array.
     * Handles both single stream and array of streams cases.
     * Returns empty array if no content streams exist.
     */
    get contentStreams(): PdfContentStreamObject[] {
        const contentsEntry = this.contents
        if (!contentsEntry) return []

        const streams: PdfContentStreamObject[] = []

        if (contentsEntry instanceof PdfArray) {
            // Multiple content streams
            for (const ref of contentsEntry.items) {
                const resolved = ref.resolve(PdfContentStreamObject)
                resolved.page = this
                streams.push(resolved)
            }
        } else if (contentsEntry instanceof PdfObjectReference) {
            // Single content stream
            const resolved = contentsEntry.resolve(PdfContentStreamObject)
            resolved.page = this
            streams.push(resolved)
        }

        return streams
    }

    /**
     * Merge all content streams into the first stream so that the
     * page's node tree is a single live tree.  This is needed before
     * in-place editing so that modifications to nodes propagate to
     * serialization.
     */
    consolidateContentStreams(): void {
        const streams = this.contentStreams
        if (streams.length <= 1) return
        // Already consolidated — streams[1+] are empty, skip to avoid
        // a destructive serialization→clear→re-parse round-trip on
        // the live node tree in streams[0].
        if (streams.slice(1).every((s) => s.dataAsString === '')) return
        const combinedData = streams.map((s) => s.dataAsString).join('\n')
        streams[0].dataAsString = combinedData
        for (let i = 1; i < streams.length; i++) {
            streams[i].dataAsString = ''
        }
    }

    extractTextBlocks(): TextBlock[] {
        const streams = this.contentStreams
        if (streams.length === 0) return []
        if (streams.length === 1) return streams[0].textBlocks

        // Concatenate all content stream data before parsing
        const combinedData = streams.map((s) => s.dataAsString).join('\n')
        const first = streams[0]
        const savedData = first.dataAsString
        first.dataAsString = combinedData
        const blocks = first.textBlocks
        first.dataAsString = savedData
        return blocks
    }

    /**
     * Consolidate content streams, extract text blocks, and regroup them
     * by visual line.  The returned blocks carry source-segment references
     * so that `editText()` and `moveBy()` modify the live content-stream
     * tree in-place.
     */
    getTextBlocks(): TextBlock[] {
        this.consolidateContentStreams()
        const streams = this.contentStreams
        if (streams.length === 0) return []
        // After consolidation all data is in streams[0].  Access
        // textBlocks directly so the returned TextBlock objects are
        // live references inside the cached _nodes tree — edits to
        // their ops propagate to dataAsString / toBytes.
        const raw = streams[0].textBlocks
        return TextBlock.regroupTextBlocks(raw)
    }

    extractGraphicLines(): GraphicsBlock[] {
        const streams = this.contentStreams
        if (streams.length === 0) return []
        if (streams.length === 1) return streams[0].graphicsBlocks

        const combinedData = streams.map((s) => s.dataAsString).join('\n')
        const first = streams[0]
        const savedData = first.dataAsString
        first.dataAsString = combinedData
        const blocks = first.graphicsBlocks
        first.dataAsString = savedData
        return blocks
    }

    /**
     * Replace the BT/ET block at the given sourceIndex with new content.
     * All TextBlocks that share the same sourceIndex (split siblings)
     * should be passed as replacementBlocks.
     */
    replaceTextInStream(
        sourceIndex: number,
        replacementBlocks: TextBlock[],
    ): void {
        const streams = this.contentStreams
        if (streams.length === 0) return

        const combinedData = streams.map((s) => s.dataAsString).join('\n')

        // Find BT...ET block positions in the raw content stream
        const btEtPositions: { start: number; end: number }[] = []
        const btRegex = /\bBT\b/g
        let btMatch: RegExpExecArray | null
        while ((btMatch = btRegex.exec(combinedData)) !== null) {
            // Find the matching ET (handle nested by simple scan — PDF doesn't nest BT/ET)
            const etRegex = /\bET\b/g
            etRegex.lastIndex = btMatch.index + 2
            const etMatch = etRegex.exec(combinedData)
            if (etMatch) {
                btEtPositions.push({
                    start: btMatch.index,
                    end: etMatch.index + 2,
                })
                // Advance btRegex past this ET to avoid finding BTs inside this block
                btRegex.lastIndex = etMatch.index + 2
            }
        }

        if (sourceIndex < 0 || sourceIndex >= btEtPositions.length) return

        const target = btEtPositions[sourceIndex]
        const replacement = replacementBlocks
            .map((b) => b.toString())
            .join('\n')

        const newData =
            combinedData.substring(0, target.start) +
            replacement +
            combinedData.substring(target.end)

        // Write back to the first stream, clear others
        streams[0].dataAsString = newData
        for (let i = 1; i < streams.length; i++) {
            streams[i].dataAsString = ''
        }
    }
}
