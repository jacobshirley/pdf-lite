import { ByteArray } from '../../types.js'
import { FontDescriptor, TtfFontInfo, FontParser } from '../types.js'

/**
 * Parses OpenType font files (.otf) to extract metrics and glyph widths.
 * Supports both CFF-based and TrueType-based OpenType fonts.
 *
 * Note: OTF files share the same table structure as TTF for metrics,
 * the main difference is the glyph outline format (CFF vs TrueType).
 */
export class OtfParser implements FontParser {
    private data: DataView
    private tables: Map<string, { offset: number; length: number }> = new Map()
    private isCFF: boolean = false

    constructor(fontData: ByteArray) {
        this.data = new DataView(
            fontData.buffer,
            fontData.byteOffset,
            fontData.byteLength,
        )
        this.parseTables()
    }

    private parseTables(): void {
        const sfntVersion = this.data.getUint32(0)

        // Check if CFF-based OpenType (has 'OTTO' signature)
        // 0x4F54544F = 'OTTO'
        this.isCFF = sfntVersion === 0x4f54544f

        const numTables = this.data.getUint16(4)
        for (let i = 0; i < numTables; i++) {
            const offset = 12 + i * 16
            const tag = this.readTag(offset)
            const tableOffset = this.data.getUint32(offset + 8)
            const tableLength = this.data.getUint32(offset + 12)
            this.tables.set(tag, { offset: tableOffset, length: tableLength })
        }
    }

    private readTag(offset: number): string {
        return String.fromCharCode(
            this.data.getUint8(offset),
            this.data.getUint8(offset + 1),
            this.data.getUint8(offset + 2),
            this.data.getUint8(offset + 3),
        )
    }

    private getTable(
        tag: string,
    ): { offset: number; length: number } | undefined {
        return this.tables.get(tag)
    }

    /**
     * Returns true if this is a CFF-based OpenType font.
     */
    isCFFBased(): boolean {
        return this.isCFF
    }

    /**
     * Parses the font and returns basic font information.
     */
    getFontInfo(): TtfFontInfo {
        const head = this.parseHead()
        const hhea = this.parseHhea()
        const os2 = this.parseOS2()
        const post = this.parsePost()
        const name = this.parseName()

        return {
            fontFamily: name.fontFamily,
            fontSubfamily: name.fontSubfamily,
            fullName: name.fullName,
            postScriptName: name.postScriptName,
            unitsPerEm: head.unitsPerEm,
            ascent: os2?.sTypoAscender ?? hhea.ascent,
            descent: os2?.sTypoDescender ?? hhea.descent,
            lineGap: os2?.sTypoLineGap ?? hhea.lineGap,
            capHeight: os2?.sCapHeight ?? Math.round(head.unitsPerEm * 0.7),
            xHeight: os2?.sxHeight ?? Math.round(head.unitsPerEm * 0.5),
            stemV: this.estimateStemV(os2?.usWeightClass ?? 400),
            bbox: [head.xMin, head.yMin, head.xMax, head.yMax],
            isItalic: (head.macStyle & 0x02) !== 0,
            isBold: (head.macStyle & 0x01) !== 0,
            isFixedPitch: post.isFixedPitch,
        }
    }

    /**
     * Creates a FontDescriptor suitable for embedding.
     * Scales metrics to PDF's 1000-unit em square.
     */
    getFontDescriptor(fontName?: string): FontDescriptor {
        const info = this.getFontInfo()
        const scale = 1000 / info.unitsPerEm

        let flags = 0
        if (info.isFixedPitch) flags |= 1 << 0
        if (!info.isFixedPitch) flags |= 1 << 5
        if (info.isItalic) flags |= 1 << 6

        const widths = this.getCharWidths(32, 126)

        return {
            fontName: fontName ?? info.postScriptName,
            fontFamily: info.fontFamily,
            fontWeight: info.isBold ? 700 : 400,
            flags,
            fontBBox: [
                Math.round(info.bbox[0] * scale),
                Math.round(info.bbox[1] * scale),
                Math.round(info.bbox[2] * scale),
                Math.round(info.bbox[3] * scale),
            ],
            italicAngle: info.isItalic ? -12 : 0,
            ascent: Math.round(info.ascent * scale),
            descent: Math.round(info.descent * scale),
            capHeight: Math.round(info.capHeight * scale),
            stemV: Math.round(info.stemV * scale),
            firstChar: 32,
            lastChar: 126,
            widths,
        }
    }

