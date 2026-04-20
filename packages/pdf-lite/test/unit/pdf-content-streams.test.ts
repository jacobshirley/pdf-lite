import { describe, it, expect, beforeAll } from 'vitest'
import { server } from 'vitest/browser'
import { PdfDocument } from '../../src/pdf/pdf-document'
import {
    PdfContentStreamObject,
    TextBlock,
    TextNode,
    GraphicsBlock,
    StateNode,
    VirtualTextBlock,
} from '../../src/graphics/pdf-content-stream'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfFont } from '../../src/fonts/pdf-font'
import { ByteArray } from '../../src/types'
import { MoveToOp } from '../../src/graphics/ops/path'
import { RGBColor } from '../../src/graphics/color'

const FIXTURE = './test/unit/fixtures/multi-child-field.pdf'

const base64ToBytes = (b64: string): ByteArray => {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
}

async function loadFixture(path: string = FIXTURE): Promise<PdfDocument> {
    const b64 = await server.commands.readFile(path, { encoding: 'base64' })
    return await PdfDocument.fromBytes([base64ToBytes(b64)])
}

function makeStream(content: string): PdfContentStreamObject {
    const stream = new PdfStream(content)
    const obj = new PdfIndirectObject({ content: stream })
    return new PdfContentStreamObject(obj)
}

// ---------------------------------------------------------------------------
// Fixture: page structure
// ---------------------------------------------------------------------------
// Fixture tests skipped due to PDF parsing errors (EOF in content stream)
describe('multi-child-field.pdf — page structure', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture()
    })

    it('has exactly 1 page', () => {
        expect(doc.pages.count).toBe(1)
    })

    it('page mediaBox is A4-ish (595.5 × 841.98)', () => {
        const [x0, y0, w, h] = doc.pages.get(0).mediaBox
        expect(x0).toBe(0)
        expect(y0).toBe(0)
        expect(w).toBeCloseTo(595.5, 1)
        expect(h).toBeCloseTo(841.98, 1)
    })
})

// ---------------------------------------------------------------------------
// Fixture: content streams
// ---------------------------------------------------------------------------
// Fixture tests skipped due to PDF parsing errors (EOF in content stream)
describe('multi-child-field.pdf — content streams', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture()
    })

    it('page has at least 1 content stream', () => {
        const streams = doc.pages.get(0).contentStreams
        expect(streams.length).toBeGreaterThanOrEqual(1)
    })

    it('every content stream is a PdfContentStreamObject', () => {
        for (const s of doc.pages.get(0).contentStreams) {
            expect(s).toBeInstanceOf(PdfContentStreamObject)
        }
    })

    it('content streams together contain non-empty text', () => {
        const combined = doc.pages
            .get(0)
            .contentStreams.map((s) => s.dataAsString)
            .join('')
        expect(combined.length).toBeGreaterThan(0)
    })

    it('page exposes font resources', () => {
        const page = doc.pages.get(0)
        const fontMap = page.fontMap
        expect(fontMap.has('TT0')).toBe(true)
        expect(fontMap.has('TT1')).toBe(true)
        expect(fontMap.has('C2_0')).toBe(true)
    })

    it('should have text blocks with correct text', () => {
        const page = doc.pages.get(0)
        const textBlocks = page.contentStreams.flatMap((s) => s.textBlocks)
        const texts = textBlocks.map((tb) => tb.text)
        // PDF is in Italian - check for actual content
        expect(texts).toContain('DELEGA ')
    })
})

describe('template.pdf — content streams', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture('./test/unit/fixtures/template.pdf')
    })

    it('should keep a snapshot of content nodes and their bounding boxes', async () => {
        const page = doc.pages.get(0)
        const textBlocks = page.rawTextBlocks
        const graphicsBlocks = page.rawGraphicsBlocks

        const regroupedBlocks = VirtualTextBlock.regroupTextBlocks(textBlocks)
        const textInfo = regroupedBlocks.map((x) => ({
            text: x.text,
            bbox: x.getWorldBoundingBox(),
        }))

        expect(textInfo).toMatchSnapshot()
        const graphicInfo = graphicsBlocks.map((x) => ({
            bbox: x.getWorldBoundingBox(),
        }))
        expect(graphicInfo).toMatchSnapshot()
    })
})

// ---------------------------------------------------------------------------
// Fixture: nodes parsed from content streams
// ---------------------------------------------------------------------------
// Fixture tests skipped due to PDF parsing errors (EOF in content stream)
describe('multi-child-field.pdf — parsed nodes', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture()
    })

    it('nodes() returns only supported ContentNode types', () => {
        const check = (nodes: any[]) => {
            for (const node of nodes) {
                expect(
                    node instanceof TextBlock ||
                        node instanceof GraphicsBlock ||
                        node instanceof StateNode,
                ).toBe(true)
                if (node.children && node.children.length > 0)
                    check(node.children)
            }
        }
        for (const stream of doc.pages.get(0).contentStreams) {
            check(stream.nodes)
        }
    })

    it('at least one stream contains TextBlock nodes', () => {
        const hasText = doc.pages
            .get(0)
            .contentStreams.some((s) => s.textBlocks.length > 0)
        expect(hasText).toBe(true)
    })

    it('textBlocks are found recursively from the tree', () => {
        for (const stream of doc.pages.get(0).contentStreams) {
            const textBlocks = stream.textBlocks
            for (const tb of textBlocks) {
                expect(tb).toBeInstanceOf(TextBlock)
            }
        }
    })

    it('graphicsBlocks are found recursively from the tree', () => {
        for (const stream of doc.pages.get(0).contentStreams) {
            const graphicsBlocks = stream.graphicsBlocks
            for (const gb of graphicsBlocks) {
                expect(gb).toBeInstanceOf(GraphicsBlock)
            }
        }
    })
})

// ---------------------------------------------------------------------------
// Programmatic construction — add() and dataAsString round-trip
// ---------------------------------------------------------------------------
describe('PdfContentStreamObject.add() and dataAsString', () => {
    it('add() appends a node to the stream', () => {
        const s = makeStream('')
        const block = new TextBlock()
        const text = new TextNode()
        text.font = PdfFont.HELVETICA
        text.fontSize = 12
        text.text = 'Hello'
        block.addSegment(text)
        s.add(block)
        expect(s.dataAsString).toContain('/F1 12 Tf')
        expect(s.dataAsString).toContain('(Hello) Tj')
    })

    it('add() appends multiple nodes sequentially', () => {
        const s = makeStream('')
        const a = new GraphicsBlock()
        a.moveTo(10, 10)
        a.lineTo(100, 10)
        a.stroke()
        const b = new GraphicsBlock()
        b.moveTo(10, 20)
        b.lineTo(100, 20)
        b.stroke()
        s.add(a)
        s.add(b)
        const lines = s.dataAsString.trim().split('\n')
        expect(lines).toHaveLength(6)
    })
})

