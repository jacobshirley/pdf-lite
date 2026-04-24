import { describe, it, expect } from 'vitest'
import {
    TextBlock,
    TextRun,
    PdfContentStream,
    StateNode,
    ContentNode,
    VirtualTextBlock,
} from '../../src/graphics/pdf-content-stream'
import {
    SetFontOp,
    SetTextMatrixOp,
    ShowTextOp,
} from '../../src/graphics/ops/text'

/** Collect TextBlocks from a content stream's parsed node tree */
function collectTextBlocks(nodes: ContentNode[]): TextBlock[] {
    const result: TextBlock[] = []
    for (const node of nodes) {
        if (node instanceof TextBlock) result.push(node)
        else if (node instanceof StateNode)
            result.push(...collectTextBlocks(node.getChildren()))
    }
    return result
}

const makeSeg = (
    fontName: string,
    size: number,
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    y: number,
    text: string,
): TextRun =>
    new TextRun([
        SetFontOp.create(fontName, size),
        SetTextMatrixOp.create(a, b, c, d, x, y),
        ShowTextOp.create(text),
    ])

const upright = (
    fontName: string,
    size: number,
    x: number,
    y: number,
    text: string,
): TextRun => makeSeg(fontName, size, 1, 0, 0, 1, x, y, text)