    /**
     * Gets character widths for a range of characters.
     */
    getCharWidths(firstChar: number, lastChar: number): number[] {
        const info = this.getFontInfo()
        const scale = 1000 / info.unitsPerEm
        const cmap = this.parseCmap()
        const hmtx = this.parseHmtx()

        const widths: number[] = []
        for (let charCode = firstChar; charCode <= lastChar; charCode++) {
            const glyphId = cmap.get(charCode) ?? 0
            const width = hmtx.get(glyphId) ?? 0
            widths.push(Math.round(width * scale))
        }

        return widths
    }

    private parseHead(): {
        unitsPerEm: number
        xMin: number
        yMin: number
        xMax: number
        yMax: number
        macStyle: number
    } {
        const table = this.getTable('head')
        if (!table) throw new Error('Missing head table')

        const offset = table.offset
        return {
            unitsPerEm: this.data.getUint16(offset + 18),
            xMin: this.data.getInt16(offset + 36),
            yMin: this.data.getInt16(offset + 38),
            xMax: this.data.getInt16(offset + 40),
            yMax: this.data.getInt16(offset + 42),
            macStyle: this.data.getUint16(offset + 44),
        }
    }

    private parseHhea(): {
        ascent: number
        descent: number
        lineGap: number
        numberOfHMetrics: number
    } {
        const table = this.getTable('hhea')
        if (!table) throw new Error('Missing hhea table')

        const offset = table.offset
        return {
            ascent: this.data.getInt16(offset + 4),
            descent: this.data.getInt16(offset + 6),
            lineGap: this.data.getInt16(offset + 8),
            numberOfHMetrics: this.data.getUint16(offset + 34),
        }
    }

    private parseOS2():
        | {
              usWeightClass: number
              sTypoAscender: number
              sTypoDescender: number
              sTypoLineGap: number
              sCapHeight: number
              sxHeight: number
          }
        | undefined {
        const table = this.getTable('OS/2')
        if (!table) return undefined

        const offset = table.offset
        const version = this.data.getUint16(offset)

        const result = {
            usWeightClass: this.data.getUint16(offset + 4),
            sTypoAscender: this.data.getInt16(offset + 68),
            sTypoDescender: this.data.getInt16(offset + 70),
            sTypoLineGap: this.data.getInt16(offset + 72),
            sCapHeight: 0,
            sxHeight: 0,
        }

        if (version >= 2 && table.length >= 96) {
            result.sxHeight = this.data.getInt16(offset + 86)
            result.sCapHeight = this.data.getInt16(offset + 88)
        }

        return result
    }

    private parsePost(): { isFixedPitch: boolean } {
        const table = this.getTable('post')
        if (!table) return { isFixedPitch: false }

        const offset = table.offset
        return {
            isFixedPitch: this.data.getUint32(offset + 12) !== 0,
        }
    }

    private parseName(): {
        fontFamily: string
        fontSubfamily: string
        fullName: string
        postScriptName: string
    } {
        const table = this.getTable('name')
        if (!table) {
            return {
                fontFamily: 'Unknown',
                fontSubfamily: 'Regular',
                fullName: 'Unknown',
                postScriptName: 'Unknown',
            }
        }

        const offset = table.offset
        const count = this.data.getUint16(offset + 2)
        const stringOffset = this.data.getUint16(offset + 4)

        const names: { [key: number]: string } = {}

        for (let i = 0; i < count; i++) {
            const recordOffset = offset + 6 + i * 12
            const platformId = this.data.getUint16(recordOffset)
            const encodingId = this.data.getUint16(recordOffset + 2)
            const nameId = this.data.getUint16(recordOffset + 6)
            const length = this.data.getUint16(recordOffset + 8)
            const strOffset = this.data.getUint16(recordOffset + 10)

            if (
                (platformId === 3 && encodingId === 1) ||
                (platformId === 1 && !names[nameId])
            ) {
                const strStart = offset + stringOffset + strOffset
                let str = ''

                if (platformId === 3) {
                    for (let j = 0; j < length; j += 2) {
                        str += String.fromCharCode(
                            this.data.getUint16(strStart + j),
                        )
                    }
                } else {
                    for (let j = 0; j < length; j++) {
                        str += String.fromCharCode(
                            this.data.getUint8(strStart + j),
                        )
                    }
                }

                names[nameId] = str
            }
        }

        return {
            fontFamily: names[1] ?? 'Unknown',
            fontSubfamily: names[2] ?? 'Regular',
            fullName: names[4] ?? names[1] ?? 'Unknown',
            postScriptName: names[6] ?? names[4] ?? 'Unknown',
        }
    }