// ---------------------------------------------------------------------------
// nodes() parser — TextBlock
// ---------------------------------------------------------------------------
describe('PdfContentStreamObject.nodes() — TextBlock parsing', () => {
    it('parses a BT/ET block as a single TextBlock', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const nodes = s.nodes
        expect(nodes).toHaveLength(1)
        expect(nodes[0]).toBeInstanceOf(TextBlock)
    })

    it('parsed TextBlock ops contain the Tf instruction', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.nodes[0] as TextBlock
        expect(tb.toString()).toContain('/F1 12 Tf')
    })

    it('parsed TextBlock ops contain the Tj instruction', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        expect(tb.toString()).toContain('Tj')
    })

    it('parses two BT/ET blocks as two TextBlocks', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (Hello) Tj ET\nBT /F1 12 Tf 100 680 Td (World) Tj ET',
        )
        expect(s.textBlocks).toHaveLength(2)
    })

    it('empty BT/ET produces no nodes', () => {
        const s = makeStream('BT ET')
        expect(s.nodes).toHaveLength(0)
    })
})

// ---------------------------------------------------------------------------
// nodes() parser — GraphicsBlock
// ---------------------------------------------------------------------------
describe('PdfContentStreamObject.nodes() — GraphicsBlock parsing', () => {
    it('parses a simple move/line/stroke as a GraphicsBlock', () => {
        const s = makeStream('10 10 m 100 10 l S')
        const nodes = s.nodes
        expect(nodes).toHaveLength(1)
        expect(nodes[0]).toBeInstanceOf(GraphicsBlock)
    })

    it('parsed GraphicsBlock ops contain the m operator', () => {
        const s = makeStream('10 10 m 100 10 l S')
        const gb = s.graphicsBlocks[0]
        expect(gb.ops.some((op) => op instanceof MoveToOp)).toBe(true)
    })

    it('each paint operator (S, f, B) ends a separate GraphicsBlock', () => {
        const s = makeStream('10 10 m 100 10 l S 20 20 m 200 20 l f')
        expect(s.graphicsBlocks).toHaveLength(2)
    })

    it('stream with only text has no graphicsBlocks', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        expect(s.graphicsBlocks).toHaveLength(0)
    })

    it('stream with only graphics has no textBlocks', () => {
        const s = makeStream('10 10 m 100 10 l S')
        expect(s.textBlocks).toHaveLength(0)
    })
})

describe('TextBlock', () => {
    it('should be able to read text from a TextBlock', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        expect(tb.text).toBe('Hello')
    })

    it('should read text from a hex string Tj', () => {
        // <00480065006C006C006F> = "Hello" as 2-byte CIDs
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td <00480065006C006C006F> Tj ET',
        )
        const tb = s.textBlocks[0]
        expect(tb.text).toBe('Hello')
    })

    it('should read text from a TJ array', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td [(Hello) -10 ( World)] TJ ET',
        )
        const tb = s.textBlocks[0]
        expect(tb.text).toBe('Hello World')
    })

    it('should preserve spaces inside literal strings', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello World) Tj ET')
        const tb = s.textBlocks[0]
        expect(tb.text).toBe('Hello World')
    })

    it('should preserve a single-space literal string', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td ( ) Tj ET')
        const tb = s.textBlocks[0]
        expect(tb.text).toBe(' ')
    })

    it('should decode escaped parentheses in Tj', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (\\(BLOCK CAPITALS\\)) Tj ET',
        )
        const tb = s.textBlocks[0]
        expect(tb.text).toBe('(BLOCK CAPITALS)')
    })

    it('should decode split escaped-paren Tj ops like template.pdf', () => {
        // Simulates the real pattern: (\(B)Tj ... (LOCK)Tj ... (\))Tj
        const s = makeStream(
            'BT /TT1 1 Tf 12 0 0 12 36 702 Tm (\\(B) Tj 8.4 0 0 8.4 48 702 Tm (LOCK) Tj 12 0 0 12 70 702 Tm ( ) Tj (C) Tj 8.4 0 0 8.4 82 702 Tm [(APIT) 74.4 (ALS)] TJ 12 0 0 12 116 702 Tm (\\)) Tj ET',
        )
        const tb = s.textBlocks[0]
        expect(tb.text).toContain('(B')
        expect(tb.text).toContain('LOCK')
        expect(tb.text).toContain(' ')
        expect(tb.text).toContain('CAPITALS')
        expect(tb.text).toContain(')')
    })

    it('should have lines for each text segment', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.nodes[0] as TextBlock
        expect(tb.getSegments()).toHaveLength(1)
        expect(tb.getSegments()[0]).toBeInstanceOf(TextNode)
        expect(tb.getSegments()[0].text).toBe('Hello')
    })

    it('should split multi-line BT blocks into separate lines', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (Line1) Tj 0 -14 Td (Line2) Tj ET',
        )
        // Per-line splitting: use regroupTextBlocksByLine() to split by visual lines
        const regrouped = VirtualTextBlock.regroupTextBlocks(s.textBlocks)
        expect(regrouped).toHaveLength(2)
        const tb1 = regrouped[0] as TextBlock
        const tb2 = regrouped[1] as TextBlock
        expect(tb1.getSegments()).toHaveLength(1)
        expect(tb1.getSegments()[0].text).toBe('Line1')
        expect(tb2.getSegments()).toHaveLength(1)
        expect(tb2.getSegments()[0].text).toBe('Line2')
    })

    it('getLocalTransform returns identity (container)', () => {
        const s = makeStream('BT /F1 12 Tf 9 0 0 9 100 700 Tm (Hello) Tj ET')
        const tb = s.nodes[0] as TextBlock
        const tm = tb.getLocalTransform()
        expect(tm.a).toBe(1)
        expect(tm.d).toBe(1)
        expect(tm.e).toBe(0)
        expect(tm.f).toBe(0)
        // Segment carries the actual transform
        const segTm = tb.getSegments()[0].getLocalTransform()
        expect(segTm.e).toBeCloseTo(100, 0)
        expect(segTm.f).toBeCloseTo(700, 0)
    })

    it('text getter concatenates all lines', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (Hello) Tj 0 -14 Td ( World) Tj ET',
        )
        // Per-line splitting: use regroupTextBlocksByLine() to split by visual lines
        const regrouped = VirtualTextBlock.regroupTextBlocks(s.textBlocks)
        expect(regrouped).toHaveLength(2)
        const tb1 = regrouped[0] as TextBlock
        const tb2 = regrouped[1] as TextBlock
        expect(tb1.text).toBe('Hello')
        expect(tb2.text).toBe(' World')
    })

    it('toString() preserves << >> dictionary delimiters in marked content', () => {
        const s = makeStream(
            'BT /P <</MCID 3 >>BDC /F1 12 Tf 100 700 Td (Hello) Tj EMC ET',
        )
        const tb = s.textBlocks[0]
        const str = tb.toString()
        expect(str).not.toContain('< <')
        expect(str).not.toContain('> >')
        expect(str).toContain('<<')
        expect(str).toContain('>>')
    })

    it('moveBy shifts all segments uniformly without double-shifting', () => {
        // 3 segments: first has Tm, rest rely on text advance (no Tm/Td)
        const s = makeStream(
            'BT /F1 10 Tf 1 0 0 1 100 700 Tm (A) Tj (B) Tj (C) Tj ET',
        )
        const tb = s.textBlocks[0]
        const segs = tb.getSegments()
        expect(segs).toHaveLength(3)

        // Record original positions
        const origPositions = segs.map((seg) => {
            const tm = seg.getLocalTransform()
            return { x: tm.e, y: tm.f }
        })

        // Move by (50, -20)
        tb.moveBy(50, -20)

        // After move, each segment should be shifted by exactly (50, -20)
        const newSegs = tb.getSegments()
        for (let i = 0; i < newSegs.length; i++) {
            const tm = newSegs[i].getLocalTransform()
            expect(tm.e).toBeCloseTo(origPositions[i].x + 50, 5)
            expect(tm.f).toBeCloseTo(origPositions[i].y + -20, 5)
        }
    })
})