describe('VirtualTextBlock.regroupTextBlocks', () => {
    it('groups runs with matching baselines into one block', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        block.addRun(upright('F1', 12, 100, 680, 'B'))
        block.addRun(upright('F1', 12, 110, 700, 'C'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('AC')
        expect(regrouped[1].text).toBe('B')
    })

    it('sorts runs within a line by x ascending', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 120, 700, 'C'))
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        block.addRun(upright('F1', 12, 110, 700, 'B'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('ABC')
    })

    it('flattens runs across multiple input blocks', () => {
        const block1 = new TextBlock()
        block1.addRun(upright('F1', 12, 100, 700, 'Hello '))
        block1.addRun(upright('F1', 12, 100, 680, 'Bottom '))

        const block2 = new TextBlock()
        block2.addRun(upright('F1', 12, 145, 700, 'World'))
        block2.addRun(upright('F1', 12, 155, 680, 'Line'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block1, block2])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello World')
        expect(regrouped[1].text).toBe('Bottom Line')
    })

    it('treats close-enough baselines as the same line (within 0.5x fontSize)', () => {
        const block = new TextBlock()
        // 2pt baseline jitter at 12pt fontSize → tolerance 6 → same line.
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        block.addRun(upright('F1', 12, 110, 702, 'B'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('AB')
    })

    it('separates lines that exceed the tolerance', () => {
        const block = new TextBlock()
        // 20pt baseline delta at 12pt fontSize → tolerance 6 → different lines.
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        block.addRun(upright('F1', 12, 100, 680, 'B'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
    })

    it('buckets rotated text separately from upright text', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        // 90° rotated B at (100, 700) — different orientation bucket
        block.addRun(makeSeg('F1', 12, 0, 1, -1, 0, 100, 700, 'B'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
    })

    it('skips empty position-only runs', () => {
        const empty = new TextRun([SetTextMatrixOp.create(1, 0, 0, 1, 50, 750)])
        const block = new TextBlock()
        block.addRun(empty)
        block.addRun(upright('F1', 12, 100, 700, 'A'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('A')
    })

    it('bakes standalone state + absolute Tm into each output run', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        block.addRun(upright('F1', 12, 110, 700, 'B'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])
        const runs = regrouped[0].getRuns()

        expect(runs).toHaveLength(2)
        for (const run of runs) {
            expect(run.ops.some((o) => o instanceof SetFontOp)).toBe(true)
            expect(run.ops.some((o) => o instanceof SetTextMatrixOp)).toBe(true)
            expect(run.ops.some((o) => o instanceof ShowTextOp)).toBe(true)
        }

        const firstTm = runs[0].ops.find(
            (o): o is SetTextMatrixOp => o instanceof SetTextMatrixOp,
        )!
        expect(firstTm.e).toBeCloseTo(100, 5)
        expect(firstTm.f).toBeCloseTo(700, 5)
    })

    it('allows text replacement on a regrouped block', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'Hello '))
        block.addRun(upright('F1', 12, 145, 700, 'World'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])
        expect(regrouped[0].text).toBe('Hello World')

        regrouped[0].text = 'replaced'
        expect(regrouped[0].text).toBe('replaced')
    })

    it('returns an empty array for empty input', () => {
        expect(VirtualTextBlock.regroupTextBlocks([])).toEqual([])
    })

    it('splits runs with different fonts on the same line into separate blocks', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'Intermediary Number'))
        block.addRun(upright('F2', 12, 300, 700, 'IN'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Intermediary Number')
        expect(regrouped[1].text).toBe('IN')
    })

    it('keeps same-font runs together when splitting by font', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'Hello '))
        block.addRun(upright('F1', 12, 145, 700, 'World'))
        block.addRun(upright('F2', 12, 185, 700, 'Bold'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello World')
        expect(regrouped[1].text).toBe('Bold')
    })

    it('splits by font across different lines independently', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 100, 700, 'A'))
        block.addRun(upright('F2', 12, 200, 700, 'B'))
        block.addRun(upright('F1', 12, 100, 680, 'C'))
        block.addRun(upright('F2', 12, 200, 680, 'D'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(4)
        const texts = regrouped.map((r) => r.text)
        expect(texts).toContain('A')
        expect(texts).toContain('B')
        expect(texts).toContain('C')
        expect(texts).toContain('D')
    })

    it('splits same-font runs that are far apart horizontally', () => {
        const block = new TextBlock()
        // "Left" at x=100, "Right" at x=500 — gap far exceeds 3× fontSize
        block.addRun(upright('F1', 12, 100, 700, 'Left'))
        block.addRun(upright('F1', 12, 500, 700, 'Right'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Left')
        expect(regrouped[1].text).toBe('Right')
    })

    it('keeps close same-font runs together despite small gaps', () => {
        const block = new TextBlock()
        // "Hello " at x=100, "World" at x=140 — gap well within 3× fontSize
        block.addRun(upright('F1', 12, 100, 700, 'Hello '))
        block.addRun(upright('F1', 12, 140, 700, 'World'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('Hello World')
    })

    it('splits into three groups with two large gaps', () => {
        const block = new TextBlock()
        block.addRun(upright('F1', 12, 50, 700, 'A'))
        block.addRun(upright('F1', 12, 250, 700, 'B'))
        block.addRun(upright('F1', 12, 450, 700, 'C'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(3)
        expect(regrouped[0].text).toBe('A')
        expect(regrouped[1].text).toBe('B')
        expect(regrouped[2].text).toBe('C')
    })

    it('splits same-font runs when a different-font run sits between them', () => {
        const block = new TextBlock()
        // "State the reasons " (italic F2) → "and " (bold F1) → "detailed summary" (italic F2)
        // The italic runs are close together but a bold word sits between them
        block.addRun(upright('F2', 12, 100, 700, 'State the reasons '))
        block.addRun(upright('F1', 12, 210, 700, 'and '))
        block.addRun(upright('F2', 12, 240, 700, 'detailed summary'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        // Should produce 3 blocks: "State the reasons ", "and ", "detailed summary"
        expect(regrouped).toHaveLength(3)
        const texts = regrouped.map((r) => r.text)
        expect(texts).toContain('State the reasons ')
        expect(texts).toContain('and ')
        expect(texts).toContain('detailed summary')
    })

    it('does not split same-font runs when no other font sits between them', () => {
        const block = new TextBlock()
        // Two F1 runs close together with an F2 run elsewhere on the line
        block.addRun(upright('F1', 12, 100, 700, 'Hello '))
        block.addRun(upright('F1', 12, 140, 700, 'World'))
        block.addRun(upright('F2', 12, 300, 700, 'Bold'))

        const regrouped = VirtualTextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello World')
        expect(regrouped[1].text).toBe('Bold')
    })

    describe('view semantics', () => {
        it('regrouped runs are the original TextRun instances', () => {
            const block = new TextBlock()
            block.addRun(upright('F1', 12, 100, 700, 'Hello'))
            block.addRun(upright('F1', 12, 150, 700, 'World'))

            const original = block.getRuns()
            const regrouped = VirtualTextBlock.regroupTextBlocks([block])

            expect(regrouped).toHaveLength(1)
            const runs = regrouped[0].getRuns()
            expect(runs).toHaveLength(2)
            expect(runs[0]).toBe(original[0])
            expect(runs[1]).toBe(original[1])
            // Parent links are preserved — still pointing at the real block.
            expect(runs[0].parent).toBe(block)
            expect(runs[1].parent).toBe(block)
        })

        it('editText on the virtual block updates the real parent', () => {
            const block = new TextBlock()
            block.addRun(upright('F1', 12, 100, 700, 'Original'))

            const regrouped = VirtualTextBlock.regroupTextBlocks([block])
            regrouped[0].text = 'Replaced'

            expect(block.toString()).toContain('Replaced')
            expect(block.toString()).not.toContain('Original')
        })

        it('editText collapses multiple runs into the first', () => {
            const block = new TextBlock()
            block.addRun(upright('F1', 12, 100, 700, 'Keep'))
            block.addRun(upright('F1', 12, 150, 700, 'Remove'))

            const regrouped = VirtualTextBlock.regroupTextBlocks([block])
            regrouped[0].text = 'Kept'

            expect(block.text).toBe('Kept')
            expect(block.toString()).not.toContain('Remove')
        })

        it('moveBy on the virtual block shifts the real parent Tm', () => {
            const block = new TextBlock()
            block.addRun(upright('F1', 12, 100, 700, 'Hello'))

            const regrouped = VirtualTextBlock.regroupTextBlocks([block])
            regrouped[0].moveBy(10, -5)

            const str = block.toString()
            expect(str).toContain('110')
            expect(str).toContain('695')
        })
    })
})

describe('end-to-end edit/move via PdfContentStream', () => {
    const SIMPLE_STREAM = 'BT\n/F1 12 Tf\n1 0 0 1 100 700 Tm\n(Hello) Tj\nET'

    const TWO_BLOCK_STREAM = [
        'BT',
        '/F1 12 Tf',
        '1 0 0 1 100 700 Tm',
        '(Hello) Tj',
        'ET',
        'BT',
        '/F1 12 Tf',
        '1 0 0 1 100 680 Tm',
        '(World) Tj',
        'ET',
    ].join('\n')

    const WITH_STATE = [
        'q',
        'BT',
        '/F1 12 Tf',
        '1 0 0 1 100 700 Tm',
        '(Inside) Tj',
        'ET',
        'Q',
    ].join('\n')

    it('editText modifies content stream round-trip (simple)', () => {
        const pcs = new PdfContentStream(SIMPLE_STREAM)
        // Parse nodes
        const blocks = collectTextBlocks(pcs.nodes)
        expect(blocks).toHaveLength(1)
        const regrouped = VirtualTextBlock.regroupTextBlocks(blocks)
        expect(regrouped[0].text).toBe('Hello')

        // Edit
        regrouped[0].text = 'Changed'

        // Re-extract from the SAME content stream (nodes cached)
        const blocks2 = collectTextBlocks(pcs.nodes)
        const regrouped2 = VirtualTextBlock.regroupTextBlocks(blocks2)
        expect(regrouped2[0].text).toBe('Changed')
    })

    it('editText modifies content stream dataAsString', () => {
        const pcs = new PdfContentStream(SIMPLE_STREAM)
        const blocks = collectTextBlocks(pcs.nodes)
        const regrouped = VirtualTextBlock.regroupTextBlocks(blocks)

        regrouped[0].text = 'NewText'

        // dataAsString should no longer contain the old text
        const str = pcs.dataAsString
        expect(str).not.toContain('Hello')
        // The new text may be in TJ array form with kerning, e.g. [(Ne) 20 (wT) ...]
        // Just verify the show operator changed
        expect(str).toContain('TJ')
    })

    it('moveBy modifies content stream positions', () => {
        const pcs = new PdfContentStream(SIMPLE_STREAM)
        const blocks = collectTextBlocks(pcs.nodes)
        const regrouped = VirtualTextBlock.regroupTextBlocks(blocks)

        regrouped[0].moveBy(10, -5)

        // Re-extract
        const blocks2 = collectTextBlocks(pcs.nodes)
        const regrouped2 = VirtualTextBlock.regroupTextBlocks(blocks2)
        const run = regrouped2[0].getRuns()[0]
        const tm = run.getWorldTransform()
        expect(tm.e).toBeCloseTo(110)
        expect(tm.f).toBeCloseTo(695)
    })

    it('editText works with two text blocks', () => {
        const pcs = new PdfContentStream(TWO_BLOCK_STREAM)
        const blocks = collectTextBlocks(pcs.nodes)
        expect(blocks).toHaveLength(2)
        const regrouped = VirtualTextBlock.regroupTextBlocks(blocks)
        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello')
        expect(regrouped[1].text).toBe('World')

        // Edit first block
        regrouped[0].text = 'Bye'

        // Re-extract
        const blocks2 = collectTextBlocks(pcs.nodes)
        const regrouped2 = VirtualTextBlock.regroupTextBlocks(blocks2)
        expect(regrouped2[0].text).toBe('Bye')
        expect(regrouped2[1].text).toBe('World')
    })

    it('content stream round-trip preserves q/Q blocks', () => {
        const pcs = new PdfContentStream(WITH_STATE)
        // Parse nodes to set _nodes
        const _ = pcs.nodes
        // Round-trip: dataAsString serializes from _nodes
        const str = pcs.dataAsString
        expect(str).toContain('q')
        expect(str).toContain('Q')
        expect(str).toContain('Inside')
    })

    it('moveBy works with Td-based source runs', () => {
        const TD_STREAM = [
            'BT',
            '/F1 12 Tf',
            '100 700 Td',
            '(Hello) Tj',
            'ET',
        ].join('\n')

        const pcs = new PdfContentStream(TD_STREAM)
        const blocks = collectTextBlocks(pcs.nodes)
        const regrouped = VirtualTextBlock.regroupTextBlocks(blocks)

        regrouped[0].moveBy(10, -5)

        // Re-extract from the modified content stream
        // Clear _nodes to force re-parse from serialized data
        pcs.dataAsString = pcs.dataAsString
        const blocks2 = collectTextBlocks(pcs.nodes)
        const regrouped2 = VirtualTextBlock.regroupTextBlocks(blocks2)
        const run = regrouped2[0].getRuns()[0]
        const tm = run.getWorldTransform()
        expect(tm.e).toBeCloseTo(110)
        expect(tm.f).toBeCloseTo(695)
    })
})
