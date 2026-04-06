import { describe, it, expect } from 'vitest'
import { server } from 'vitest/browser'
import { PdfDocument } from '../../src/pdf/pdf-document'
import { CIDWidth } from '../../src/fonts/index'
import { TtfParser } from '../../src/fonts/parsers/ttf-parser'
import { OtfParser } from '../../src/fonts/parsers/otf-parser'
import {
    WoffParser,
    detectFontFormat,
} from '../../src/fonts/parsers/woff-parser'
import {
    parseFont,
    isSupportedFontFormat,
} from '../../src/fonts/parsers/font-parser'
import { ByteArray } from '../../src/types'
import { PdfFont } from '../../src/fonts/pdf-font'
import { PdfFontDescriptor } from '../../src/fonts/pdf-font-descriptor'
import type { AfmKernPair } from '../../src/fonts/types'
import { PdfDictionary, PdfHexadecimal, PdfNumber, PdfString } from '../../src'
import { PdfArray } from '../../src/core/objects/pdf-array'
import { PdfName } from '../../src/core/objects/pdf-name'

// Helper to load font fixtures
const base64ToBytes = (base64: string): ByteArray => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

async function loadFont(path: string): Promise<ByteArray> {
    const base64 = await server.commands.readFile(path, { encoding: 'base64' })
    return base64ToBytes(base64)
}

// Font fixture paths
const TTF_FIXTURE = './test/unit/fixtures/fonts/Roboto-Regular.ttf'
const OTF_FIXTURE = './test/unit/fixtures/fonts/SourceSans3-Regular.otf'
const WOFF_FIXTURE = './test/unit/fixtures/fonts/Roboto-Regular.woff'