describe('TextBlock mutations propagate to content stream', () => {
    it('nodes are cached across accesses', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const nodes1 = s.nodes
        const nodes2 = s.nodes
        expect(nodes1).toBe(nodes2)
        expect(nodes1[0]).toBe(nodes2[0])
    })

    it('textBlock.text update is reflected in stream dataAsString', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.text = 'World'
        expect(s.dataAsString).not.toContain('Hello')
        // Re-read textBlocks from the stream to verify the mutation persists
        expect(s.textBlocks[0].text).toBe('World')
    })

    it('textBlock.text update persists through toBytes round-trip', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.text = 'Updated'
        const bytes = s.toBytes()
        const str = new TextDecoder().decode(bytes)
        expect(str).not.toContain('Hello')
        expect(str).toContain('Updated')
    })

    it('multiple textBlock updates are all reflected', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (Hello) Tj ET\nBT /F1 12 Tf 100 680 Td (World) Tj ET',
        )
        const blocks = s.textBlocks
        blocks[0].text = 'Foo'
        blocks[1].text = 'Bar'
        expect(s.dataAsString).not.toContain('Hello')
        expect(s.dataAsString).not.toContain('World')
        expect(s.textBlocks[0].text).toBe('Foo')
        expect(s.textBlocks[1].text).toBe('Bar')
    })
})

describe('TextBlock.text setter', () => {
    it('should replace simple Tj text', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.text = 'World'
        expect(tb.text).toBe('World')
        expect(tb.toString()).toContain('TJ')
    })

    it('should replace TJ array text', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td [(He) -10 (llo)] TJ ET')
        const tb = s.textBlocks[0]
        tb.text = 'Goodbye'
        expect(tb.text).toBe('Goodbye')
    })

    it('should preserve non-text ops like Tf and Td', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.text = 'New'
        const str = tb.toString()
        expect(str).toContain('/F1 12 Tf')
        expect(str).toContain('100 700 Td')
    })

    it('should collapse multiple segments into one', () => {
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (A) Tj (B) Tj (C) Tj ET',
        )
        const tb = s.textBlocks[0]
        expect(tb.getSegments()).toHaveLength(3)
        tb.text = 'ABC'
        // After setting text, extra segments are removed
        expect(tb.getSegments()).toHaveLength(1)
        expect(tb.text).toBe('ABC')
    })

    it('should handle empty string', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.text = ''
        expect(tb.text).toBe('')
    })

    it('should handle special PDF characters', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.text = 'Hello (World)'
        expect(tb.text).toBe('Hello (World)')
    })

    it('should create a segment when block has none', () => {
        const tb = new TextBlock()
        tb.text = 'Created'
        expect(tb.text).toBe('Created')
        expect(tb.getSegments()).toHaveLength(1)
    })

    it('should add text op when no existing text op in segment', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td ET')
        const tb = s.textBlocks[0]
        // The segment has Tf and Td but no Tj
        tb.text = 'Inserted'
        expect(tb.text).toBe('Inserted')
    })
})

describe('Text.font and Text.fontSize setters', () => {
    it('should set font on a text segment', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const seg = s.textBlocks[0].getSegments()[0]
        expect(seg.fontSize).toBe(12)

        seg.font = PdfFont.COURIER
        const str = seg.ops.toString()
        expect(str).toContain(`/${PdfFont.COURIER.resourceName} 12 Tf`)
    })

    it('should preserve fontSize when setting font', () => {
        const s = makeStream('BT /F1 24 Tf 100 700 Td (Hello) Tj ET')
        const seg = s.textBlocks[0].getSegments()[0]
        seg.font = PdfFont.TIMES_ROMAN
        expect(seg.fontSize).toBe(24)
    })

    it('should set fontSize on a text segment', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const seg = s.textBlocks[0].getSegments()[0]
        seg.fontSize = 24
        expect(seg.fontSize).toBe(24)
        const str = seg.ops.toString()
        expect(str).toContain('/F1 24 Tf')
    })

    it('should preserve font when setting fontSize', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const seg = s.textBlocks[0].getSegments()[0]
        seg.fontSize = 36
        const str = seg.ops.toString()
        expect(str).toContain('/F1 36 Tf')
    })

    it('should prepend Tf when segment has no existing Tf', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (Hello) Tj 0 -14 Td (Line2) Tj ET',
        )
        const regrouped = VirtualTextBlock.regroupTextBlocks(s.textBlocks)
        const segs = regrouped[1].getSegments()
        const seg = segs[0]
        // This segment inherits font from prev, has no own Tf
        seg.fontSize = 18
        const str = seg.ops.toString()
        expect(str).toContain('18 Tf')
    })
})

