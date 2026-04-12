import { describe, it, expect, beforeAll } from 'vitest'
import { server } from 'vitest/browser'
import { PdfDocument } from '../../src/pdf/pdf-document'
import {
    PdfContentStreamObject,
    TextBlock,
    Text,
    GraphicsBlock,
    StateNode,
} from '../../src/graphics/pdf-content-stream'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfFont } from '../../src/fonts/pdf-font'
import { ByteArray } from '../../src/types'
import { MoveToOp } from '../../src/graphics/ops/path'

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
        const textBlocks = page.extractTextBlocks()
        const graphicsBlocks = page.extractGraphicLines()

        const regroupedBlocks = TextBlock.regroupTextBlocks(textBlocks)
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
        const text = new Text()
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
        expect(lines).toHaveLength(2)
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
        expect(tb.getSegments()[0]).toBeInstanceOf(Text)
        expect(tb.getSegments()[0].text).toBe('Hello')
    })

    it('should split multi-line BT blocks into separate lines', () => {
        const s = makeStream(
            'BT /F1 12 Tf 100 700 Td (Line1) Tj 0 -14 Td (Line2) Tj ET',
        )
        // Per-line splitting: use regroupTextBlocksByLine() to split by visual lines
        const regrouped = s.regroupTextBlocksByLine()
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
        const regrouped = s.regroupTextBlocksByLine()
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
        const regrouped = s.regroupTextBlocksByLine()
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
        const textBlocks = page.extractTextBlocks()
        const regrouped = TextBlock.regroupTextBlocks(textBlocks)
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
        const textBlocks = page.extractTextBlocks()
        const regrouped = TextBlock.regroupTextBlocks(textBlocks)
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
            blocks = page.getTextBlocks()
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

    it('moving "Identification" round-trips correctly', async () => {
        const doc2 = await loadFixture('./test/unit/fixtures/AT_Verf19E_EU.pdf')
        let page: any, blocks: any, idBlock: any
        for (let p = 0; p < doc2.pages.count; p++) {
            page = doc2.pages.get(p)
            blocks = page.getTextBlocks()
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
            const reloadedBlocks = rp.getTextBlocks()
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
})

describe('CA_GST_RC1 — Page 13 of 13 debug', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture('./test/unit/fixtures/CA_GST_RC1-19e.pdf')
    })

    it('Page 13 of 13 bbox covers the full text', () => {
        const lastPage = doc.pages.get(doc.pages.count - 1)
        const textBlocks = lastPage.extractTextBlocks()
        const regrouped = TextBlock.regroupTextBlocks(textBlocks)
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

        it('getTextBlocks returns blocks with source segment references', () => {
            const page = doc.pages.get(0)
            const blocks = page.getTextBlocks()
            expect(blocks.length).toBeGreaterThan(0)

            // Every segment should have a _sourceSegment reference
            for (const block of blocks) {
                for (const seg of block.getSegments()) {
                    expect(seg._sourceSegment).toBeDefined()
                }
            }
        })

        it('source segments have a valid parent in the content stream tree', () => {
            const page = doc.pages.get(0)
            const blocks = page.getTextBlocks()
            expect(blocks.length).toBeGreaterThan(0)

            for (const block of blocks) {
                for (const seg of block.getSegments()) {
                    const src = seg._sourceSegment!
                    expect(src.parent).toBeDefined()
                    expect(src.parent).toBeInstanceOf(TextBlock)
                }
            }
        })

        it('editText modifies the content stream dataAsString immediately', async () => {
            const doc2 = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc2.pages.get(0)
            const blocks = page.getTextBlocks()

            // Find a text block with identifiable text
            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()
            const originalText = target!.text

            // Edit it
            target!.editText('CHANGED_TEXT_12345')

            // The content stream should reflect the change immediately
            const stream = page.contentStreams[0]
            const after = stream.dataAsString
            expect(after).not.toContain(originalText)
        })

        it('editText survives toBytes round-trip', async () => {
            const doc2 = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc2.pages.get(0)
            const blocks = page.getTextBlocks()

            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            target!.editText('ROUNDTRIP_TEST')

            // Serialize and reload
            const bytes = doc2.toBytes()
            const reloaded = await PdfDocument.fromBytes([bytes])
            const reloadedPage = reloaded.pages.get(0)
            const reloadedBlocks = reloadedPage.getTextBlocks()
            const found = reloadedBlocks.find((b) =>
                b.text.includes('ROUNDTRIP_TEST'),
            )
            expect(found).toBeDefined()
        })

        it('moveBy survives toBytes round-trip', async () => {
            const doc2 = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc2.pages.get(0)
            const blocks = page.getTextBlocks()

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
            const reloadedBlocks = reloadedPage.getTextBlocks()

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
        it('getTextBlocks returns blocks with source references', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)

            // template.pdf has multiple content streams
            expect(page.contentStreams.length).toBeGreaterThan(1)

            const blocks = page.getTextBlocks()
            expect(blocks.length).toBeGreaterThan(0)

            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            // Check source segment chain
            const segs = target!.getSegments()
            expect(segs.length).toBeGreaterThan(0)

            const seg = segs[0]
            expect(seg._sourceSegment).toBeDefined()

            const src = seg._sourceSegment!
            expect(src.parent).toBeDefined()
            expect(src.parent).toBeInstanceOf(TextBlock)

            // After getTextBlocks (which consolidates), the first
            // stream's _nodes should be populated and contain the
            // source parent.
            const stream = page.contentStreams[0]
            const nodesBlocks = stream.textBlocks
            const found = nodesBlocks.find((b) => b === src.parent)
            expect(found).toBeDefined()
        })

        it('replaceTextInSource actually modifies the source parent ops', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)
            const blocks = page.getTextBlocks()

            const target = blocks.find((b) => b.text.trim().length > 3)!
            const seg = target.getSegments()[0]
            const src = seg._sourceSegment!
            const parentBlock = src.parent! as TextBlock

            const oldText = parentBlock.text
            expect(oldText.length).toBeGreaterThan(0)

            const result = seg.replaceTextInSource('EDITED_VALUE')
            expect(result).toBe(true)

            // The source parent's serialization should change
            const newStr = parentBlock.toString()
            expect(newStr).not.toContain(oldText.slice(0, 10))
        })

        it('editText modifies content stream dataAsString immediately', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)

            const blocks = page.getTextBlocks()
            const target = blocks.find((b) => b.text.trim().length > 3)!
            const originalText = target.text

            target.editText('SINGLE_STREAM_EDIT_TEST')

            // After consolidation, stream[0] has all nodes.
            // dataAsString should reflect the edit.
            const stream = page.contentStreams[0]
            const after = stream.dataAsString
            expect(after).not.toContain(originalText)
        })

        it('editText survives toBytes round-trip', async () => {
            const doc = await loadFixture('./test/unit/fixtures/template.pdf')
            const page = doc.pages.get(0)
            const blocks = page.getTextBlocks()
            expect(blocks.length).toBeGreaterThan(0)

            // Pick the first non-empty block
            const target = blocks.find((b) => b.text.trim().length > 3)
            expect(target).toBeDefined()

            target!.editText('SINGLE_STREAM_EDIT')

            // Serialize and reload
            const bytes = doc.toBytes()
            const reloaded = await PdfDocument.fromBytes([bytes])
            const reloadedPage = reloaded.pages.get(0)
            const reloadedBlocks = reloadedPage.getTextBlocks()
            const found = reloadedBlocks.find((b) =>
                b.text.includes('SINGLE_STREAM_EDIT'),
            )
            expect(found).toBeDefined()
        })
    })
})