describe('Font Embedding', () => {
    describe('Standard Fonts', () => {
        it('should embed Helvetica standard font', () => {
            const document = new PdfDocument()

            const font = PdfFont.fromStandardFont('Helvetica')
            font.resourceName = 'F1'
            document.add(font)

            expect(font.resourceName).toBe('F1')
            expect(font.fontName).toBe('Helvetica')
            expect(font.toString()).toBe(font.resourceName)
        })

        it('should create multiple standard fonts with unique resource names', () => {
            const document = new PdfDocument()

            const helvetica = PdfFont.fromStandardFont('Helvetica')
            helvetica.resourceName = 'F1'
            const helveticaBold = PdfFont.fromStandardFont('Helvetica-Bold')
            helveticaBold.resourceName = 'F2'
            const times = PdfFont.fromStandardFont('Times-Roman')
            times.resourceName = 'F3'

            document.add(helvetica, helveticaBold, times)

            // Should have unique resource names
            expect(helvetica.resourceName).not.toBe(helveticaBold.resourceName)
            expect(helvetica.resourceName).not.toBe(times.resourceName)
            expect(helveticaBold.resourceName).not.toBe(times.resourceName)
        })

        it('should embed all 14 standard PDF fonts', () => {
            const standardFonts = [
                'Helvetica',
                'Helvetica-Bold',
                'Helvetica-Oblique',
                'Helvetica-BoldOblique',
                'Times-Roman',
                'Times-Bold',
                'Times-Italic',
                'Times-BoldItalic',
                'Courier',
                'Courier-Bold',
                'Courier-Oblique',
                'Courier-BoldOblique',
                'Symbol',
                'ZapfDingbats',
            ] as const

            const fonts = standardFonts.map((name) =>
                PdfFont.fromStandardFont(name),
            )

            expect(fonts.length).toBe(14)
        })
    })

    describe('TrueType Fonts', () => {
        it('should create a TrueType font with descriptor', () => {
            // Create mock font data (minimal valid TrueType header)
            const mockFontData = new Uint8Array([
                0x00,
                0x01,
                0x00,
                0x00, // version 1.0
                0x00,
                0x00, // numTables
                0x00,
                0x00, // searchRange
                0x00,
                0x00, // entrySelector
                0x00,
                0x00, // rangeShift
            ])

            const metrics = new PdfFontDescriptor({
                fontName: 'CustomFont',
                familyName: 'Custom',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                fontData: mockFontData,
            })

            const font = PdfFont.fromTrueTypeData(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
            expect(font.fontName).toBe('CustomFont')
            expect(font.encoding).toBe('WinAnsiEncoding')
        })
    })

    describe('Font Serialization', () => {
        it('should serialize document with embedded fonts', async () => {
            const document = new PdfDocument()

            const helvetica = PdfFont.fromStandardFont('Helvetica')
            helvetica.resourceName = 'F1'
            const times = PdfFont.fromStandardFont('Times-Roman')
            times.resourceName = 'F2'

            document.add(helvetica, times)

            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0)

            // Verify the document can be parsed back
            const reparsed = await PdfDocument.fromBytes([bytes])
            expect(reparsed).toBeDefined()
        })
    })

    describe('TrueType Font Width Arrays', () => {
        it('should create TrueType font with default widths', () => {
            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const metrics = new PdfFontDescriptor({
                fontName: 'TestFont',
                familyName: 'Test',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                fontData: mockFontData,
            })

            const font = PdfFont.fromTrueTypeData(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
        })

        it('should create TrueType font with custom widths', () => {
            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const charWidths = new Map([
                [32, 250],
                [33, 333],
                [34, 408],
                [35, 500],
                [36, 500],
            ])
            const metrics = new PdfFontDescriptor({
                fontName: 'CustomWidthFont',
                familyName: 'Custom',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                firstChar: 32,
                lastChar: 36,
                charWidths,
                fontData: mockFontData,
            })

            const font = PdfFont.fromTrueTypeData(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
        })

        it('should create TrueType font with custom firstChar/lastChar range', () => {
            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const metrics = new PdfFontDescriptor({
                fontName: 'RangeFont',
                familyName: 'Range',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                firstChar: 65, // 'A'
                lastChar: 90, // 'Z'
                fontData: mockFontData,
            })

            const font = PdfFont.fromTrueTypeData(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
        })
    })

    describe('Unicode/Type0 Fonts', () => {
        it('should create a Unicode TrueType font', () => {
            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const metrics = new PdfFontDescriptor({
                fontName: 'UnicodeFont',
                familyName: 'Unicode',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                defaultWidth: 1000,
                fontData: mockFontData,
            })

            const font = PdfFont.fromType0Data(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
            expect(font.encoding).toBe('Identity-H')
        })

        it('should create Unicode font with CID widths', () => {
            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const cidWidths: CIDWidth[] = [
                { cid: 1, width: 500 },
                { startCid: 10, widths: [600, 700, 800] },
            ]

            const metrics = new PdfFontDescriptor({
                fontName: 'CIDWidthFont',
                familyName: 'CID',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                defaultWidth: 1000,
                cidWidths,
                fontData: mockFontData,
            })

            const font = PdfFont.fromType0Data(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
        })

        it('should create Unicode font with ToUnicode CMap', () => {
            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const metrics = new PdfFontDescriptor({
                fontName: 'CMapFont',
                familyName: 'CMap',
                fontWeight: 400,
                bbox: { llx: -200, lly: -200, urx: 1000, ury: 900 },
                italicAngle: 0,
                ascender: 900,
                descender: -200,
                capHeight: 700,
                stdVW: 80,
                fontData: mockFontData,
            })

            // Unicode mappings: CID -> Unicode code point
            const unicodeMappings = new Map<number, number>([
                [1, 0x0041], // CID 1 -> 'A'
                [2, 0x0042], // CID 2 -> 'B'
                [3, 0x0043], // CID 3 -> 'C'
                [100, 0x4e2d], // CID 100 -> '中'
            ])

            const font = PdfFont.fromType0Data(metrics, unicodeMappings)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
        })

        it('should generate CIDToGIDMap binary stream with unicode mappings', async () => {
            // Load real font file
            const fontData = await loadFont(TTF_FIXTURE)

            // Create Type0 font - unicode support should be auto-detected from cmap
            const font = PdfFont.fromFile(fontData, {
                fontName: 'TestFont-Unicode',
            })

            // Verify font is Type0 with Identity-H encoding (auto-detected)
            expect(font.fontType).toBe('Type0')
            expect(font.encoding).toBe('Identity-H')

            // Verify font has CID widths via PDF dictionary
            const cidWidth = font.getRawCharacterWidth(0x0041) // 'A'
            expect(cidWidth).not.toBeNull()
            expect(cidWidth).toBeGreaterThan(0)
            const document = new PdfDocument()
            document.add(font)
            const pdfBytes = document.toBytes()

            expect(pdfBytes.length).toBeGreaterThan(0)
        })

        it('should generate correct glyph IDs in CIDToGIDMap for exotic characters', async () => {
            // Load real font file
            const fontData = await loadFont(
                './test/unit/fixtures/fonts/helvetica.ttf',
            )

            // Create Type0 font - unicode will be auto-detected since font contains Ę
            const font = PdfFont.fromFile(fontData, {
                fontName: 'TestFont-Exotic',
            })

            // Verify font has CID widths via PDF dictionary
            const cidWidth = font.getRawCharacterWidth(0x0041) // 'A'
            expect(cidWidth).not.toBeNull()
            expect(cidWidth).toBeGreaterThan(0)

            // Verify specific characters have widths
            // Polish Ę character (U+0118)
            const eOgonekWidth = font.getRawCharacterWidth(0x0118)
            expect(eOgonekWidth).not.toBeNull()
            expect(eOgonekWidth).toBeGreaterThan(0)

            // Regular ASCII 'E' (U+0045) should also work
            const eWidth = font.getRawCharacterWidth(0x0045)
            expect(eWidth).not.toBeNull()
            expect(eWidth).toBeGreaterThan(0)
        })
    })
})

describe('Font Parsers with Real Fonts', () => {
    describe('TtfParser with Roboto TTF', () => {
        it('should parse Roboto TTF font', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const info = parser.getFontInfo()

            expect(info.fontFamily).toBe('Roboto')
            expect(info.fullName).toBe('Roboto Regular')
            expect(info.unitsPerEm).toBe(2048)
            expect(info.isItalic).toBe(false)
            expect(info.isBold).toBe(false)
        })

        it('should get font descriptor from Roboto TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const descriptor = parser.getPdfFontDescriptor()

            expect(descriptor.familyName).toBe('Roboto')
            expect(descriptor.fontWeight).toBe(400)
            // Metrics should be scaled to 1000 units
            expect(descriptor.ascender).toBeGreaterThan(0)
            expect(descriptor.descender).toBeLessThan(0)
            expect(descriptor.charWidths.size).toBe(95) // chars 32-126
        })

        it('should extract character widths from Roboto TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const widths = parser.getCharWidths(65, 90) // A-Z

            expect(widths).toHaveLength(26)
            // All uppercase letters should have positive widths
            widths.forEach((w) => expect(w).toBeGreaterThan(0))
        })
    })

    describe('OtfParser with Source Sans OTF', () => {
        it('should parse Source Sans OTF font', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = new OtfParser(fontData)
            const info = parser.getFontInfo()

            expect(info.fontFamily).toBe('Source Sans 3')
            expect(info.unitsPerEm).toBe(1000)
        })

        it('should detect CFF-based OpenType', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = new OtfParser(fontData)

            expect(parser.isCFFBased()).toBe(true)
        })

        it('should get font descriptor from Source Sans OTF', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = new OtfParser(fontData)
            const descriptor = parser.getPdfFontDescriptor()

            expect(descriptor.familyName).toBe('Source Sans 3')
            expect(descriptor.ascender).toBeGreaterThan(0)
            expect(descriptor.descender).toBeLessThan(0)
        })
    })

    describe('WoffParser with Roboto WOFF', () => {
        it('should parse Roboto WOFF font', async () => {
            const fontData = await loadFont(WOFF_FIXTURE)
            const parser = new WoffParser(fontData)
            const info = parser.getFontInfo()

            expect(info.fontFamily).toBe('Roboto')
            expect(info.unitsPerEm).toBe(2048)
        })

        it('should decompress WOFF and extract metrics', async () => {
            const fontData = await loadFont(WOFF_FIXTURE)
            const parser = new WoffParser(fontData)
            const descriptor = parser.getPdfFontDescriptor()

            expect(descriptor.familyName).toBe('Roboto')
            expect(descriptor.ascender).toBeGreaterThan(0)
            expect(descriptor.charWidths.size).toBeGreaterThan(0)
        })

        it('should provide access to decompressed font data', async () => {
            const fontData = await loadFont(WOFF_FIXTURE)
            const parser = new WoffParser(fontData)
            const decompressed = parser.getFontData()

            // Decompressed data should be larger than WOFF (uncompressed)
            expect(decompressed.length).toBeGreaterThan(fontData.length)

            // Should be valid TTF (starts with 0x00010000)
            const view = new DataView(
                decompressed.buffer,
                decompressed.byteOffset,
            )
            expect(view.getUint32(0)).toBe(0x00010000)
        })
    })

    describe('parseFont auto-detection with real fonts', () => {
        it('should auto-detect and parse TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = parseFont(fontData)
            const info = parser.getFontInfo()

            expect(info.fontFamily).toBe('Roboto')
        })

        it('should auto-detect and parse OTF', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = parseFont(fontData)
            const info = parser.getFontInfo()

            expect(info.fontFamily).toBe('Source Sans 3')
        })

        it('should auto-detect and parse WOFF', async () => {
            const fontData = await loadFont(WOFF_FIXTURE)
            const parser = parseFont(fontData)
            const info = parser.getFontInfo()

            expect(info.fontFamily).toBe('Roboto')
        })
    })

    describe('Font embedding with real fonts', () => {
        it('should create PdfFont from Roboto TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = parseFont(fontData)
            const metrics = parser.getPdfFontDescriptor('Roboto')

            const font = PdfFont.fromTrueTypeData(metrics)
            font.resourceName = 'F1'

            expect(font.resourceName).toBe('F1')
        })

        it('should serialize PDF with embedded custom font', async () => {
            const document = new PdfDocument()
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = parseFont(fontData)
            const metrics = parser.getPdfFontDescriptor('Roboto')

            const font = PdfFont.fromTrueTypeData(metrics)
            font.resourceName = 'F1'
            document.add(font)

            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0) // PDF should be generated

            // Verify the font is embedded by parsing the PDF back
            const reparsed = await PdfDocument.fromBytes([bytes])
            expect(reparsed).toBeDefined()
        })
    })
})