// ---------------------------------------------------------------------------
// Static factory helpers — GraphicsBlock
// ---------------------------------------------------------------------------
describe('GraphicsBlock static factories', () => {
    it('line() creates a GraphicsBlock with two path ops and a stroke', () => {
        const block = GraphicsBlock.line({ x1: 0, y1: 0, x2: 100, y2: 0 })
        expect(block).toBeInstanceOf(GraphicsBlock)
        const ops = block.ops.toString()
        expect(ops).toContain('m')
        expect(ops).toContain('l')
        expect(ops).toContain('S')
    })

    it('line() applies rgb color when provided', () => {
        const block = GraphicsBlock.line({
            x1: 0,
            y1: 0,
            x2: 100,
            y2: 0,
            rgb: [1, 0, 0],
        })
        expect(block.ops.toString()).toContain('1 0 0 rg')
    })

    it('rectangle() with fill uses f operator', () => {
        const block = GraphicsBlock.rectangle({
            x: 10,
            y: 10,
            width: 100,
            height: 50,
            fill: true,
        })
        expect(block.ops.toString()).toContain('f')
    })

    it('rectangle() without fill uses S operator', () => {
        const block = GraphicsBlock.rectangle({
            x: 10,
            y: 10,
            width: 100,
            height: 50,
        })
        expect(block.ops.toString()).toContain('S')
    })

    it('ellipse() creates a GraphicsBlock', () => {
        const block = GraphicsBlock.ellipse({
            x: 50,
            y: 50,
            radiusX: 30,
            radiusY: 20,
        })
        expect(block).toBeInstanceOf(GraphicsBlock)
    })
})

// ---------------------------------------------------------------------------
// AT_Verf19E_EU.pdf — regrouping correctness
// ---------------------------------------------------------------------------
describe('AT_Verf19E_EU.pdf — regrouped text blocks', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture('./test/unit/fixtures/AT_Verf19E_EU.pdf')
    })

    it('splits "State the reasons" / "and" / "detailed summary" into separate blocks', () => {
        const page = doc.pages.get(1)
        const textBlocks = page.rawTextBlocks
        const regrouped = VirtualTextBlock.regroupTextBlocks(textBlocks)
        const texts = regrouped.map((x) => x.text)

        // "and " (bold font 152/0) should NOT be merged with the
        // italic 154/0 text before and after it
        expect(texts).toContain('State the reasons ')
        expect(texts).toContain('and ')
        expect(texts).toContain(
            'detailed summary of the business activity in Austria, name clients, ',
        )
        // The old bug merged all three into one block
        expect(
            texts.some(
                (t) =>
                    t.includes('State the reasons') && t.includes('detailed'),
            ),
        ).toBe(false)
    })

    it('splits "Yes" and "No" when they are separate text segments', () => {
        const page = doc.pages.get(1)
        const textBlocks = page.rawTextBlocks
        const regrouped = VirtualTextBlock.regroupTextBlocks(textBlocks)
        const texts = regrouped.map((x) => x.text)

        // Lines where Yes and No are separate Tj ops should be split
        const yesCount = texts.filter((t) => t === 'Yes').length
        const noCount = texts.filter((t) => t === 'No').length
        expect(yesCount).toBeGreaterThanOrEqual(2)
        expect(noCount).toBeGreaterThanOrEqual(2)
    })
})

