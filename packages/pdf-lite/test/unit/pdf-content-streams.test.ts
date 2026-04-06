import { describe, it, expect, beforeAll } from 'vitest'
import { server } from 'vitest/browser'
import { PdfDocument } from '../../src/pdf/pdf-document'
import {
    PdfContentStream,
    TextBlock,
    Text,
    GraphicsBlock,
    GroupNode,
    ContentOps,
} from '../../src/graphics/pdf-content-stream'
import { PdfStream } from '../../src/core/objects/pdf-stream'
import { PdfIndirectObject } from '../../src/core/objects/pdf-indirect-object'
import { PdfFont } from '../../src/fonts/pdf-font'
import { ByteArray } from '../../src/types'

const FIXTURE = './test/unit/fixtures/multi-child-field.pdf'

const base64ToBytes = (b64: string): ByteArray => {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
}

async function loadFixture(): Promise<PdfDocument> {
    const b64 = await server.commands.readFile(FIXTURE, { encoding: 'base64' })
    return PdfDocument.fromBytes([base64ToBytes(b64)])
}

function makeStream(content: string): PdfContentStream {
    const stream = new PdfStream(content)
    const obj = new PdfIndirectObject({ content: stream })
    return new PdfContentStream(obj)
}

// ---------------------------------------------------------------------------
// Fixture: page structure
// ---------------------------------------------------------------------------
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
describe('multi-child-field.pdf — content streams', () => {
    let doc: PdfDocument

    beforeAll(async () => {
        doc = await loadFixture()
    })

    it('page has at least 1 content stream', () => {
        const streams = doc.pages.get(0).contentStreams
        expect(streams.length).toBeGreaterThanOrEqual(1)
    })

    it('every content stream is a PdfContentStream', () => {
        for (const s of doc.pages.get(0).contentStreams) {
            expect(s).toBeInstanceOf(PdfContentStream)
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
})

// ---------------------------------------------------------------------------
// Fixture: nodes parsed from content streams
// ---------------------------------------------------------------------------
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
                        node instanceof GroupNode,
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
describe('PdfContentStream.add() and dataAsString', () => {
    it('add() appends a node to the stream', () => {
        const s = makeStream('')
        const block = new TextBlock()
        const text = new Text()
        text.ops = new ContentOps(['/F1 12 Tf', '0 0 Td', '(Hello) Tj'])
        block.addSegment(text)
        s.add(block)
        expect(s.dataAsString).toContain('/F1 12 Tf')
        expect(s.dataAsString).toContain('0 0 Td')
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
describe('PdfContentStream.nodes() — TextBlock parsing', () => {
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
describe('PdfContentStream.nodes() — GraphicsBlock parsing', () => {
    it('parses a simple move/line/stroke as a GraphicsBlock', () => {
        const s = makeStream('10 10 m 100 10 l S')
        const nodes = s.nodes
        expect(nodes).toHaveLength(1)
        expect(nodes[0]).toBeInstanceOf(GraphicsBlock)
    })

    it('parsed GraphicsBlock ops contain the m operator', () => {
        const s = makeStream('10 10 m 100 10 l S')
        const gb = s.graphicsBlocks[0]
        expect(gb.ops.ops.some((op) => op.includes(' m'))).toBe(true)
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
        const tb = s.nodes[0] as TextBlock
        expect(tb.getSegments()).toHaveLength(2)
        expect(tb.getSegments()[0].text).toBe('Line1')
        expect(tb.getSegments()[1].text).toBe('Line2')
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
        const tb = s.nodes[0] as TextBlock
        expect(tb.text).toBe('Hello World')
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
        expect(block.ops.ops.length).toBeGreaterThan(0)
    })
})