describe('Font Parsers with Minimal Test Data', () => {
    // Helper to create a minimal valid TTF font structure
    function createMinimalTtf(): Uint8Array<ArrayBuffer> {
        const buffer = new ArrayBuffer(512)
        const view = new DataView(buffer)

        // Offset Table
        view.setUint32(0, 0x00010000) // sfntVersion (TrueType)
        view.setUint16(4, 4) // numTables
        view.setUint16(6, 64) // searchRange
        view.setUint16(8, 2) // entrySelector
        view.setUint16(10, 0) // rangeShift

        // Table Directory (4 tables: head, hhea, maxp, cmap)
        const tables = [
            { tag: 'cmap', offset: 200, length: 50 },
            { tag: 'head', offset: 100, length: 54 },
            { tag: 'hhea', offset: 160, length: 36 },
            { tag: 'maxp', offset: 250, length: 6 },
        ]

        tables.forEach((table, i) => {
            const offset = 12 + i * 16
            // Write tag as 4 ASCII bytes
            for (let j = 0; j < 4; j++) {
                view.setUint8(offset + j, table.tag.charCodeAt(j))
            }
            view.setUint32(offset + 4, 0) // checksum
            view.setUint32(offset + 8, table.offset)
            view.setUint32(offset + 12, table.length)
        })

        // head table (at offset 100)
        view.setUint32(100, 0x00010000) // version
        view.setUint32(104, 0x00005000) // fontRevision
        view.setUint32(108, 0) // checksumAdjustment
        view.setUint32(112, 0x5f0f3cf5) // magicNumber
        view.setUint16(116, 0) // flags
        view.setUint16(118, 1000) // unitsPerEm
        // ... skip dates
        view.setInt16(136, -100) // xMin
        view.setInt16(138, -200) // yMin
        view.setInt16(140, 800) // xMax
        view.setInt16(142, 900) // yMax
        view.setUint16(144, 0) // macStyle

        // hhea table (at offset 160)
        view.setUint32(160, 0x00010000) // version
        view.setInt16(164, 800) // ascent
        view.setInt16(166, -200) // descent
        view.setInt16(168, 100) // lineGap
        // ... skip to numberOfHMetrics at offset 34
        view.setUint16(194, 1) // numberOfHMetrics

        // cmap table (at offset 200) - minimal format 4
        view.setUint16(200, 0) // version
        view.setUint16(202, 1) // numTables
        // Encoding record
        view.setUint16(204, 3) // platformID (Windows)
        view.setUint16(206, 1) // encodingID (Unicode BMP)
        view.setUint32(208, 12) // offset to subtable

        // Format 4 subtable (at offset 212)
        view.setUint16(212, 4) // format
        view.setUint16(214, 32) // length
        view.setUint16(216, 0) // language
        view.setUint16(218, 4) // segCount * 2
        view.setUint16(220, 2) // searchRange
        view.setUint16(222, 0) // entrySelector
        view.setUint16(224, 2) // rangeShift
        // endCode
        view.setUint16(226, 0xffff)
        // reservedPad
        view.setUint16(228, 0)
        // startCode
        view.setUint16(230, 0xffff)
        // idDelta
        view.setInt16(232, 1)
        // idRangeOffset
        view.setUint16(234, 0)

        // maxp table (at offset 250)
        view.setUint32(250, 0x00010000) // version
        view.setUint16(254, 1) // numGlyphs

        return new Uint8Array(buffer)
    }

    // Helper to create a minimal OTF (CFF-based) font structure
    function createMinimalOtf(): Uint8Array<ArrayBuffer> {
        const buffer = new ArrayBuffer(512)
        const view = new DataView(buffer)

        // Offset Table with 'OTTO' signature for CFF
        view.setUint32(0, 0x4f54544f) // 'OTTO'
        view.setUint16(4, 4) // numTables
        view.setUint16(6, 64) // searchRange
        view.setUint16(8, 2) // entrySelector
        view.setUint16(10, 0) // rangeShift

        // Same table structure as TTF
        const tables = [
            { tag: 'cmap', offset: 200, length: 50 },
            { tag: 'head', offset: 100, length: 54 },
            { tag: 'hhea', offset: 160, length: 36 },
            { tag: 'maxp', offset: 250, length: 6 },
        ]

        tables.forEach((table, i) => {
            const offset = 12 + i * 16
            for (let j = 0; j < 4; j++) {
                view.setUint8(offset + j, table.tag.charCodeAt(j))
            }
            view.setUint32(offset + 4, 0)
            view.setUint32(offset + 8, table.offset)
            view.setUint32(offset + 12, table.length)
        })

        // head table
        view.setUint32(100, 0x00010000)
        view.setUint32(104, 0x00005000)
        view.setUint32(108, 0)
        view.setUint32(112, 0x5f0f3cf5)
        view.setUint16(116, 0)
        view.setUint16(118, 2048) // unitsPerEm
        view.setInt16(136, -500)
        view.setInt16(138, -400)
        view.setInt16(140, 1500)
        view.setInt16(142, 1800)
        view.setUint16(144, 0)

        // hhea table
        view.setUint32(160, 0x00010000)
        view.setInt16(164, 1800)
        view.setInt16(166, -400)
        view.setInt16(168, 200)
        view.setUint16(194, 1)

        // cmap table
        view.setUint16(200, 0)
        view.setUint16(202, 1)
        view.setUint16(204, 3)
        view.setUint16(206, 1)
        view.setUint32(208, 12)
        view.setUint16(212, 4)
        view.setUint16(214, 32)
        view.setUint16(216, 0)
        view.setUint16(218, 4)
        view.setUint16(220, 2)
        view.setUint16(222, 0)
        view.setUint16(224, 2)
        view.setUint16(226, 0xffff)
        view.setUint16(228, 0)
        view.setUint16(230, 0xffff)
        view.setInt16(232, 1)
        view.setUint16(234, 0)

        // maxp table
        view.setUint32(250, 0x00010000)
        view.setUint16(254, 1)

        return new Uint8Array(buffer)
    }

    describe('TtfParser', () => {
        it('should parse a minimal TTF font', () => {
            const ttfData = createMinimalTtf()
            const parser = new TtfParser(ttfData)
            const info = parser.getFontInfo()

            expect(info.unitsPerEm).toBe(1000)
            expect(info.ascent).toBe(800)
            expect(info.descent).toBe(-200)
        })

        it('should create PdfFontDescriptor with scaled metrics', () => {
            const ttfData = createMinimalTtf()
            const parser = new TtfParser(ttfData)
            const descriptor = parser.getPdfFontDescriptor('TestFont')

            expect(descriptor.fontName).toBe('TestFont')
            // Metrics should be scaled to 1000 units (already at 1000, so unchanged)
            expect(descriptor.ascender).toBe(800)
            expect(descriptor.descender).toBe(-200)
            expect(descriptor.bbox).toEqual({
                llx: -100,
                lly: -200,
                urx: 800,
                ury: 900,
            })
        })

        it('should scale metrics when unitsPerEm is not 1000', () => {
            const ttfData = createMinimalTtf()
            // Modify unitsPerEm to 2000
            const view = new DataView(ttfData.buffer)
            view.setUint16(118, 2000)
            // Update hhea values proportionally
            view.setInt16(164, 1600)
            view.setInt16(166, -400)

            const parser = new TtfParser(ttfData)
            const descriptor = parser.getPdfFontDescriptor()

            // Metrics should be scaled from 2000 to 1000
            expect(descriptor.ascender).toBe(800) // 1600 * (1000/2000)
            expect(descriptor.descender).toBe(-200) // -400 * (1000/2000)
        })

        it('should return character widths for a range', () => {
            const ttfData = createMinimalTtf()
            const parser = new TtfParser(ttfData)
            const widths = parser.getCharWidths(32, 36)

            expect(widths).toHaveLength(5)
            // All should be 0 since our minimal font has no hmtx data
            widths.forEach((w) => expect(typeof w).toBe('number'))
        })
    })

    describe('OtfParser', () => {
        it('should parse a minimal OTF font', () => {
            const otfData = createMinimalOtf()
            const parser = new OtfParser(otfData)
            const info = parser.getFontInfo()

            expect(info.unitsPerEm).toBe(2048)
            expect(info.ascent).toBe(1800)
            expect(info.descent).toBe(-400)
        })

        it('should detect CFF-based OpenType fonts', () => {
            const otfData = createMinimalOtf()
            const parser = new OtfParser(otfData)

            expect(parser.isCFFBased()).toBe(true)
        })

        it('should create PdfFontDescriptor with scaled metrics', () => {
            const otfData = createMinimalOtf()
            const parser = new OtfParser(otfData)
            const descriptor = parser.getPdfFontDescriptor('OtfTestFont')

            expect(descriptor.fontName).toBe('OtfTestFont')
            // Metrics should be scaled from 2048 to 1000
            expect(descriptor.ascender).toBe(Math.round((1800 * 1000) / 2048))
            expect(descriptor.descender).toBe(Math.round((-400 * 1000) / 2048))
        })
    })

    describe('detectFontFormat', () => {
        it('should detect TTF format', () => {
            const ttfData = createMinimalTtf()
            expect(detectFontFormat(ttfData)).toBe('ttf')
        })

        it('should detect OTF format', () => {
            const otfData = createMinimalOtf()
            expect(detectFontFormat(otfData)).toBe('otf')
        })

        it('should detect WOFF format', () => {
            const woffData = new Uint8Array([0x77, 0x4f, 0x46, 0x46]) // 'wOFF'
            expect(detectFontFormat(woffData)).toBe('woff')
        })

        it('should detect WOFF2 format', () => {
            const woff2Data = new Uint8Array([0x77, 0x4f, 0x46, 0x32]) // 'wOF2'
            expect(detectFontFormat(woff2Data)).toBe('woff2')
        })

        it('should return unknown for invalid data', () => {
            const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00])
            expect(detectFontFormat(invalidData)).toBe('unknown')
        })

        it('should return unknown for short data', () => {
            const shortData = new Uint8Array([0x00, 0x01])
            expect(detectFontFormat(shortData)).toBe('unknown')
        })
    })

    describe('parseFont', () => {
        it('should automatically detect and parse TTF', () => {
            const ttfData = createMinimalTtf()
            const parser = parseFont(ttfData)
            const info = parser.getFontInfo()

            expect(info.unitsPerEm).toBe(1000)
        })

        it('should automatically detect and parse OTF', () => {
            const otfData = createMinimalOtf()
            const parser = parseFont(otfData)
            const info = parser.getFontInfo()

            expect(info.unitsPerEm).toBe(2048)
        })

        it('should throw for unsupported formats', () => {
            const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00])
            expect(() => parseFont(invalidData)).toThrow(
                'Unknown or unsupported font format',
            )
        })

        it('should throw for WOFF2 (unsupported)', () => {
            const woff2Data = new Uint8Array([0x77, 0x4f, 0x46, 0x32])
            expect(() => parseFont(woff2Data)).toThrow(
                'WOFF2 format is not supported',
            )
        })
    })

    describe('isSupportedFontFormat', () => {
        it('should return true for supported formats', () => {
            expect(isSupportedFontFormat('ttf')).toBe(true)
            expect(isSupportedFontFormat('otf')).toBe(true)
            expect(isSupportedFontFormat('woff')).toBe(true)
        })

        it('should return false for unsupported formats', () => {
            expect(isSupportedFontFormat('woff2')).toBe(false)
            expect(isSupportedFontFormat('unknown')).toBe(false)
        })
    })

    describe('FontParser interface', () => {
        it('should have consistent interface across parsers', () => {
            const ttfParser = new TtfParser(createMinimalTtf())
            const otfParser = new OtfParser(createMinimalOtf())

            // Both should implement the same interface
            expect(typeof ttfParser.getFontInfo).toBe('function')
            expect(typeof ttfParser.getPdfFontDescriptor).toBe('function')
            expect(typeof ttfParser.getCharWidths).toBe('function')

            expect(typeof otfParser.getFontInfo).toBe('function')
            expect(typeof otfParser.getPdfFontDescriptor).toBe('function')
            expect(typeof otfParser.getCharWidths).toBe('function')
        })

        it('should return TtfFontInfo with all required fields', () => {
            const parser = new TtfParser(createMinimalTtf())
            const info = parser.getFontInfo()

            expect(info).toHaveProperty('fontFamily')
            expect(info).toHaveProperty('fontSubfamily')
            expect(info).toHaveProperty('fullName')
            expect(info).toHaveProperty('postScriptName')
            expect(info).toHaveProperty('unitsPerEm')
            expect(info).toHaveProperty('ascent')
            expect(info).toHaveProperty('descent')
            expect(info).toHaveProperty('lineGap')
            expect(info).toHaveProperty('capHeight')
            expect(info).toHaveProperty('xHeight')
            expect(info).toHaveProperty('stemV')
            expect(info).toHaveProperty('bbox')
            expect(info).toHaveProperty('isItalic')
            expect(info).toHaveProperty('isBold')
            expect(info).toHaveProperty('isFixedPitch')
        })

        it('should return PdfFontDescriptor with all required fields', () => {
            const parser = new TtfParser(createMinimalTtf())
            const descriptor = parser.getPdfFontDescriptor('TestFont')

            expect(descriptor).toHaveProperty('fontName')
            expect(descriptor).toHaveProperty('familyName')
            expect(descriptor).toHaveProperty('fontWeight')
            expect(descriptor).toHaveProperty('bbox')
            expect(descriptor).toHaveProperty('italicAngle')
            expect(descriptor).toHaveProperty('ascender')
            expect(descriptor).toHaveProperty('descender')
            expect(descriptor).toHaveProperty('capHeight')
            expect(descriptor).toHaveProperty('stdVW')
            expect(descriptor).toHaveProperty('firstChar')
            expect(descriptor).toHaveProperty('lastChar')
            expect(descriptor).toHaveProperty('charWidths')
        })
    })

    describe('parseGlyphNames', () => {
        it('should return empty map for minimal font without post format 2', () => {
            const parser = new TtfParser(createMinimalTtf())
            const names = parser.parseGlyphNames()
            // Minimal font has no post table, so no names
            expect(names).toBeInstanceOf(Map)
        })

        it('should extract glyph names from real TTF font', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const names = parser.parseGlyphNames()

            expect(names.size).toBeGreaterThan(0)
            // .notdef is typically glyph 0
            expect(names.get(0)).toBe('.notdef')
        })

        it('should handle OTF font post table (may use format 3 with no names)', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = new OtfParser(fontData)
            const names = parser.parseGlyphNames()

            // CFF-based OTF fonts often use post format 3.0 (no glyph names)
            expect(names).toBeInstanceOf(Map)
        })
    })

    describe('parseKern', () => {
        it('should return empty array for font without kern table', () => {
            const parser = new TtfParser(createMinimalTtf())
            const pairs = parser.parseKern()
            expect(pairs).toEqual([])
        })

        it('should extract kern pairs from real TTF if kern table present', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const pairs = parser.parseKern()

            // Kern pairs array should be defined (may be empty if font uses GPOS instead)
            expect(Array.isArray(pairs)).toBe(true)
            for (const pair of pairs) {
                expect(pair).toHaveProperty('left')
                expect(pair).toHaveProperty('right')
                expect(pair).toHaveProperty('dx')
                expect(typeof pair.left).toBe('string')
                expect(typeof pair.right).toBe('string')
                expect(typeof pair.dx).toBe('number')
            }
        })

        it('should extract kern pairs from real OTF if kern table present', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = new OtfParser(fontData)
            const pairs = parser.parseKern()

            expect(Array.isArray(pairs)).toBe(true)
            for (const pair of pairs) {
                expect(pair).toHaveProperty('left')
                expect(pair).toHaveProperty('right')
                expect(pair).toHaveProperty('dx')
            }
        })
    })

    describe('getPdfFontDescriptor extended fields', () => {
        it('should include glyphMetrics in descriptor from real TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            expect(desc.glyphMetrics.size).toBeGreaterThan(0)
            // 'A' is char code 65
            const aGlyph = desc.getGlyphMetrics(65)
            expect(aGlyph).toBeDefined()
            expect(aGlyph!.name).toBeDefined()
            expect(aGlyph!.width).toBeGreaterThan(0)
        })

        it('should include glyphNameToCode in descriptor from real TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            expect(desc.glyphNameToCode.size).toBeGreaterThan(0)
        })

        it('should include underline metrics from real TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            expect(desc.underlinePosition).toBeDefined()
            expect(typeof desc.underlinePosition).toBe('number')
            expect(desc.underlineThickness).toBeDefined()
            expect(typeof desc.underlineThickness).toBe('number')
        })

        it('should include weight string in descriptor', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            expect(desc.weight).toBeDefined()
            expect(typeof desc.weight).toBe('string')
        })

        it('should include kernPairs in descriptor from real TTF', async () => {
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = new TtfParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            // kernPairs should always be defined (may be empty)
            expect(Array.isArray(desc.kernPairs)).toBe(true)
        })

        it('should include extended fields from OTF parser', async () => {
            const fontData = await loadFont(OTF_FIXTURE)
            const parser = new OtfParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            expect(desc.glyphMetrics.size).toBeGreaterThan(0)
            expect(desc.glyphNameToCode.size).toBeGreaterThan(0)
            expect(desc.weight).toBeDefined()
            expect(Array.isArray(desc.kernPairs)).toBe(true)
        })

        it('should include extended fields from WOFF parser', async () => {
            const fontData = await loadFont(WOFF_FIXTURE)
            const parser = new WoffParser(fontData)
            const desc = parser.getPdfFontDescriptor()

            expect(desc.glyphMetrics.size).toBeGreaterThan(0)
            expect(desc.glyphNameToCode.size).toBeGreaterThan(0)
            expect(desc.weight).toBeDefined()
            expect(Array.isArray(desc.kernPairs)).toBe(true)
        })
    })

    describe('PdfFont.fromBytes', () => {
        it('should create PdfFont from TTF bytes', () => {
            const ttfData = createMinimalTtf()
            const font = PdfFont.fromBytes(ttfData)

            expect(font).toBeInstanceOf(PdfFont)
            expect(font.fontName).toBeDefined()
            expect(typeof font.fontName).toBe('string')
        })

        it('should create PdfFont from OTF bytes (non-CFF)', () => {
            const otfData = createMinimalOtf()
            // Modify to make it non-CFF based (use TTF signature instead)
            const view = new DataView(otfData.buffer)
            view.setUint32(0, 0x00010000) // Change from 'OTTO' to TTF signature

            const font = PdfFont.fromBytes(otfData)

            expect(font).toBeInstanceOf(PdfFont)
            expect(font.fontName).toBeDefined()
        })

        it('should throw error for unsupported font formats', () => {
            const invalidData = new Uint8Array([0x00, 0x00, 0x00, 0x00])

            expect(() => PdfFont.fromBytes(invalidData)).toThrow(
                'Unknown or unsupported font format',
            )
        })

        it('should throw error for WOFF2 format', () => {
            const woff2Data = new Uint8Array([0x77, 0x4f, 0x46, 0x32]) // 'wOF2'

            expect(() => PdfFont.fromBytes(woff2Data)).toThrow(
                'WOFF2 format is not supported',
            )
        })

        it('should extract font properties correctly', () => {
            const ttfData = createMinimalTtf()
            const font = PdfFont.fromBytes(ttfData)

            // Check that the font has the required PDF dictionary entries
            expect(font.content.get('Type')?.toString()).toBe('/Font')
            expect(font.content.get('Subtype')?.toString()).toBe('/TrueType')
            expect(font.content.get('BaseFont')).toBeDefined()
        })

        it('should have embedded font data', () => {
            const ttfData = createMinimalTtf()
            const font = PdfFont.fromBytes(ttfData)

            // Font should store reference to font data
            expect(font.fontData).toBeDefined()
            expect(font.fontData).toBeInstanceOf(Uint8Array)
        })

        it('should preserve original font bytes', () => {
            const ttfData = createMinimalTtf()
            const originalLength = ttfData.length
            const font = PdfFont.fromBytes(ttfData)

            expect(font.fontData?.length).toBe(originalLength)
        })

        it('should handle multiple fonts independently', () => {
            const ttfData1 = createMinimalTtf()
            const ttfData2 = createMinimalTtf()

            const font1 = PdfFont.fromBytes(ttfData1)
            const font2 = PdfFont.fromBytes(ttfData2)

            expect(font1).toBeInstanceOf(PdfFont)
            expect(font2).toBeInstanceOf(PdfFont)
            // Each font should be independent
            expect(font1).not.toBe(font2)
        })

        it('should work with real TTF font file', async () => {
            const ttfData = await loadFont(TTF_FIXTURE)
            const font = PdfFont.fromBytes(ttfData)

            expect(font).toBeInstanceOf(PdfFont)
            expect(font.fontName).toBeDefined()
            expect(font.fontName?.length).toBeGreaterThan(0)
        })

        it('should work with real OTF font file (non-CFF)', async () => {
            const otfData = await loadFont(OTF_FIXTURE)

            // Check if this OTF is CFF-based
            const view = new DataView(
                otfData.buffer,
                otfData.byteOffset,
                otfData.byteLength,
            )
            const signature = view.getUint32(0)
            const isCFF = signature === 0x4f54544f // 'OTTO'

            if (isCFF) {
                // If CFF-based, should throw
                expect(() => PdfFont.fromBytes(otfData)).toThrow(
                    'CFF-based OTF fonts are not supported yet',
                )
            } else {
                // If not CFF-based, should work
                const font = PdfFont.fromBytes(otfData)
                expect(font).toBeInstanceOf(PdfFont)
                expect(font.fontName).toBeDefined()
            }
        })

        it('should work with real WOFF font file', async () => {
            const woffData = await loadFont(WOFF_FIXTURE)
            const font = PdfFont.fromBytes(woffData)

            expect(font).toBeInstanceOf(PdfFont)
            expect(font.fontName).toBeDefined()
            expect(font.fontName!.length).toBeGreaterThan(0)
        })
    })
})