describe('AT_Verf19E_EU.pdf — moveBy preserves segment cohesion', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture('./test/unit/fixtures/AT_Verf19E_EU.pdf')
    })

    it('moving "Identification" block keeps segments together', () => {
        // Find the page with "Identification"
        let page, blocks, idBlock
        for (let p = 0; p < doc.pages.count; p++) {
            page = doc.pages.get(p)
            blocks = page.textBlocks
            idBlock = blocks.find((b) => b.text.includes('Identification'))
            if (idBlock) break
        }
        expect(idBlock).toBeDefined()

        const segs = idBlock!.getSegments()
        // Record world positions of all segments before move
        const before = segs.map((s) => {
            const wt = s.getWorldTransform()
            return { e: wt.e, f: wt.f, text: s.text }
        })

        // Move by (50, -30)
        idBlock!.moveBy(50, -30)

        // Check that every segment shifted by the same (50, -30)
        for (let i = 0; i < segs.length; i++) {
            const wt = segs[i].getWorldTransform()
            expect(wt.e).toBeCloseTo(before[i].e + 50, 0)
            expect(wt.f).toBeCloseTo(before[i].f - 30, 0)
        }
    })

    it('moving one block does not displace other blocks on the page', async () => {
        const doc2 = await loadFixture('./test/unit/fixtures/AT_Verf19E_EU.pdf')
        let page: any, blocks: any, idBlock: any
        let idIdx = -1
        for (let p = 0; p < doc2.pages.count; p++) {
            page = doc2.pages.get(p)
            blocks = page.textBlocks
            idIdx = blocks.findIndex((b: any) =>
                b.text.includes('Identification'),
            )
            if (idIdx !== -1) {
                idBlock = blocks[idIdx]
                break
            }
        }
        expect(idBlock).toBeDefined()

        // Snapshot EVERY block's segment positions before the move
        type Snap = {
            blockIdx: number
            segIdx: number
            e: number
            f: number
            text: string
        }
        const before: Snap[] = []
        for (let bi = 0; bi < blocks.length; bi++) {
            const segs = blocks[bi].getSegments()
            for (let si = 0; si < segs.length; si++) {
                const wt = segs[si].getWorldTransform()
                before.push({
                    blockIdx: bi,
                    segIdx: si,
                    e: wt.e,
                    f: wt.f,
                    text: segs[si].text,
                })
            }
        }

        idBlock!.moveBy(50, -30)

        // Check all blocks after move
        const displaced: string[] = []
        let snapIdx = 0
        for (let bi = 0; bi < blocks.length; bi++) {
            const segs = blocks[bi].getSegments()
            for (let si = 0; si < segs.length; si++) {
                const snap = before[snapIdx++]
                const wt = segs[si].getWorldTransform()
                if (bi === idIdx) {
                    // Moved block: should shift by (50, -30)
                    if (
                        Math.abs(wt.e - (snap.e + 50)) > 1 ||
                        Math.abs(wt.f - (snap.f + -30)) > 1
                    ) {
                        displaced.push(
                            `MOVED block[${bi}].seg[${si}] "${snap.text}": expected (${snap.e + 50},${snap.f - 30}) got (${wt.e.toFixed(1)},${wt.f.toFixed(1)})`,
                        )
                    }
                } else {
                    // Non-moved block: should NOT move
                    if (
                        Math.abs(wt.e - snap.e) > 0.5 ||
                        Math.abs(wt.f - snap.f) > 0.5
                    ) {
                        displaced.push(
                            `block[${bi}].seg[${si}] "${snap.text}": expected (${snap.e.toFixed(1)},${snap.f.toFixed(1)}) got (${wt.e.toFixed(1)},${wt.f.toFixed(1)})`,
                        )
                    }
                }
            }
        }

        expect(displaced).toEqual([])
    })

    it('moving one block does not displace others after round-trip', async () => {
        // Load two copies: one pristine for "before" snapshot, one to mutate
        const pristine = await loadFixture(
            './test/unit/fixtures/AT_Verf19E_EU.pdf',
        )
        const mutated = await loadFixture(
            './test/unit/fixtures/AT_Verf19E_EU.pdf',
        )

        // Find the target page in both copies
        let pPage: any, pBlocks: any
        for (let p = 0; p < pristine.pages.count; p++) {
            pPage = pristine.pages.get(p)
            pBlocks = pPage.textBlocks
            if (pBlocks.some((b: any) => b.text.includes('Identification')))
                break
        }
        let mPage: any,
            mBlocks: any,
            mIdBlock: any,
            mPageIdx = 0
        for (let p = 0; p < mutated.pages.count; p++) {
            mPage = mutated.pages.get(p)
            mBlocks = mPage.textBlocks
            mIdBlock = mBlocks.find((b: any) =>
                b.text.includes('Identification'),
            )
            if (mIdBlock) {
                mPageIdx = p
                break
            }
        }
        expect(mIdBlock).toBeDefined()

        // Snapshot pristine positions keyed by text+position (handles duplicates)
        type PristineSnap = {
            e: number
            f: number
            text: string
            used: boolean
        }
        const pristineSnaps: PristineSnap[] = []
        for (const b of pBlocks) {
            for (const s of b.getSegments()) {
                const wt = s.getWorldTransform()
                pristineSnaps.push({
                    e: wt.e,
                    f: wt.f,
                    text: s.text,
                    used: false,
                })
            }
        }

        // Collect moved segment texts WITH their pristine positions
        const movedSegs = mIdBlock!.getSegments()
        const movedPristinePositions = movedSegs.map((s: any) => {
            const wt = s.getWorldTransform()
            return { text: s.text, origE: wt.e, origF: wt.f }
        })

        const dx = 50,
            dy = -30
        mIdBlock!.moveBy(dx, dy)

        // Round-trip
        const bytes = mutated.toBytes()
        const reloaded = await PdfDocument.fromBytes([bytes])
        const rPage = reloaded.pages.get(mPageIdx)
        const rBlocks = rPage.textBlocks

        // Find closest pristine match for a reloaded segment
        const findClosestPristine = (
            text: string,
            targetE: number,
            targetF: number,
        ): PristineSnap | null => {
            let best: PristineSnap | null = null
            let bestDist = Infinity
            for (const snap of pristineSnaps) {
                if (snap.used || snap.text !== text) continue
                const dist = Math.hypot(snap.e - targetE, snap.f - targetF)
                if (dist < bestDist) {
                    bestDist = dist
                    best = snap
                }
            }
            return best
        }

        const displaced: string[] = []
        // Build a set of moved texts with their expected post-move positions
        const movedExpected = new Map<string, { e: number; f: number }[]>()
        for (const mp of movedPristinePositions) {
            if (!mp) continue
            const arr = movedExpected.get(mp.text) ?? []
            arr.push({ e: mp.origE + dx, f: mp.origF + dy })
            movedExpected.set(mp.text, arr)
        }

        for (const b of rBlocks) {
            for (const s of b.getSegments()) {
                const wt = s.getWorldTransform()
                const movedArr = movedExpected.get(s.text)

                if (movedArr && movedArr.length > 0) {
                    // This might be a moved segment — find closest expected position
                    let closestIdx = 0
                    let closestDist = Infinity
                    for (let i = 0; i < movedArr.length; i++) {
                        const dist = Math.hypot(
                            wt.e - movedArr[i].e,
                            wt.f - movedArr[i].f,
                        )
                        if (dist < closestDist) {
                            closestDist = dist
                            closestIdx = i
                        }
                    }
                    if (closestDist < 5) {
                        // Matches a moved segment — consume it
                        movedArr.splice(closestIdx, 1)
                        continue
                    }
                }

                // Non-moved segment: match to closest pristine snap at same position
                const match = findClosestPristine(s.text, wt.e, wt.f)
                if (match) {
                    match.used = true
                    if (
                        Math.abs(wt.e - match.e) > 1 ||
                        Math.abs(wt.f - match.f) > 1
                    ) {
                        displaced.push(
                            `"${s.text}": expected (${match.e.toFixed(1)},${match.f.toFixed(1)}) got (${wt.e.toFixed(1)},${wt.f.toFixed(1)})`,
                        )
                    }
                }
            }
        }

        expect(displaced).toEqual([])
    })

    it('moving "Identification" round-trips correctly', async () => {
        const doc2 = await loadFixture('./test/unit/fixtures/AT_Verf19E_EU.pdf')
        let page: any, blocks: any, idBlock: any
        for (let p = 0; p < doc2.pages.count; p++) {
            page = doc2.pages.get(p)
            blocks = page.textBlocks
            idBlock = blocks.find((b: any) => b.text.includes('Identification'))
            if (idBlock) break
        }
        expect(idBlock).toBeDefined()

        const segsBefore = idBlock!.getSegments()
        const beforePositions = segsBefore.map((s: any) => {
            const wt = s.getWorldTransform()
            return { e: wt.e, f: wt.f, text: s.text }
        })

        idBlock!.moveBy(50, -30)

        // Round-trip
        const bytes = doc2.toBytes()
        const reloaded = await PdfDocument.fromBytes([bytes])
        let found: any
        for (let p = 0; p < reloaded.pages.count; p++) {
            const rp = reloaded.pages.get(p)
            const reloadedBlocks = rp.textBlocks
            found = reloadedBlocks.find((b: any) =>
                b.text.includes('Identification'),
            )
            if (found) break
        }
        expect(found).toBeDefined()

        const segsAfter = found!.getSegments()
        // Each segment should have moved by exactly (50, -30)
        for (
            let i = 0;
            i < Math.min(beforePositions.length, segsAfter.length);
            i++
        ) {
            const wt = segsAfter[i].getWorldTransform()
            expect(wt.e).toBeCloseTo(beforePositions[i].e + 50, 0)
            expect(wt.f).toBeCloseTo(beforePositions[i].f - 30, 0)
        }
    })

    it('moving "Company/Business name" block keeps all 7 segments together', async () => {
        const doc2 = await loadFixture('./test/unit/fixtures/AT_Verf19E_EU.pdf')
        const page = doc2.pages.get(0)
        const blocks = page.textBlocks
        const target = blocks.find((b: any) =>
            b.text.includes('Company/Business name'),
        )
        expect(target).toBeDefined()

        const segs = target!.getSegments()
        expect(segs.length).toBe(7)

        const before = segs.map((s: any) => {
            const wt = s.getWorldTransform()
            return { e: wt.e, f: wt.f }
        })

        target!.moveBy(50, -30)

        // All 7 segments must shift by exactly (50, -30)
        for (let i = 0; i < segs.length; i++) {
            const wt = segs[i].getWorldTransform()
            expect(wt.e).toBeCloseTo(before[i].e + 50, 0)
            expect(wt.f).toBeCloseTo(before[i].f - 30, 0)
        }

        // Re-extract: the block must still be a single block
        const blocks2 = page.textBlocks
        const target2 = blocks2.find((b: any) =>
            b.text.includes('Company/Business name'),
        )
        expect(target2).toBeDefined()
        expect(target2!.text).toContain('registration certificate')
        expect(target2!.text).toContain('Federal State')
        expect(target2!.getSegments().length).toBe(7)
    })
})

