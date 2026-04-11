import type { ByteArray } from '../types.js'
import type { AfmBBox, AfmFont, AfmKernPair, CIDWidth } from './types.js'
import { PdfDictionary } from '../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfObjectReference } from '../core/objects/pdf-object-reference.js'
import { PdfNumber } from '../core/objects/pdf-number.js'
import { PdfArray } from '../core/objects/pdf-array.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfStream } from '../core/objects/pdf-stream.js'

export interface GlyphMetrics {
    width: number
    name: string
    bbox: AfmBBox
    ligatures?: Record<string, string>
}

export interface PdfFontDescriptorOptions {
    fontData?: ByteArray
    kernPairs?: AfmKernPair[]
    charWidths?: Map<number, number>
    glyphMetrics?: Map<number, GlyphMetrics>
    glyphNameToCode?: Map<string, number>
    bbox?: AfmBBox
    ascender?: number
    descender?: number
    capHeight?: number
    xHeight?: number
    underlinePosition?: number
    underlineThickness?: number
    italicAngle?: number
    stdHW?: number
    stdVW?: number
    fontName?: string
    familyName?: string
    weight?: string
    fontWeight?: number
    isFixedPitch?: boolean
    isBold?: boolean
    isItalic?: boolean
    unitsPerEm?: number
    firstChar?: number
    lastChar?: number
    cidWidths?: CIDWidth[]
    defaultWidth?: number
    cidToGidMap?: 'Identity'
}

export class PdfFontDescriptor extends PdfIndirectObject<PdfDictionary> {
    // In-memory only fields (no PDF dictionary equivalent)
    fontData?: ByteArray
    readonly kernPairs: AfmKernPair[]
    readonly charWidths: Map<number, number>
    readonly glyphMetrics: Map<number, GlyphMetrics>
    readonly glyphNameToCode: Map<string, number>
    readonly underlinePosition?: number
    readonly underlineThickness?: number
    readonly weight?: string
    readonly isBold?: boolean
    readonly unitsPerEm?: number
    readonly firstChar?: number
    readonly lastChar?: number
    readonly cidWidths?: CIDWidth[]
    readonly defaultWidth?: number
    readonly cidToGidMap?: 'Identity'

    private _kernMap?: Map<string, number>

    constructor(options: PdfFontDescriptorOptions) {
        super(new PdfIndirectObject({ content: new PdfDictionary() }))

        // In-memory only fields
        this.fontData = options.fontData
        this.kernPairs = options.kernPairs ?? []
        this.charWidths = options.charWidths ?? new Map()
        this.glyphMetrics = options.glyphMetrics ?? new Map()
        this.glyphNameToCode = options.glyphNameToCode ?? new Map()
        this.underlinePosition = options.underlinePosition
        this.underlineThickness = options.underlineThickness
        this.weight = options.weight
        this.isBold = options.isBold
        this.unitsPerEm = options.unitsPerEm
        this.firstChar = options.firstChar
        this.lastChar = options.lastChar
        this.cidWidths = options.cidWidths
        this.defaultWidth = options.defaultWidth
        this.cidToGidMap = options.cidToGidMap

        // Populate PDF dictionary via setters
        const dict = this.content
        dict.set('Type', new PdfName('FontDescriptor'))
        if (options.fontName !== undefined) this.fontName = options.fontName
        if (options.familyName !== undefined)
            this.familyName = options.familyName
        this.fontWeight = options.fontWeight ?? 400
        this.isFixedPitch = options.isFixedPitch ?? false
        this.isItalic = options.isItalic ?? false
        // Flags is set by isFixedPitch/isItalic setters
        if (options.bbox !== undefined) this.bbox = options.bbox
        this.italicAngle = options.italicAngle ?? 0
        this.ascender = options.ascender ?? 0
        this.descender = options.descender ?? 0
        this.capHeight = options.capHeight ?? 0
        this.xHeight = options.xHeight ?? 0
        this.stdVW = options.stdVW ?? 0
        if (options.stdHW !== undefined) this.stdHW = options.stdHW
    }

    // --- Dict-backed getters/setters ---

    get fontName(): string | undefined {
        const entry = this.content.get('FontName')
        return entry instanceof PdfName ? entry.value : undefined
    }