// Helper: build a PdfFont with a custom Differences encoding map.
function fontWithDifferences(mapping: Record<number, string>): PdfFont {
    const font = new PdfFont('CustomEncFont')
    font.fontType = 'Type1'

    const items: (PdfNumber | PdfName)[] = []
    for (const [code, glyphName] of Object.entries(mapping)) {
        items.push(new PdfNumber(Number(code)))
        items.push(new PdfName(glyphName))
    }

    const encDict = new PdfDictionary<{
        Type: PdfName<'Encoding'>
        Differences: PdfArray<PdfNumber | PdfName>
    }>()
    encDict.set('Type', new PdfName('Encoding') as PdfName<'Encoding'>)
    encDict.set('Differences', new PdfArray(items))
    font.content.set('Encoding', encDict as never)

    return font
}

function cidFont(): PdfFont {
    const font = new PdfFont('CIDFont')
    font.fontType = 'Type0'
    return font
}

describe('PdfFont.encode()', () => {
    describe('standard/simple font', () => {
        it('wraps plain text in parentheses', () => {
            const font = new PdfFont('Helvetica')
            expect(font.encode('Hello').toString()).toBe('(Hello)')
        })

        it('escapes backslashes', () => {
            const font = new PdfFont('Helvetica')
            expect(font.encode('a\\b').toString()).toBe('(a\\\\b)')
        })

        it('escapes opening parenthesis', () => {
            const font = new PdfFont('Helvetica')
            expect(font.encode('(test').toString()).toBe('(\\(test)')
        })

        it('escapes closing parenthesis', () => {
            const font = new PdfFont('Helvetica')
            expect(font.encode('test)').toString()).toBe('(test\\))')
        })

        it('escapes both parentheses', () => {
            const font = new PdfFont('Helvetica')
            expect(font.encode('(Hello)').toString()).toBe('(\\(Hello\\))')
        })
    })

    describe('Type0 / CID font', () => {
        it('returns a hex string with 2-byte CIDs', () => {
            const font = cidFont()
            expect(font.encode('AB').toString()).toBe('<00410042>')
        })

        it('handles BMP characters', () => {
            const font = cidFont()
            expect(font.encode('\u20ac').toString()).toBe('<20ac>')
        })

        it('handles empty string', () => {
            const font = cidFont()
            expect(font.encode('').toString()).toBe('<>')
        })
    })

    describe('font with custom Differences encoding', () => {
        it('returns a hex string using the reverse map', () => {
            const font = fontWithDifferences({ 160: 'Euro' })
            expect(font.encode('\u20ac').toString()).toBe('<a0>')
        })

        it('falls back to char code for unmapped characters', () => {
            const font = fontWithDifferences({ 160: 'Euro' })
            expect(font.encode('A').toString()).toBe('<41>')
        })

        it('encodes multiple characters', () => {
            const font = fontWithDifferences({ 160: 'Euro', 164: 'currency' })
            expect(font.encode('\u20ac\u00a4').toString()).toBe('<a0a4>')
        })
    })
})

