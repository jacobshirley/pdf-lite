import { describe, it, expect } from 'vitest'
import { server } from 'vitest/browser'
import { PdfDocument } from '../../src/pdf/pdf-document'
import {
    FontDescriptor,
    UnicodeFontDescriptor,
    CIDWidth,
} from '../../src/fonts/index'
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
        it('should embed Helvetica standard font', async () => {
            const document = new PdfDocument()

            const font = await document.fonts.embedStandardFont('Helvetica')
            expect(font.resourceName).toMatch(/^F\d+$/)
            expect(font.fontName).toBe('Helvetica')
            expect(font.toString()).toBe(font.resourceName)
        })

        it('should embed multiple standard fonts', async () => {
            const document = new PdfDocument()

            const helvetica =
                await document.fonts.embedStandardFont('Helvetica')
            const helveticaBold =
                await document.fonts.embedStandardFont('Helvetica-Bold')
            const times = await document.fonts.embedStandardFont('Times-Roman')

            expect(helvetica.resourceName).toMatch(/^F\d+$/)
            expect(helveticaBold.resourceName).toMatch(/^F\d+$/)
            expect(times.resourceName).toMatch(/^F\d+$/)

            // Should have unique resource names
            expect(helvetica.resourceName).not.toBe(helveticaBold.resourceName)
            expect(helvetica.resourceName).not.toBe(times.resourceName)
            expect(helveticaBold.resourceName).not.toBe(times.resourceName)
        })

        it('should allow embedding same font twice (no deduplication without cache)', async () => {
            const document = new PdfDocument()

            const font1 = await document.fonts.embedStandardFont('Helvetica')
            const font2 = await document.fonts.embedStandardFont('Helvetica')

            // Without cache, same font embedded twice gets different resource names
            expect(font1.resourceName).not.toBe(font2.resourceName)
        })

        it('should embed all 14 standard PDF fonts', async () => {
            const document = new PdfDocument()

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

            const fonts = []
            for (const fontName of standardFonts) {
                const font = await document.fonts.embedStandardFont(fontName)
                fonts.push(font)
            }

            expect(fonts.length).toBe(14)
        })
    })

    describe('TrueType Fonts', () => {
        it('should embed a TrueType font with descriptor', async () => {
            const document = new PdfDocument()

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

            const descriptor: FontDescriptor = {
                fontName: 'CustomFont',
                fontFamily: 'Custom',
                fontWeight: 400,
                flags: 32, // Nonsymbolic
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
            }

            const font = await document.fonts.embedTrueTypeFont(
                mockFontData,
                'CustomFont',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
            expect(font.fontName).toBe('CustomFont')
            expect(font.encoding).toBe('WinAnsiEncoding')
        })

        it('should allow embedding same TrueType font twice (no deduplication)', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: FontDescriptor = {
                fontName: 'CustomFont',
                fontFamily: 'Custom',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
            }

            const font1 = await document.fonts.embedTrueTypeFont(
                mockFontData,
                'CustomFont',
                descriptor,
            )
            const font2 = await document.fonts.embedTrueTypeFont(
                mockFontData,
                'CustomFont',
                descriptor,
            )

            expect(font1.resourceName).not.toBe(font2.resourceName)
        })
    })

    describe('Font Serialization', () => {
        it('should serialize document with embedded fonts', async () => {
            const document = new PdfDocument()

            await document.fonts.embedStandardFont('Helvetica')
            await document.fonts.embedStandardFont('Times-Roman')

            const bytes = document.toBytes()
            expect(bytes.length).toBeGreaterThan(0)

            // Verify the document can be parsed back
            const reparsed = await PdfDocument.fromBytes([bytes])
            expect(reparsed).toBeDefined()
        })
    })

    describe('TrueType Font Width Arrays', () => {
        it('should embed TrueType font with default widths', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: FontDescriptor = {
                fontName: 'TestFont',
                fontFamily: 'Test',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
            }

            const font = await document.fonts.embedTrueTypeFont(
                mockFontData,
                'TestFont',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
        })

        it('should embed TrueType font with custom widths', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: FontDescriptor = {
                fontName: 'CustomWidthFont',
                fontFamily: 'Custom',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
                firstChar: 32,
                lastChar: 36,
                widths: [250, 333, 408, 500, 500], // Custom widths for chars 32-36
            }

            const font = await document.fonts.embedTrueTypeFont(
                mockFontData,
                'CustomWidthFont',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
        })

        it('should embed TrueType font with custom firstChar/lastChar range', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: FontDescriptor = {
                fontName: 'RangeFont',
                fontFamily: 'Range',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
                firstChar: 65, // 'A'
                lastChar: 90, // 'Z'
            }

            const font = await document.fonts.embedTrueTypeFont(
                mockFontData,
                'RangeFont',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
        })
    })

    describe('Unicode/Type0 Fonts', () => {
        it('should embed a Unicode TrueType font', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: UnicodeFontDescriptor = {
                fontName: 'UnicodeFont',
                fontFamily: 'Unicode',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
                defaultWidth: 1000,
            }

            const font = await document.fonts.embedTrueTypeFontUnicode(
                mockFontData,
                'UnicodeFont',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
            expect(font.encoding).toBe('Identity-H')
        })

        it('should embed Unicode font with CID widths', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const cidWidths: CIDWidth[] = [
                { cid: 1, width: 500 },
                { startCid: 10, widths: [600, 700, 800] },
            ]

            const descriptor: UnicodeFontDescriptor = {
                fontName: 'CIDWidthFont',
                fontFamily: 'CID',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
                defaultWidth: 1000,
                cidWidths,
            }

            const font = await document.fonts.embedTrueTypeFontUnicode(
                mockFontData,
                'CIDWidthFont',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
        })

        it('should embed Unicode font with ToUnicode CMap', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: UnicodeFontDescriptor = {
                fontName: 'CMapFont',
                fontFamily: 'CMap',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
            }

            // Unicode mappings: CID -> Unicode code point
            const unicodeMappings = new Map<number, number>([
                [1, 0x0041], // CID 1 -> 'A'
                [2, 0x0042], // CID 2 -> 'B'
                [3, 0x0043], // CID 3 -> 'C'
                [100, 0x4e2d], // CID 100 -> '中'
            ])

            const font = await document.fonts.embedTrueTypeFontUnicode(
                mockFontData,
                'CMapFont',
                descriptor,
                unicodeMappings,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
        })

        it('should not duplicate Unicode font when embedding same font twice', async () => {
            const document = new PdfDocument()

            const mockFontData = new Uint8Array([0x00, 0x01, 0x00, 0x00])

            const descriptor: UnicodeFontDescriptor = {
                fontName: 'DuplicateTest',
                fontFamily: 'Test',
                fontWeight: 400,
                flags: 32,
                fontBBox: [-200, -200, 1000, 900],
                italicAngle: 0,
                ascent: 900,
                descent: -200,
                capHeight: 700,
                stemV: 80,
            }

            const font1 = await document.fonts.embedTrueTypeFontUnicode(
                mockFontData,
                'DuplicateTest',
                descriptor,
            )
            const font2 = await document.fonts.embedTrueTypeFontUnicode(
                mockFontData,
                'DuplicateTest',
                descriptor,
            )

            expect(font1.resourceName).toBe(font2.resourceName)
        })
    })

    describe('Load Existing Fonts', () => {
        it('should load fonts from a document with pages', async () => {
            // Create a document with fonts
            const document = new PdfDocument()
            await document.fonts.embedStandardFont('Helvetica')
            await document.fonts.embedStandardFont('Courier')

            // Get fonts that were embedded
            const embeddedFonts = await document.fonts.getAllFonts()
            expect(embeddedFonts.size).toBe(2)

            const bytes = document.toBytes()

            // Parse the document and load fonts
            const reparsed = await PdfDocument.fromBytes([bytes])
            const loadedFonts = await reparsed.fonts.loadExistingFonts()

            // loadExistingFonts should return a valid Map (may be empty if no pages)
            expect(loadedFonts).toBeInstanceOf(Map)
        })

        it('should return empty map for new document without fonts', async () => {
            const document = new PdfDocument()

            // No fonts initially
            const initialFonts = await document.fonts.loadExistingFonts()
            expect(initialFonts.size).toBe(0)
        })

        it('should track fonts after embedding', async () => {
            const document = new PdfDocument()

            // Embed a font
            await document.fonts.embedStandardFont('Helvetica')

            // getAllFonts should return the embedded font
            const fonts = await document.fonts.getAllFonts()
            expect(fonts.size).toBe(1)
            expect(fonts.has('Helvetica')).toBe(true)
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
            const descriptor = parser.getFontDescriptor()

            expect(descriptor.fontFamily).toBe('Roboto')
            expect(descriptor.fontWeight).toBe(400)
            // Metrics should be scaled to 1000 units
            expect(descriptor.ascent).toBeGreaterThan(0)
            expect(descriptor.descent).toBeLessThan(0)
            expect(descriptor.widths).toBeDefined()
            expect(descriptor.widths!.length).toBe(95) // chars 32-126
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
            const descriptor = parser.getFontDescriptor()

            expect(descriptor.fontFamily).toBe('Source Sans 3')
            expect(descriptor.ascent).toBeGreaterThan(0)
            expect(descriptor.descent).toBeLessThan(0)
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
            const descriptor = parser.getFontDescriptor()

            expect(descriptor.fontFamily).toBe('Roboto')
            expect(descriptor.ascent).toBeGreaterThan(0)
            expect(descriptor.widths).toBeDefined()
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
        it('should embed Roboto TTF in a PDF', async () => {
            const document = new PdfDocument()
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = parseFont(fontData)
            const descriptor = parser.getFontDescriptor('Roboto')

            const font = await document.fonts.embedTrueTypeFont(
                fontData,
                'Roboto',
                descriptor,
            )

            expect(font.resourceName).toMatch(/^F\d+$/)
            const embeddedFont = await document.fonts.getFont('Roboto')
            expect(embeddedFont).toBeDefined()
        })

        it('should serialize PDF with embedded custom font', async () => {
            const document = new PdfDocument()
            const fontData = await loadFont(TTF_FIXTURE)
            const parser = parseFont(fontData)
            const descriptor = parser.getFontDescriptor('Roboto')

            await document.fonts.embedTrueTypeFont(
                fontData,
                'Roboto',
                descriptor,
            )

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

        it('should create a FontDescriptor with scaled metrics', () => {
            const ttfData = createMinimalTtf()
            const parser = new TtfParser(ttfData)
            const descriptor = parser.getFontDescriptor('TestFont')

            expect(descriptor.fontName).toBe('TestFont')
            // Metrics should be scaled to 1000 units (already at 1000, so unchanged)
            expect(descriptor.ascent).toBe(800)
            expect(descriptor.descent).toBe(-200)
            expect(descriptor.fontBBox).toEqual([-100, -200, 800, 900])
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
            const descriptor = parser.getFontDescriptor()

            // Metrics should be scaled from 2000 to 1000
            expect(descriptor.ascent).toBe(800) // 1600 * (1000/2000)
            expect(descriptor.descent).toBe(-200) // -400 * (1000/2000)
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

        it('should create a FontDescriptor with scaled metrics', () => {
            const otfData = createMinimalOtf()
            const parser = new OtfParser(otfData)
            const descriptor = parser.getFontDescriptor('OtfTestFont')

            expect(descriptor.fontName).toBe('OtfTestFont')
            // Metrics should be scaled from 2048 to 1000
            expect(descriptor.ascent).toBe(Math.round((1800 * 1000) / 2048))
            expect(descriptor.descent).toBe(Math.round((-400 * 1000) / 2048))
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
            expect(typeof ttfParser.getFontDescriptor).toBe('function')
            expect(typeof ttfParser.getCharWidths).toBe('function')

            expect(typeof otfParser.getFontInfo).toBe('function')
            expect(typeof otfParser.getFontDescriptor).toBe('function')
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

        it('should return FontDescriptor with all required fields', () => {
            const parser = new TtfParser(createMinimalTtf())
            const descriptor = parser.getFontDescriptor('TestFont')

            expect(descriptor).toHaveProperty('fontName')
            expect(descriptor).toHaveProperty('fontFamily')
            expect(descriptor).toHaveProperty('fontWeight')
            expect(descriptor).toHaveProperty('flags')
            expect(descriptor).toHaveProperty('fontBBox')
            expect(descriptor).toHaveProperty('italicAngle')
            expect(descriptor).toHaveProperty('ascent')
            expect(descriptor).toHaveProperty('descent')
            expect(descriptor).toHaveProperty('capHeight')
            expect(descriptor).toHaveProperty('stemV')
            expect(descriptor).toHaveProperty('firstChar')
            expect(descriptor).toHaveProperty('lastChar')
            expect(descriptor).toHaveProperty('widths')
        })
    })
})