    private parseCmap(): Map<number, number> {
        const table = this.getTable('cmap')
        if (!table) return new Map()

        const offset = table.offset
        const numTables = this.data.getUint16(offset + 2)

        let subtableOffset = 0
        for (let i = 0; i < numTables; i++) {
            const recordOffset = offset + 4 + i * 8
            const platformId = this.data.getUint16(recordOffset)
            const encodingId = this.data.getUint16(recordOffset + 2)
            const tableOffset = this.data.getUint32(recordOffset + 4)

            if ((platformId === 3 && encodingId === 1) || platformId === 0) {
                subtableOffset = offset + tableOffset
                break
            }
        }

        if (!subtableOffset) return new Map()

        const format = this.data.getUint16(subtableOffset)

        if (format === 4) {
            return this.parseCmapFormat4(subtableOffset)
        } else if (format === 12) {
            return this.parseCmapFormat12(subtableOffset)
        }

        return new Map()
    }

    private parseCmapFormat4(offset: number): Map<number, number> {
        const segCount = this.data.getUint16(offset + 6) / 2
        const endCodesOffset = offset + 14
        const startCodesOffset = endCodesOffset + segCount * 2 + 2
        const idDeltaOffset = startCodesOffset + segCount * 2
        const idRangeOffset = idDeltaOffset + segCount * 2

        const charMap = new Map<number, number>()

        for (let i = 0; i < segCount; i++) {
            const endCode = this.data.getUint16(endCodesOffset + i * 2)
            const startCode = this.data.getUint16(startCodesOffset + i * 2)
            const idDelta = this.data.getInt16(idDeltaOffset + i * 2)
            const idRangeOffsetValue = this.data.getUint16(
                idRangeOffset + i * 2,
            )

            if (endCode === 0xffff) break

            for (let charCode = startCode; charCode <= endCode; charCode++) {
                let glyphId: number

                if (idRangeOffsetValue === 0) {
                    glyphId = (charCode + idDelta) & 0xffff
                } else {
                    const glyphIdOffset =
                        idRangeOffset +
                        i * 2 +
                        idRangeOffsetValue +
                        (charCode - startCode) * 2
                    glyphId = this.data.getUint16(glyphIdOffset)
                    if (glyphId !== 0) {
                        glyphId = (glyphId + idDelta) & 0xffff
                    }
                }

                charMap.set(charCode, glyphId)
            }
        }

        return charMap
    }

    private parseCmapFormat12(offset: number): Map<number, number> {
        const numGroups = this.data.getUint32(offset + 12)
        const charMap = new Map<number, number>()

        for (let i = 0; i < numGroups; i++) {
            const groupOffset = offset + 16 + i * 12
            const startCharCode = this.data.getUint32(groupOffset)
            const endCharCode = this.data.getUint32(groupOffset + 4)
            const startGlyphId = this.data.getUint32(groupOffset + 8)

            for (
                let charCode = startCharCode;
                charCode <= endCharCode;
                charCode++
            ) {
                charMap.set(charCode, startGlyphId + (charCode - startCharCode))
            }
        }

        return charMap
    }

    private parseHmtx(): Map<number, number> {
        const table = this.getTable('hmtx')
        const hhea = this.parseHhea()
        const maxp = this.parseMaxp()

        if (!table) return new Map()

        const offset = table.offset
        const numHMetrics = hhea.numberOfHMetrics
        const numGlyphs = maxp.numGlyphs

        const widths = new Map<number, number>()

        for (let i = 0; i < numHMetrics; i++) {
            const advanceWidth = this.data.getUint16(offset + i * 4)
            widths.set(i, advanceWidth)
        }

        if (numHMetrics > 0) {
            const lastWidth = this.data.getUint16(
                offset + (numHMetrics - 1) * 4,
            )
            for (let i = numHMetrics; i < numGlyphs; i++) {
                widths.set(i, lastWidth)
            }
        }

        return widths
    }

    private parseMaxp(): { numGlyphs: number } {
        const table = this.getTable('maxp')
        if (!table) return { numGlyphs: 0 }

        return {
            numGlyphs: this.data.getUint16(table.offset + 4),
        }
    }

    private estimateStemV(weightClass: number): number {
        if (weightClass <= 100) return 25
        if (weightClass <= 200) return 35
        if (weightClass <= 300) return 50
        if (weightClass <= 400) return 70
        if (weightClass <= 500) return 88
        if (weightClass <= 600) return 110
        if (weightClass <= 700) return 135
        if (weightClass <= 800) return 165
        return 200
    }
}