describe('CA_GST_RC1 — Page 13 of 13 debug', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture('./test/unit/fixtures/CA_GST_RC1-19e.pdf')
    })

    it('Page 13 of 13 bbox covers the full text', () => {
        const lastPage = doc.pages.get(doc.pages.count - 1)
        const textBlocks = lastPage.rawTextBlocks
        const regrouped = VirtualTextBlock.regroupTextBlocks(textBlocks)
        const pageBlock = regrouped.find((b) => b.text === 'Page 13 of 13')
        expect(pageBlock).toBeDefined()

        const bbox = pageBlock!.getWorldBoundingBox()
        // Width should cover at least 50pt at 8pt scale (13 chars)
        expect(bbox.width).toBeGreaterThan(49)
        // Height should be reasonable for 8pt font
        expect(bbox.height).toBeGreaterThan(7)
        expect(bbox.height).toBeLessThan(15)
    })
})

// ---------------------------------------------------------------------------
// Real PDF text editing — full round-trip tests
// ---------------------------------------------------------------------------
describe('real PDF text editing round-trip', () => {
    // multi-child-field.pdf has a single content stream — use it as the
    // simple case; template.pdf has 8 streams (the multi-stream case).
    describe('multi-stream page (template.pdf)', () => {
        let doc: PdfDocument

        beforeAll(async () => {
            doc = await loadFixture('./test/unit/fixtures/template.pdf')
        })

        it('page has multiple content streams before consolidation', () => {
            const page = doc.pages.get(0)
            expect(page.contentStreams.length).toBeGreaterThan(1)
        })

        it('getTextBlocks segments are live references into the content stream', () => {
            const page = doc.pages.get(0)
            const blocks = page.textBlocks
            expect(blocks.length).toBeGreaterThan(0)

            for (const block of blocks) {
                for (const seg of block.getSegments()) {
                    expect(seg.parent).toBeDefined()
                    expect(seg.parent).toBeInstanceOf(TextBlock)
                }
            }
        })

        it('editText modifies the content stream dataAsString immediately', async () => {
            const doc2 = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc2.pages.get(0)
            const blocks = page.textBlocks

            // Find a text block with identifiable text
            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()
            const originalText = target!.text

            // Edit it
            target!.text = 'CHANGED_TEXT_12345'

            // The content stream should reflect the change immediately
            const stream = page.contentStreams[0]
            const after = stream.dataAsString
            expect(after).not.toContain(originalText)
        })

        it('editText survives toBytes round-trip', async () => {
            const doc2 = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc2.pages.get(0)
            const blocks = page.textBlocks

            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            target!.text = 'ROUNDTRIP_TEST'

            // Serialize and reload
            const bytes = doc2.toBytes()
            const reloaded = await PdfDocument.fromBytes([bytes])
            const reloadedPage = reloaded.pages.get(0)
            const reloadedBlocks = reloadedPage.textBlocks
            const found = reloadedBlocks.find((b) =>
                b.text.includes('ROUNDTRIP_TEST'),
            )
            expect(found).toBeDefined()
        })

        it('moveBy survives toBytes round-trip', async () => {
            const doc2 = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc2.pages.get(0)
            const blocks = page.textBlocks

            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            const originalText = target!.text
            const segBefore = target!.getSegments()[0]
            const tmBefore = segBefore.getWorldTransform()

            target!.moveBy(50, -30)

            // Serialize and reload
            const bytes = doc2.toBytes()
            const reloaded = await PdfDocument.fromBytes([bytes])
            const reloadedPage = reloaded.pages.get(0)
            const reloadedBlocks = reloadedPage.textBlocks

            // Find the block with matching text content
            const found = reloadedBlocks.find((b) => b.text === originalText)
            expect(found).toBeDefined()

            const segAfter = found!.getSegments()[0]
            const tmAfter = segAfter.getWorldTransform()
            expect(tmAfter.e).toBeCloseTo(tmBefore.e + 50, 0)
            expect(tmAfter.f).toBeCloseTo(tmBefore.f - 30, 0)
        })
    })

    // template.pdf likely has a single content stream
    describe('single-stream page (template.pdf)', () => {
        it('getTextBlocks segments are live references to content-stream nodes', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)

            // template.pdf has multiple content streams
            expect(page.contentStreams.length).toBeGreaterThan(1)

            // Use rawTextBlocks to get actual TextBlock instances (not
            // VirtualTextBlocks produced by regrouping).
            const blocks = page.rawTextBlocks
            expect(blocks.length).toBeGreaterThan(0)

            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            const segs = target!.getSegments()
            expect(segs.length).toBeGreaterThan(0)

            const seg = segs[0]
            expect(seg.parent).toBeInstanceOf(TextBlock)

            // The unified node tree's TextBlocks should contain the seg's parent.
            const allBlocks = page.rawTextBlocks
            const found = allBlocks.find((b) => b === seg.parent)
            expect(found).toBeDefined()
        })

        it('editText modifies the real parent ops', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)
            const blocks = page.textBlocks

            const target = blocks.find((b) => b.text.trim().length > 3)!
            const seg = target.getSegments()[0]
            const parentBlock = seg.parent! as TextBlock

            const oldText = parentBlock.text
            expect(oldText.length).toBeGreaterThan(0)

            target.text = 'EDITED_VALUE'

            // The real parent's serialization should change
            const newStr = parentBlock.toString()
            expect(newStr).not.toContain(oldText.slice(0, 10))
        })

        it('editText modifies content stream dataAsString immediately', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)

            const blocks = page.textBlocks
            const target = blocks.find((b) => b.text.trim().length > 3)!
            const originalText = target.text

            target.text = 'SINGLE_STREAM_EDIT_TEST'

            // After consolidation, stream[0] has all nodes.
            // dataAsString should reflect the edit.
            const stream = page.contentStreams[0]
            const after = stream.dataAsString
            expect(after).not.toContain(originalText)
        })

        it('editText survives toBytes round-trip', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)
            const blocks = page.textBlocks
            expect(blocks.length).toBeGreaterThan(0)

            // Pick the first non-empty block
            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            target!.text = 'SINGLE_STREAM_EDIT'

            // Serialize and reload
            const bytes = doc.toBytes()
            const reloaded = await PdfDocument.fromBytes([bytes])
            const reloadedPage = reloaded.pages.get(0)
            const reloadedBlocks = reloadedPage.textBlocks
            const found = reloadedBlocks.find((b) =>
                b.text.includes('SINGLE_STREAM_EDIT'),
            )
            expect(found).toBeDefined()
        })
    })

    it('moveBy preserves TL side-effect when stripping TD ops', async () => {
        // CA_BC_PST_Registration.pdf uses TD (MoveTextLeadingOp) which sets TL.
        // When moveBy converts TD to absolute Tm, the TL side-effect must be
        // preserved as an explicit TL op, otherwise later T* ops in sibling
        // segments produce overlapping text.
        const doc = await loadFixture(
            './test/unit/fixtures/CA_BC_PST_Registration.pdf',
        )
        const page = doc.pages.get(0)
        const blocks = page.textBlocks

        // Find "Provincial Sales Tax Act" in the paragraph (block 7)
        const pstBlock = blocks.find(
            (b) =>
                b.text.includes('Provincial Sales Tax Act') &&
                b.getWorldBoundingBox().y > 700,
        )
        expect(pstBlock).toBeDefined()

        // Snapshot all block positions before the move
        const before = blocks.map((b) => {
            const wb = b.getWorldBoundingBox()
            return { text: b.text.substring(0, 40), x: wb.x, y: wb.y }
        })

        pstBlock!.moveBy(10, 10)

        // Round-trip: serialize and reload
        const bytes = doc.toBytes()
        const reloaded = await PdfDocument.fromBytes([bytes])
        const rPage = reloaded.pages.get(0)
        const rBlocks = rPage.textBlocks

        // All blocks should survive the round-trip (no block loss)
        expect(rBlocks.length).toBe(blocks.length)

        // Check for position overlaps that indicate TL corruption:
        // no two non-empty blocks should share the same position
        // unless they did so in the original.
        const overlaps: string[] = []
        for (let i = 0; i < rBlocks.length; i++) {
            const wb1 = rBlocks[i].getWorldBoundingBox()
            if (!rBlocks[i].text.trim()) continue
            for (let j = i + 1; j < rBlocks.length; j++) {
                if (!rBlocks[j].text.trim()) continue
                const wb2 = rBlocks[j].getWorldBoundingBox()
                if (
                    Math.abs(wb1.x - wb2.x) < 1 &&
                    Math.abs(wb1.y - wb2.y) < 1
                ) {
                    // Check if this overlap existed before the move
                    const origI = before[i]
                    const origJ = before[j]
                    const wasAlreadyOverlapping =
                        origI &&
                        origJ &&
                        Math.abs(origI.x - origJ.x) < 1 &&
                        Math.abs(origI.y - origJ.y) < 1
                    if (!wasAlreadyOverlapping) {
                        overlaps.push(
                            `[${i}] "${rBlocks[i].text.substring(0, 30)}" & [${j}] "${rBlocks[j].text.substring(0, 30)}" at (${wb1.x.toFixed(1)},${wb1.y.toFixed(1)})`,
                        )
                    }
                }
            }
        }
        expect(overlaps).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// TextBlock.setFont
// ---------------------------------------------------------------------------
describe('TextBlock.setFont', () => {
    it('changes font name in single-segment block', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.font = PdfFont.COURIER
        const str = tb.toString()
        expect(str).toContain(`/${PdfFont.COURIER.resourceName} 12 Tf`)
        expect(str).not.toContain('/F1')
    })

    it('re-encodes text preserving content', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.font = PdfFont.COURIER
        expect(tb.text).toBe('Hello')
    })

    it('captures text BEFORE changing font (no decode corruption)', () => {
        // Two segments to exercise the pre-capture path
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (Abc) Tj 1 0 0 1 130 700 Tm (Def) Tj ET',
        )
        const tb = s.textBlocks[0]
        tb.font = PdfFont.TIMES_ROMAN
        expect(tb.text).toBe('AbcDef')
    })

    it('recalculates Tm positions for multi-segment blocks', () => {
        // Two segments at known positions
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (Hello) Tj 1 0 0 1 160 700 Tm (World) Tj ET',
        )
        const tb = s.textBlocks[0]
        const seg0Before = tb.getSegments()[0].getLocalTransform()

        tb.font = PdfFont.COURIER

        const segs = tb.getSegments()
        const seg0After = segs[0].getLocalTransform()
        const seg1After = segs[1].getLocalTransform()

        // First segment keeps original position
        expect(seg0After.e).toBeCloseTo(seg0Before.e, 1)
        expect(seg0After.f).toBeCloseTo(seg0Before.f, 1)

        // Second segment should be repositioned based on first segment's advance
        const advance0 = segs[0].getTextAdvance()
        expect(seg1After.e).toBeCloseTo(100 + advance0, 1)
        expect(seg1After.f).toBeCloseTo(700, 1)
    })

    it('uses font.resourceName for Tf ops', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Test) Tj ET')
        const tb = s.textBlocks[0]
        const font = PdfFont.HELVETICA_BOLD
        tb.font = font
        expect(tb.toString()).toContain(`/${font.resourceName} 12 Tf`)
    })

    it('updates source segments when regrouped', () => {
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (Part1) Tj 1 0 0 1 160 700 Tm (Part2) Tj ET',
        )
        const regrouped = VirtualTextBlock.regroupTextBlocks(s.textBlocks)
        const block = regrouped[0]
        block.font = PdfFont.COURIER

        // The source content stream should now contain the new font
        const streamStr = s.dataAsString
        expect(streamStr).toContain(`/${PdfFont.COURIER.resourceName}`)
    })

    it('preserves font size after change', () => {
        const s = makeStream('BT /F1 24 Tf 100 700 Td (Big) Tj ET')
        const tb = s.textBlocks[0]
        tb.font = PdfFont.TIMES_BOLD
        const seg = tb.getSegments()[0]
        expect(seg.fontSize).toBe(24)
    })

    it('skips segments with no text', () => {
        // Second "segment" has Tf but no show op
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (Hello) Tj /F2 10 Tf ET',
        )
        const tb = s.textBlocks[0]
        // Should not throw
        tb.font = PdfFont.COURIER
        expect(tb.text).toBe('Hello')
    })
})