    set fontName(value: string | undefined) {
        if (value !== undefined) {
            this.content.set('FontName', new PdfName(value))
        } else {
            this.content.delete('FontName')
        }
    }

    get familyName(): string | undefined {
        const entry = this.content.get('FontFamily')
        return entry instanceof PdfName ? entry.value : undefined
    }

    set familyName(value: string | undefined) {
        if (value !== undefined) {
            this.content.set('FontFamily', new PdfName(value))
        } else {
            this.content.delete('FontFamily')
        }
    }

    get fontWeight(): number {
        const entry = this.content.get('FontWeight')
        return entry instanceof PdfNumber ? entry.value : 400
    }

    set fontWeight(value: number) {
        this.content.set('FontWeight', new PdfNumber(value))
    }

    get italicAngle(): number {
        const entry = this.content.get('ItalicAngle')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    set italicAngle(value: number) {
        this.content.set('ItalicAngle', new PdfNumber(value))
    }

    get ascender(): number {
        const entry = this.content.get('Ascent')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    set ascender(value: number) {
        this.content.set('Ascent', new PdfNumber(value))
    }

    get descender(): number {
        const entry = this.content.get('Descent')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    set descender(value: number) {
        this.content.set('Descent', new PdfNumber(value))
    }

    get capHeight(): number {
        const entry = this.content.get('CapHeight')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    set capHeight(value: number) {
        this.content.set('CapHeight', new PdfNumber(value))
    }

    get xHeight(): number {
        const entry = this.content.get('XHeight')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    set xHeight(value: number) {
        this.content.set('XHeight', new PdfNumber(value))
    }

    get stdVW(): number {
        const entry = this.content.get('StemV')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    set stdVW(value: number) {
        this.content.set('StemV', new PdfNumber(value))
    }

    get stdHW(): number | undefined {
        const entry = this.content.get('StemH')
        return entry instanceof PdfNumber ? entry.value : undefined
    }

    set stdHW(value: number | undefined) {
        if (value !== undefined) {
            this.content.set('StemH', new PdfNumber(value))
        } else {
            this.content.delete('StemH')
        }
    }

    get bbox(): AfmBBox | undefined {
        const entry = this.content.get('FontBBox')
        if (entry instanceof PdfArray && entry.items.length === 4) {
            const items = entry.items as PdfNumber[]
            return {
                llx: items[0].value,
                lly: items[1].value,
                urx: items[2].value,
                ury: items[3].value,
            }
        }
        return undefined
    }

    set bbox(value: AfmBBox | undefined) {
        if (value !== undefined) {
            this.content.set(
                'FontBBox',
                new PdfArray([
                    new PdfNumber(value.llx),
                    new PdfNumber(value.lly),
                    new PdfNumber(value.urx),
                    new PdfNumber(value.ury),
                ]),
            )
        } else {
            this.content.delete('FontBBox')
        }
    }

    get isFixedPitch(): boolean {
        return (this.flags & (1 << 0)) !== 0
    }

    set isFixedPitch(value: boolean) {
        let flags = this.flags
        if (value) {
            flags |= 1 << 0
            flags &= ~(1 << 5) // Remove nonsymbolic
        } else {
            flags &= ~(1 << 0)
            flags |= 1 << 5 // Nonsymbolic
        }
        this.content.set('Flags', new PdfNumber(flags))
    }

    get isItalic(): boolean {
        return (this.flags & (1 << 6)) !== 0
    }

    set isItalic(value: boolean) {
        let flags = this.flags
        if (value) {
            flags |= 1 << 6
        } else {
            flags &= ~(1 << 6)
        }
        this.content.set('Flags', new PdfNumber(flags))
    }

    get flags(): number {
        const entry = this.content.get('Flags')
        return entry instanceof PdfNumber ? entry.value : 0
    }

    /**
     * Gets the embedded font file data from the FontFile2 stream.
     * Returns the in-memory fontData if no stream is attached yet.
     */
    get data(): ByteArray | undefined {
        const ref = this.content.get('FontFile2')
        if (ref instanceof PdfObjectReference) {
            const obj = ref.resolve()
            if (obj?.content instanceof PdfStream) {
                return obj.content.data
            }
        }
        return this.fontData
    }

    /**
     * Sets the embedded font file data.
     * Creates a new PdfStream with FlateDecode compression and stores
     * a reference in the FontFile2 entry.
     */
    set data(value: ByteArray | undefined) {
        this.fontData = value
        if (value) {
            const stream = new PdfStream({
                header: new PdfDictionary(),
                original: value,
            })
            stream.header.set('Length1', new PdfNumber(value.length))
            stream.addFilter('FlateDecode')

            const obj = new PdfIndirectObject({ content: stream })
            this.content.set('FontFile2', obj.reference)
        } else {
            this.content.delete('FontFile2')
        }
    }

    // --- Kern/glyph helpers ---

    private get kernMap(): Map<string, number> {
        if (!this._kernMap) {
            this._kernMap = new Map()
            for (const pair of this.kernPairs) {
                this._kernMap.set(`${pair.left},${pair.right}`, pair.dx)
            }
        }
        return this._kernMap
    }

    getKernAdjustment(left: string, right: string): number {
        return this.kernMap.get(`${left},${right}`) ?? 0
    }

    getCharWidth(charCode: number): number | undefined {
        return this.charWidths.get(charCode)
    }

    getGlyphMetrics(charCode: number): GlyphMetrics | undefined {
        return this.glyphMetrics.get(charCode)
    }

    getLigature(charCode: number, nextGlyphName: string): string | undefined {
        return this.glyphMetrics.get(charCode)?.ligatures?.[nextGlyphName]
    }

    static fromAfm(afm: AfmFont): PdfFontDescriptor {
        const charWidths = new Map<number, number>()
        const glyphMetrics = new Map<number, GlyphMetrics>()
        const glyphNameToCode = new Map<string, number>()

        for (const metric of afm.charMetrics) {
            if (metric.code >= 0) {
                charWidths.set(metric.code, metric.wx)
                glyphMetrics.set(metric.code, {
                    width: metric.wx,
                    name: metric.name,
                    bbox: metric.bbox,
                    ligatures: metric.ligatures,
                })
                glyphNameToCode.set(metric.name, metric.code)
            }
        }

        const meta = afm.metadata
        return new PdfFontDescriptor({
            kernPairs: afm.kernPairs,
            charWidths,
            glyphMetrics,
            glyphNameToCode,
            bbox: afm.bbox,
            ascender: meta.Ascender as number | undefined,
            descender: meta.Descender as number | undefined,
            capHeight: meta.CapHeight as number | undefined,
            xHeight: meta.XHeight as number | undefined,
            underlinePosition: meta.UnderlinePosition as number | undefined,
            underlineThickness: meta.UnderlineThickness as number | undefined,
            italicAngle: meta.ItalicAngle as number | undefined,
            stdHW: meta.StdHW as number | undefined,
            stdVW: meta.StdVW as number | undefined,
            fontName: meta.FontName as string | undefined,
            familyName: meta.FamilyName as string | undefined,
            weight: meta.Weight as string | undefined,
            isFixedPitch: meta.IsFixedPitch as boolean | undefined,
        })
    }

    static fromPdfFontDict(dict: PdfDictionary): PdfFontDescriptor {
        const baseFont = dict.get('BaseFont')
        const fontName =
            baseFont instanceof PdfName ? baseFont.value : undefined

        const fdRef = dict.get('FontDescriptor')
        const fdObj =
            fdRef instanceof PdfObjectReference ? fdRef.resolve() : null
        const fd = fdObj?.content as PdfDictionary | undefined

        let ascender: number | undefined
        let descender: number | undefined
        let capHeight: number | undefined
        let xHeight: number | undefined
        let italicAngle: number | undefined
        let stdVW: number | undefined
        let stdHW: number | undefined
        let familyName: string | undefined
        let fontWeight: number | undefined
        let isFixedPitch: boolean | undefined
        let isItalic: boolean | undefined
        let bbox: AfmBBox | undefined

        if (fd) {
            const getNum = (key: string) => {
                const v = fd.get(key)
                return v instanceof PdfNumber ? v.value : undefined
            }
            ascender = getNum('Ascent')
            descender = getNum('Descent')
            capHeight = getNum('CapHeight')
            xHeight = getNum('XHeight')
            italicAngle = getNum('ItalicAngle')
            stdVW = getNum('StemV')
            stdHW = getNum('StemH')
            fontWeight = getNum('FontWeight')
            const familyEntry = fd.get('FontFamily')
            familyName =
                familyEntry instanceof PdfName ? familyEntry.value : undefined

            const flags = getNum('Flags') ?? 0
            isFixedPitch = (flags & (1 << 0)) !== 0
            isItalic = (flags & (1 << 6)) !== 0

            const fontBBox = fd.get('FontBBox')
            if (fontBBox instanceof PdfArray && fontBBox.items.length === 4) {
                const items = fontBBox.items as PdfNumber[]
                bbox = {
                    llx: items[0].value,
                    lly: items[1].value,
                    urx: items[2].value,
                    ury: items[3].value,
                }
            }
        }

        const charWidths = new Map<number, number>()
        const firstCharObj = dict.get('FirstChar')
        const lastCharObj = dict.get('LastChar')
        const firstChar =
            firstCharObj instanceof PdfNumber ? firstCharObj.value : undefined
        const lastChar =
            lastCharObj instanceof PdfNumber ? lastCharObj.value : undefined

        const widthsEntry = dict.get('Widths')
        const widthsArr =
            widthsEntry instanceof PdfObjectReference
                ? (widthsEntry.resolve()?.content as PdfArray | undefined)
                : widthsEntry instanceof PdfArray
                  ? widthsEntry
                  : undefined

        if (widthsArr && firstChar !== undefined) {
            const items = widthsArr.items as PdfNumber[]
            for (let i = 0; i < items.length; i++) {
                if (items[i] instanceof PdfNumber) {
                    charWidths.set(firstChar + i, items[i].value)
                }
            }
        }

        let cidWidths: CIDWidth[] | undefined
        let defaultWidth: number | undefined
        const descFontsEntry = dict.get('DescendantFonts')
        // DescendantFonts may be an indirect reference to the array
        const descFontsArr: PdfArray | undefined =
            descFontsEntry instanceof PdfArray
                ? descFontsEntry
                : descFontsEntry instanceof PdfObjectReference
                  ? (descFontsEntry.resolve()?.content as PdfArray | undefined)
                  : undefined
        if (descFontsArr?.items?.length) {
            const cidFontRef = descFontsArr.items[0]
            const cidFont =
                cidFontRef instanceof PdfObjectReference
                    ? cidFontRef.resolve()
                    : null
            const cidFontDict = cidFont?.content as PdfDictionary | undefined
            if (cidFontDict) {
                const dwEntry = cidFontDict.get('DW')
                defaultWidth =
                    dwEntry instanceof PdfNumber ? dwEntry.value : undefined

                const wEntry = cidFontDict.get('W')
                const wArr: PdfArray | undefined =
                    wEntry instanceof PdfArray
                        ? wEntry
                        : wEntry instanceof PdfObjectReference
                          ? (wEntry.resolve()?.content as PdfArray | undefined)
                          : undefined
                if (wArr?.items) {
                    cidWidths = []
                    const items = wArr.items
                    let i = 0
                    while (i < items.length) {
                        const first = items[i]
                        if (!(first instanceof PdfNumber)) {
                            i++
                            continue
                        }
                        const startCid = first.value
                        const next = items[i + 1]
                        if (next instanceof PdfArray) {
                            const widths = (next.items as PdfNumber[]).map(
                                (n) => n.value,
                            )
                            cidWidths.push({ startCid, widths })
                            for (let j = 0; j < widths.length; j++) {
                                charWidths.set(startCid + j, widths[j])
                            }
                            i += 2
                        } else if (
                            next instanceof PdfNumber &&
                            items[i + 2] instanceof PdfNumber
                        ) {
                            const endCid = next.value
                            const width = (items[i + 2] as PdfNumber).value
                            for (let cid = startCid; cid <= endCid; cid++) {
                                charWidths.set(cid, width)
                            }
                            cidWidths.push({ cid: startCid, width })
                            i += 3
                        } else {
                            i++
                        }
                    }
                }
            }
        }

        return new PdfFontDescriptor({
            fontName,
            familyName,
            fontWeight,
            ascender,
            descender,
            capHeight,
            xHeight,
            italicAngle,
            stdVW,
            stdHW,
            isFixedPitch,
            isItalic,
            bbox,
            charWidths,
            firstChar,
            lastChar,
            cidWidths,
            defaultWidth,
        })
    }
}