describe('PdfFont.decode()', () => {
    describe('literal strings', () => {
        it('strips surrounding parentheses', () => {
            const font = new PdfFont('Helvetica')
            expect(font.decode(new PdfString('Hello'))).toBe('Hello')
        })

        it('unescapes closing parenthesis', () => {
            const font = new PdfFont('Helvetica')
            expect(font.decode(new PdfString('test)'))).toBe('test)')
        })

        it('unescapes newline escape sequence', () => {
            const font = new PdfFont('Helvetica')
            expect(font.decode(new PdfString('line1\nline2'))).toBe(
                'line1\nline2',
            )
        })

        it('returns plain string unchanged when no delimiters match', () => {
            const font = new PdfFont('Helvetica')
            expect(font.decode(new PdfString('Hello'))).toBe('Hello')
        })
    })

    describe('Type0 / CID font hex strings', () => {
        it('decodes 2-byte CIDs to Unicode', () => {
            const font = cidFont()
            expect(font.decode(new PdfHexadecimal('00410042'))).toBe('AB')
        })

        it('handles empty hex string', () => {
            const font = cidFont()
            expect(font.decode(new PdfHexadecimal(''))).toBe('')
        })

        it('decodes BMP characters', () => {
            const font = cidFont()
            expect(font.decode(new PdfHexadecimal('20ac'))).toBe('\u20ac')
        })
    })

    describe('font with custom Differences encoding hex strings', () => {
        it('decodes 1-byte hex codes through encoding map', () => {
            const font = fontWithDifferences({ 160: 'Euro' })
            expect(font.decode(new PdfHexadecimal('a0'))).toBe('\u20ac')
        })

        it('falls back to char code for unmapped bytes', () => {
            const font = fontWithDifferences({ 160: 'Euro' })
            expect(font.decode(new PdfHexadecimal('41'))).toBe('A')
        })

        it('decodes multiple bytes', () => {
            const font = fontWithDifferences({ 160: 'Euro', 164: 'currency' })
            expect(font.decode(new PdfHexadecimal('a0a4'))).toBe('\u20ac\u00a4')
        })
    })

    describe('round-trips', () => {
        it('encode then decode returns original text (standard font)', () => {
            const font = new PdfFont('Helvetica')
            const text = 'Hello (World)'
            expect(font.decode(font.encode(text))).toBe(text)
        })

        it('encode then decode returns original text (CID font)', () => {
            const font = cidFont()
            const text = 'Hello \u20ac'
            expect(font.decode(font.encode(text))).toBe(text)
        })

        it('encode then decode returns original text (custom encoding)', () => {
            const font = fontWithDifferences({ 160: 'Euro', 164: 'currency' })
            const text = '\u20ac\u00a4'
            expect(font.decode(font.encode(text))).toBe(text)
        })
    })

    describe('writeContentStreamText', () => {
        it('should produce simple Tj for font without kern pairs', () => {
            const font = new PdfFont('Helvetica')
            font.metrics = new PdfFontDescriptor({})
            const result = font.writeContentStreamText('Hello')
            expect(result).toBe('(Hello) Tj')
        })

        it('should produce Tj for standard font when no kern applies', () => {
            const font = PdfFont.HELVETICA
            // "xx" — unlikely to have a kern pair
            const result = font.writeContentStreamText('xx')
            expect(result).toMatch(/Tj$/)
        })

        it('should produce TJ with kern adjustments for kerned pairs', () => {
            const font = PdfFont.HELVETICA
            // AV is a classic kern pair in Helvetica
            const result = font.writeContentStreamText('AV')
            // Should use TJ if kern applies
            expect(result).toMatch(/TJ$/)
            // Should contain a numeric kern adjustment
            expect(result).toMatch(/\[.*\d+.*\] TJ/)
        })

        it('should handle text with multiple kern pairs', () => {
            const font = PdfFont.HELVETICA
            const result = font.writeContentStreamText('AVATAR')
            // Should be TJ with multiple segments
            expect(result).toMatch(/TJ$/)
        })

        it('should handle empty string', () => {
            const font = PdfFont.HELVETICA
            const result = font.writeContentStreamText('')
            expect(result).toMatch(/Tj$/)
        })

        it('should escape special PDF characters in literal strings', () => {
            const font = new PdfFont('Helvetica')
            font.metrics = new PdfFontDescriptor({})
            const result = font.writeContentStreamText('Hello (World)')
            expect(result).toBe('(Hello \\(World\\)) Tj')
        })

        it('should use hex encoding for Type0 fonts', () => {
            const font = PdfFont.HELVETICA
            // Create a Type0 font manually
            const cidFont = new PdfFont({
                fontName: 'TestCID',
                encoding: 'Identity-H',
                metrics: new PdfFontDescriptor({}),
            })
            cidFont.fontType = 'Type0'
            const result = cidFont.writeContentStreamText('AB')
            expect(result).toMatch(/<[0-9a-f]+>/)
        })
    })

    describe('PdfFontDescriptor', () => {
        it('should construct with kern pairs and provide O(1) lookup', () => {
            const kernPairs: AfmKernPair[] = [
                { left: 'A', right: 'V', dx: -80 },
                { left: 'A', right: 'W', dx: -60 },
                { left: 'T', right: 'o', dx: -40 },
            ]
            const metrics = new PdfFontDescriptor({ kernPairs })

            expect(metrics.getKernAdjustment('A', 'V')).toBe(-80)
            expect(metrics.getKernAdjustment('A', 'W')).toBe(-60)
            expect(metrics.getKernAdjustment('T', 'o')).toBe(-40)
            expect(metrics.getKernAdjustment('A', 'B')).toBe(0)
        })

        it('should construct with char widths and provide lookup', () => {
            const charWidths = new Map([
                [32, 278],
                [65, 667],
            ])
            const metrics = new PdfFontDescriptor({ charWidths })

            expect(metrics.getCharWidth(32)).toBe(278)
            expect(metrics.getCharWidth(65)).toBe(667)
            expect(metrics.getCharWidth(99)).toBeUndefined()
        })

        it('should build from AfmFont data', () => {
            const afm = {
                metadata: {},
                bbox: { llx: 0, lly: 0, urx: 1000, ury: 1000 },
                charMetrics: [
                    {
                        code: 32,
                        wx: 278,
                        name: 'space',
                        bbox: { llx: 0, lly: 0, urx: 0, ury: 0 },
                    },
                    {
                        code: 65,
                        wx: 667,
                        name: 'A',
                        bbox: { llx: 0, lly: 0, urx: 600, ury: 700 },
                    },
                ],
                kernPairs: [{ left: 'A', right: 'V', dx: -80 }],
            }
            const metrics = PdfFontDescriptor.fromAfm(afm)

            expect(metrics.getCharWidth(32)).toBe(278)
            expect(metrics.getCharWidth(65)).toBe(667)
            expect(metrics.getKernAdjustment('A', 'V')).toBe(-80)
            expect(metrics.kernPairs).toHaveLength(1)
        })

        it('should return 0 for kern adjustment when no kern pairs exist', () => {
            const metrics = new PdfFontDescriptor({})
            expect(metrics.getKernAdjustment('A', 'V')).toBe(0)
        })

        it('Helvetica should have kern pairs from AFM data', () => {
            const font = PdfFont.HELVETICA
            expect(font.metrics).toBeDefined()
            expect(font.metrics!.kernPairs.length).toBeGreaterThan(0)
            // A,V is a common kern pair in Helvetica
            expect(font.metrics!.getKernAdjustment('A', 'V')).toBeLessThan(0)
        })

        it('Helvetica should have correct char widths from AFM data', () => {
            const font = PdfFont.HELVETICA
            // space = 278 in Helvetica AFM
            expect(font.metrics!.getCharWidth(32)).toBe(278)
            // A = 667 in Helvetica AFM
            expect(font.metrics!.getCharWidth(65)).toBe(667)
        })

        it('Courier should have no kern pairs', () => {
            const font = PdfFont.COURIER
            expect(font.metrics).toBeDefined()
            expect(font.metrics!.kernPairs).toHaveLength(0)
            expect(font.metrics!.getKernAdjustment('A', 'V')).toBe(0)
        })

        it('Courier should have fixed-width char widths', () => {
            const font = PdfFont.COURIER
            expect(font.metrics!.getCharWidth(32)).toBe(600)
            expect(font.metrics!.getCharWidth(65)).toBe(600)
        })

        it('Times-Roman should have kern pairs', () => {
            const font = PdfFont.TIMES_ROMAN
            expect(font.metrics!.kernPairs.length).toBeGreaterThan(0)
            expect(font.metrics!.getKernAdjustment('A', 'V')).toBeLessThan(0)
        })

        it('standard font widths in PDF dictionary should match AFM data', () => {
            const font = PdfFont.HELVETICA
            const pdfWidths = font.widths
            expect(pdfWidths).toBeDefined()
            // First char is 32 (space), widths[0] should match AFM space width
            expect(pdfWidths![0]).toBe(278)
            // 'A' is char code 65, index 65-32=33
            expect(pdfWidths![33]).toBe(667)
        })

        it('Helvetica should have vertical metrics from AFM', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.ascender).toBe(718)
            expect(m.descender).toBe(-207)
            expect(m.capHeight).toBe(718)
            expect(m.xHeight).toBe(523)
        })

        it('Helvetica should have underline metrics from AFM', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.underlinePosition).toBe(-100)
            expect(m.underlineThickness).toBe(50)
        })

        it('Helvetica should have stem widths from AFM', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.stdHW).toBe(76)
            expect(m.stdVW).toBe(88)
        })

        it('should have font identity metadata from AFM', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.fontName).toBe('Helvetica')
            expect(m.familyName).toBe('Helvetica')
            expect(m.weight).toBe('Medium')
            expect(m.isFixedPitch).toBe(false)
            expect(m.italicAngle).toBe(0)
        })

        it('Courier should be fixed pitch', () => {
            const m = PdfFont.COURIER.metrics!
            expect(m.isFixedPitch).toBe(true)
        })

        it('should have font bounding box from AFM', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.bbox).toEqual({
                llx: -166,
                lly: -225,
                urx: 1000,
                ury: 931,
            })
        })

        it('should have per-glyph metrics', () => {
            const m = PdfFont.HELVETICA.metrics!
            const spaceGlyph = m.getGlyphMetrics(32)
            expect(spaceGlyph).toBeDefined()
            expect(spaceGlyph!.name).toBe('space')
            expect(spaceGlyph!.width).toBe(278)

            const aGlyph = m.getGlyphMetrics(65)
            expect(aGlyph).toBeDefined()
            expect(aGlyph!.name).toBe('A')
            expect(aGlyph!.bbox.urx).toBeGreaterThan(0)
        })

        it('should have glyph name to code mapping', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.glyphNameToCode.get('space')).toBe(32)
            expect(m.glyphNameToCode.get('A')).toBe(65)
        })

        it('should have ligature data on f glyph', () => {
            const m = PdfFont.HELVETICA.metrics!
            // 'f' is char code 102
            const fGlyph = m.getGlyphMetrics(102)
            expect(fGlyph).toBeDefined()
            expect(fGlyph!.ligatures).toBeDefined()
            expect(fGlyph!.ligatures!['i']).toBe('fi')
            expect(fGlyph!.ligatures!['l']).toBe('fl')
        })

        it('getLigature should return ligature glyph name', () => {
            const m = PdfFont.HELVETICA.metrics!
            expect(m.getLigature(102, 'i')).toBe('fi')
            expect(m.getLigature(102, 'l')).toBe('fl')
            expect(m.getLigature(102, 'a')).toBeUndefined()
            expect(m.getLigature(65, 'i')).toBeUndefined()
        })

        it('fromAfm should extract all metadata fields', () => {
            const afm = {
                metadata: {
                    FontName: 'TestFont',
                    FamilyName: 'Test',
                    Weight: 'Bold',
                    ItalicAngle: -12,
                    IsFixedPitch: true,
                    CapHeight: 700,
                    XHeight: 500,
                    Ascender: 750,
                    Descender: -250,
                    UnderlinePosition: -100,
                    UnderlineThickness: 50,
                    StdHW: 80,
                    StdVW: 90,
                },
                bbox: { llx: -10, lly: -200, urx: 1000, ury: 900 },
                charMetrics: [
                    {
                        code: 65,
                        wx: 600,
                        name: 'A',
                        bbox: { llx: 0, lly: 0, urx: 550, ury: 700 },
                        ligatures: { E: 'AE' },
                    },
                ],
                kernPairs: [],
            }
            const m = PdfFontDescriptor.fromAfm(afm)

            expect(m.fontName).toBe('TestFont')
            expect(m.familyName).toBe('Test')
            expect(m.weight).toBe('Bold')
            expect(m.italicAngle).toBe(-12)
            expect(m.isFixedPitch).toBe(true)
            expect(m.capHeight).toBe(700)
            expect(m.xHeight).toBe(500)
            expect(m.ascender).toBe(750)
            expect(m.descender).toBe(-250)
            expect(m.underlinePosition).toBe(-100)
            expect(m.underlineThickness).toBe(50)
            expect(m.stdHW).toBe(80)
            expect(m.stdVW).toBe(90)
            expect(m.bbox).toEqual({ llx: -10, lly: -200, urx: 1000, ury: 900 })

            const glyph = m.getGlyphMetrics(65)
            expect(glyph!.ligatures).toEqual({ E: 'AE' })
            expect(m.glyphNameToCode.get('A')).toBe(65)
        })
    })
})
