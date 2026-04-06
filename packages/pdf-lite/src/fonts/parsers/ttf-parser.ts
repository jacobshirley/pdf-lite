import { ByteArray } from '../../types.js'
import { TtfFontInfo, FontParser, AfmKernPair } from '../types.js'
import { PdfFontDescriptor, GlyphMetrics } from '../pdf-font-descriptor.js'

/**
 * Parses TrueType font files (.ttf) to extract metrics and glyph widths.
 */
export class TtfParser implements FontParser {
    private data: DataView
    private tables: Map<string, { offset: number; length: number }> = new Map()

    constructor(fontData: ByteArray) {
        this.data = new DataView(
            fontData.buffer,
            fontData.byteOffset,
            fontData.byteLength,
        )
        this.parseTables()
    }

    /**
     * Returns the original font bytes.
     */
    getFontData(): ByteArray {
        return new Uint8Array(
            this.data.buffer,
            this.data.byteOffset,
            this.data.byteLength,
        ) as ByteArray
    }

    private parseTables(): void {
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
     * Creates PdfFontDescriptor suitable for embedding.
     * Scales metrics to PDF's 1000-unit em square.
     */
    getPdfFontDescriptor(fontName?: string): PdfFontDescriptor {
        const info = this.getFontInfo()
        const scale = 1000 / info.unitsPerEm
        const os2 = this.parseOS2()
        const postData = this.parsePostFull()
        const cmap = this.parseCmap()
        const hmtx = this.parseHmtx()
        const glyphNames = this.parseGlyphNames()

        // Build char widths (scaled)
        const charWidths = new Map<number, number>()
        for (let charCode = 32; charCode <= 126; charCode++) {
            const glyphId = cmap.get(charCode) ?? 0
            const width = hmtx.get(glyphId) ?? 0
            charWidths.set(charCode, Math.round(width * scale))
        }

        // Build per-glyph metrics and name→code map
        const glyphMetrics = new Map<number, GlyphMetrics>()
        const glyphNameToCode = new Map<string, number>()
        for (const [charCode, glyphId] of cmap) {
            const width = hmtx.get(glyphId) ?? 0
            const name = glyphNames.get(glyphId) ?? `.gid${glyphId}`
            glyphMetrics.set(charCode, {
                width: Math.round(width * scale),
                name,
                bbox: { llx: 0, lly: 0, urx: 0, ury: 0 },
            })
            glyphNameToCode.set(name, charCode)
        }

        // Parse kern pairs
        const kernPairs = this.parseKern(glyphNames, cmap, scale)

        return new PdfFontDescriptor({
            fontName: fontName ?? info.postScriptName,
            familyName: info.fontFamily,
            fontWeight: os2?.usWeightClass ?? (info.isBold ? 700 : 400),
            weight: weightClassToString(os2?.usWeightClass ?? 400),
            isBold: info.isBold,
            isItalic: info.isItalic,
            isFixedPitch: info.isFixedPitch,
            italicAngle: info.isItalic ? -12 : 0,
            ascender: Math.round(info.ascent * scale),
            descender: Math.round(info.descent * scale),
            capHeight: Math.round(info.capHeight * scale),
            xHeight: Math.round(info.xHeight * scale),
            stdVW: Math.round(info.stemV * scale),
            unitsPerEm: info.unitsPerEm,
            bbox: {
                llx: Math.round(info.bbox[0] * scale),
                lly: Math.round(info.bbox[1] * scale),
                urx: Math.round(info.bbox[2] * scale),
                ury: Math.round(info.bbox[3] * scale),
            },
            underlinePosition:
                postData.underlinePosition !== undefined
                    ? Math.round(postData.underlinePosition * scale)
                    : undefined,
            underlineThickness:
                postData.underlineThickness !== undefined
                    ? Math.round(postData.underlineThickness * scale)
                    : undefined,
            firstChar: 32,
            lastChar: 126,
            charWidths,
            glyphMetrics,
            glyphNameToCode,
            kernPairs,
            fontData: this.getFontData(),
        })
    }

    /**
     * Gets character widths for a range of characters.
     * Widths are scaled to PDF's 1000-unit em square.
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

        // sCapHeight and sxHeight are only in version 2+
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

    private parsePostFull(): {
        isFixedPitch: boolean
        underlinePosition?: number
        underlineThickness?: number
    } {
        const table = this.getTable('post')
        if (!table) return { isFixedPitch: false }

        const offset = table.offset
        return {
            isFixedPitch: this.data.getUint32(offset + 12) !== 0,
            underlinePosition: this.data.getInt16(offset + 8),
            underlineThickness: this.data.getInt16(offset + 10),
        }
    }

    /**
     * Parses the 'post' table to extract glyph names.
     * Supports format 2.0 (explicit names) and format 1.0 (standard Mac names).
     */
    parseGlyphNames(): Map<number, string> {
        const table = this.getTable('post')
        if (!table) return new Map()

        const offset = table.offset
        const format = this.data.getUint32(offset) // Fixed 16.16
        const names = new Map<number, string>()

        if (format === 0x00020000) {
            // Format 2.0
            const numGlyphs = this.data.getUint16(offset + 32)
            const glyphNameIndices: number[] = []
            for (let i = 0; i < numGlyphs; i++) {
                glyphNameIndices.push(this.data.getUint16(offset + 34 + i * 2))
            }

            // Read custom name strings
            let strOffset = offset + 34 + numGlyphs * 2
            const customNames: string[] = []
            while (strOffset < offset + table.length) {
                const len = this.data.getUint8(strOffset)
                strOffset++
                let name = ''
                for (let j = 0; j < len; j++) {
                    name += String.fromCharCode(
                        this.data.getUint8(strOffset + j),
                    )
                }
                customNames.push(name)
                strOffset += len
            }

            for (let i = 0; i < numGlyphs; i++) {
                const idx = glyphNameIndices[i]
                if (idx < 258) {
                    names.set(i, STANDARD_MAC_GLYPH_NAMES[idx] ?? `.gid${i}`)
                } else {
                    const customIdx = idx - 258
                    names.set(i, customNames[customIdx] ?? `.gid${i}`)
                }
            }
        } else if (format === 0x00010000) {
            // Format 1.0 — standard Macintosh ordering
            for (
                let i = 0;
                i < 258 && i < STANDARD_MAC_GLYPH_NAMES.length;
                i++
            ) {
                names.set(i, STANDARD_MAC_GLYPH_NAMES[i])
            }
        }

        return names
    }

    /**
     * Parses the 'kern' table to extract kerning pairs.
     * Returns pairs using glyph names (for AfmKernPair compatibility).
     */
    parseKern(
        glyphNames?: Map<number, string>,
        cmap?: Map<number, number>,
        scale?: number,
    ): AfmKernPair[] {
        const table = this.getTable('kern')
        if (!table) return []

        const offset = table.offset
        const version = this.data.getUint16(offset)

        if (version !== 0) return [] // Only support version 0

        const nTables = this.data.getUint16(offset + 2)
        const pairs: AfmKernPair[] = []

        const names = glyphNames ?? this.parseGlyphNames()
        const s = scale ?? 1000 / (this.getFontInfo().unitsPerEm || 1000)

        // Build reverse cmap: glyphId → charCode (for fallback naming)
        const glyphIdToChar = new Map<number, number>()
        const cm = cmap ?? this.parseCmap()
        for (const [charCode, glyphId] of cm) {
            if (!glyphIdToChar.has(glyphId)) {
                glyphIdToChar.set(glyphId, charCode)
            }
        }

        let subtableOffset = offset + 4
        for (let t = 0; t < nTables; t++) {
            const subtableLength = this.data.getUint16(subtableOffset + 2)
            const coverage = this.data.getUint16(subtableOffset + 4)
            const format = coverage >> 8

            if (format === 0) {
                // Format 0: ordered list of kerning pairs
                const nPairs = this.data.getUint16(subtableOffset + 6)
                const pairOffset = subtableOffset + 14

                for (let i = 0; i < nPairs; i++) {
                    const entryOffset = pairOffset + i * 6
                    const leftGlyph = this.data.getUint16(entryOffset)
                    const rightGlyph = this.data.getUint16(entryOffset + 2)
                    const value = this.data.getInt16(entryOffset + 4)

                    const leftName = names.get(leftGlyph)
                    const rightName = names.get(rightGlyph)

                    if (leftName && rightName && value !== 0) {
                        pairs.push({
                            left: leftName,
                            right: rightName,
                            dx: Math.round(value * s),
                        })
                    }
                }
            }

            subtableOffset += subtableLength
        }

        return pairs
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

            // Prefer Windows Unicode (platformId 3, encodingId 1) or Mac Roman (platformId 1)
            if (
                (platformId === 3 && encodingId === 1) ||
                (platformId === 1 && !names[nameId])
            ) {
                const strStart = offset + stringOffset + strOffset
                let str = ''

                if (platformId === 3) {
                    // UTF-16BE
                    for (let j = 0; j < length; j += 2) {
                        str += String.fromCharCode(
                            this.data.getUint16(strStart + j),
                        )
                    }
                } else {
                    // Mac Roman (approximate as ASCII)
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

    parseCmap(): Map<number, number> {
        const table = this.getTable('cmap')
        if (!table) return new Map()

        const offset = table.offset
        const numTables = this.data.getUint16(offset + 2)

        // Find a suitable subtable (prefer format 4 for BMP characters)
        let subtableOffset = 0
        for (let i = 0; i < numTables; i++) {
            const recordOffset = offset + 4 + i * 8
            const platformId = this.data.getUint16(recordOffset)
            const encodingId = this.data.getUint16(recordOffset + 2)
            const tableOffset = this.data.getUint32(recordOffset + 4)

            // Windows Unicode BMP or Mac Roman
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

    parseHmtx(): Map<number, number> {
        const table = this.getTable('hmtx')
        const hhea = this.parseHhea()
        const maxp = this.parseMaxp()

        if (!table) return new Map()

        const offset = table.offset
        const numHMetrics = hhea.numberOfHMetrics
        const numGlyphs = maxp.numGlyphs

        const widths = new Map<number, number>()

        // Full metrics entries
        for (let i = 0; i < numHMetrics; i++) {
            const advanceWidth = this.data.getUint16(offset + i * 4)
            widths.set(i, advanceWidth)
        }

        // Remaining glyphs use the last advance width
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
        return estimateStemVFromWeight(weightClass)
    }
}

export function estimateStemVFromWeight(weightClass: number): number {
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

export function weightClassToString(weightClass: number): string {
    if (weightClass <= 100) return 'Thin'
    if (weightClass <= 200) return 'ExtraLight'
    if (weightClass <= 300) return 'Light'
    if (weightClass <= 400) return 'Regular'
    if (weightClass <= 500) return 'Medium'
    if (weightClass <= 600) return 'SemiBold'
    if (weightClass <= 700) return 'Bold'
    if (weightClass <= 800) return 'ExtraBold'
    return 'Black'
}

/**
 * Standard Macintosh glyph names (post table format 1.0 / format 2.0 indices < 258).
 */
export const STANDARD_MAC_GLYPH_NAMES = [
    '.notdef',
    '.null',
    'nonmarkingreturn',
    'space',
    'exclam',
    'quotedbl',
    'numbersign',
    'dollar',
    'percent',
    'ampersand',
    'quotesingle',
    'parenleft',
    'parenright',
    'asterisk',
    'plus',
    'comma',
    'hyphen',
    'period',
    'slash',
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'colon',
    'semicolon',
    'less',
    'equal',
    'greater',
    'question',
    'at',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'bracketleft',
    'backslash',
    'bracketright',
    'asciicircum',
    'underscore',
    'grave',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    'braceleft',
    'bar',
    'braceright',
    'asciitilde',
    'Adieresis',
    'Aring',
    'Ccedilla',
    'Eacute',
    'Ntilde',
    'Odieresis',
    'Udieresis',
    'aacute',
    'agrave',
    'acircumflex',
    'adieresis',
    'atilde',
    'aring',
    'ccedilla',
    'eacute',
    'egrave',
    'ecircumflex',
    'edieresis',
    'iacute',
    'igrave',
    'icircumflex',
    'idieresis',
    'ntilde',
    'oacute',
    'ograve',
    'ocircumflex',
    'odieresis',
    'otilde',
    'uacute',
    'ugrave',
    'ucircumflex',
    'udieresis',
    'dagger',
    'degree',
    'cent',
    'sterling',
    'section',
    'bullet',
    'paragraph',
    'germandbls',
    'registered',
    'copyright',
    'trademark',
    'acute',
    'dieresis',
    'notequal',
    'AE',
    'Oslash',
    'infinity',
    'plusminus',
    'lessequal',
    'greaterequal',
    'yen',
    'mu',
    'partialdiff',
    'summation',
    'product',
    'pi',
    'integral',
    'ordfeminine',
    'ordmasculine',
    'Omega',
    'ae',
    'oslash',
    'questiondown',
    'exclamdown',
    'logicalnot',
    'radical',
    'florin',
    'approxequal',
    'Delta',
    'guillemotleft',
    'guillemotright',
    'ellipsis',
    'nonbreakingspace',
    'Agrave',
    'Atilde',
    'Otilde',
    'OE',
    'oe',
    'endash',
    'emdash',
    'quotedblleft',
    'quotedblright',
    'quoteleft',
    'quoteright',
    'divide',
    'lozenge',
    'ydieresis',
    'Ydieresis',
    'fraction',
    'currency',
    'guilsinglleft',
    'guilsinglright',
    'fi',
    'fl',
    'daggerdbl',
    'periodcentered',
    'quotesinglbase',
    'quotedblbase',
    'perthousand',
    'Acircumflex',
    'Ecircumflex',
    'Aacute',
    'Edieresis',
    'Egrave',
    'Iacute',
    'Icircumflex',
    'Idieresis',
    'Igrave',
    'Oacute',
    'Ocircumflex',
    'apple',
    'Ograve',
    'Uacute',
    'Ucircumflex',
    'Ugrave',
    'dotlessi',
    'circumflex',
    'tilde',
    'macron',
    'breve',
    'dotaccent',
    'ring',
    'cedilla',
    'hungarumlaut',
    'ogonek',
    'caron',
    'Lslash',
    'lslash',
    'Scaron',
    'scaron',
    'Zcaron',
    'zcaron',
    'brokenbar',
    'Eth',
    'eth',
    'Yacute',
    'yacute',
    'Thorn',
    'thorn',
    'minus',
    'multiply',
    'onesuperior',
    'twosuperior',
    'threesuperior',
    'onehalf',
    'onequarter',
    'threequarters',
    'franc',
    'Gbreve',
    'gbreve',
    'Idotaccent',
    'Scedilla',
    'scedilla',
    'Cacute',
    'cacute',
    'Ccaron',
    'ccaron',
    'dcroat',
]