// ---------------------------------------------------------------------------
// TextBlock.color
// ---------------------------------------------------------------------------
describe('TextBlock.color', () => {
    it('inserts RGB fill color op before show op', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.color = new RGBColor(1, 0, 0) // red
        const str = tb.toString()
        expect(str).toContain('1 0 0 rg')
    })

    it('preserves text content after color change', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.color = new RGBColor(0, 0.5, 1)
        expect(tb.text).toBe('Hello')
    })

    it('replaces existing RGB fill color', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td 1 0 0 rg (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.color = new RGBColor(0, 1, 0)
        const str = tb.toString()
        // Old red should be gone, new green present
        expect(str).not.toContain('1 0 0 rg')
        expect(str).toContain('0 1 0 rg')
    })

    it('replaces existing gray fill color', () => {
        const s = makeStream('BT /F1 12 Tf 100 700 Td 0.5 g (Hello) Tj ET')
        const tb = s.textBlocks[0]
        tb.color = new RGBColor(0, 0, 1)
        const str = tb.toString()
        expect(str).not.toContain('0.5 g')
        expect(str).toContain('0 0 1 rg')
    })

    it('updates source segments when regrouped', () => {
        const s = makeStream('BT /F1 12 Tf 1 0 0 1 100 700 Tm (Hello) Tj ET')
        const regrouped = VirtualTextBlock.regroupTextBlocks(s.textBlocks)
        regrouped[0].color = new RGBColor(1, 0, 0)
        const streamStr = s.dataAsString
        expect(streamStr).toContain('1 0 0 rg')
    })

    it('does not bleed color to subsequent text blocks', () => {
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (Line1) Tj 1 0 0 1 100 680 Tm (Line2) Tj ET',
        )
        const regrouped = VirtualTextBlock.regroupTextBlocks(s.textBlocks)
        expect(regrouped).toHaveLength(2)

        // Change only the first block's color to red
        regrouped[0].color = new RGBColor(1, 0, 0)

        // The source content stream should restore the previous color
        // after the first show op so "Line2" isn't affected.
        const streamStr = s.dataAsString

        // Find all "rg" operations in order
        const rgOps = [...streamStr.matchAll(/[\d.]+ [\d.]+ [\d.]+ rg/g)].map(
            (m) => m[0],
        )
        // Should have the red color and then a restore (default black = 0 g)
        expect(rgOps.length).toBeGreaterThanOrEqual(1)
        expect(rgOps[0]).toBe('1 0 0 rg')

        // After the first segment's show op, there should be a color restore
        // (either gray 0 g or rgb 0 0 0 rg) before the second show op
        const grayOps = [...streamStr.matchAll(/\b0 g\b/g)]
        const restoreRgOps = rgOps.filter((op) => op !== '1 0 0 rg')
        expect(grayOps.length + restoreRgOps.length).toBeGreaterThanOrEqual(1)
    })

    it('handles multiple segments in one block', () => {
        const s = makeStream(
            'BT /F1 12 Tf 1 0 0 1 100 700 Tm (A) Tj 1 0 0 1 110 700 Tm (B) Tj ET',
        )
        const tb = s.textBlocks[0]
        tb.color = new RGBColor(0.5, 0.5, 0.5)
        const str = tb.toString()
        // Both segments should have the color op
        const colorMatches = str.match(/0\.5 0\.5 0\.5 rg/g)
        expect(colorMatches?.length).toBeGreaterThanOrEqual(2)
    })
})

// ---------------------------------------------------------------------------
// setFont + color round-trip with real PDF
// ---------------------------------------------------------------------------
describe('setFont and color round-trip', () => {
    it('setFont preserves text content', () => {
        // Verify setFont doesn't corrupt text via inline stream test
        const s = makeStream('BT /F1 12 Tf 1 0 0 1 100 700 Tm (Hello) Tj ET')
        const tb = s.textBlocks[0]
        expect(tb.text).toBe('Hello')
        tb.font = PdfFont.COURIER
        expect(tb.text).toBe('Hello')
        // Source stream should contain the new font
        const str = s.dataAsString
        expect(str).toContain(`/${PdfFont.COURIER.resourceName}`)
    })

    it('color survives toBytes round-trip', async () => {
        const doc = await loadFixture('./test/unit/fixtures/template.pdf')
        const page = doc.pages.get(0)
        const blocks = page.textBlocks
        const target = blocks.find((b) => b.text.length > 0)
        expect(target).toBeDefined()
        const origText = target!.text

        target!.color = new RGBColor(1, 0, 0)

        // Round-trip
        const bytes = doc.toBytes()
        const reloaded = await PdfDocument.fromBytes([bytes])
        const rPage = reloaded.pages.get(0)
        const rBlocks = rPage.textBlocks

        // Text should survive
        const found = rBlocks.find((b) => b.text === origText)
        expect(found).toBeDefined()

        // The content stream should contain the red fill color
        const streamStr = rPage.contentStreams
            .map((s) => s.dataAsString)
            .join('')
        expect(streamStr).toContain('1 0 0 rg')
    })
})
