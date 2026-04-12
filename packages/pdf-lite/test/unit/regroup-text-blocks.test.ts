import { describe, it, expect } from 'vitest'
import { TextBlock, Text } from '../../src/graphics/pdf-content-stream'
import {
    SetFontOp,
    SetTextMatrixOp,
    ShowTextOp,
} from '../../src/graphics/ops/text'

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
): Text =>
    new Text([
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
): Text => makeSeg(fontName, size, 1, 0, 0, 1, x, y, text)

describe('TextBlock.regroupTextBlocks', () => {
    it('groups segments with matching baselines into one block', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        block.addSegment(upright('F1', 12, 100, 680, 'B'))
        block.addSegment(upright('F1', 12, 110, 700, 'C'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('AC')
        expect(regrouped[1].text).toBe('B')
    })

    it('sorts segments within a line by x ascending', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 120, 700, 'C'))
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        block.addSegment(upright('F1', 12, 110, 700, 'B'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('ABC')
    })

    it('flattens segments across multiple input blocks', () => {
        const block1 = new TextBlock()
        block1.addSegment(upright('F1', 12, 100, 700, 'Hello '))
        block1.addSegment(upright('F1', 12, 100, 680, 'Bottom '))

        const block2 = new TextBlock()
        block2.addSegment(upright('F1', 12, 145, 700, 'World'))
        block2.addSegment(upright('F1', 12, 155, 680, 'Line'))

        const regrouped = TextBlock.regroupTextBlocks([block1, block2])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello World')
        expect(regrouped[1].text).toBe('Bottom Line')
    })

    it('treats close-enough baselines as the same line (within 0.5x fontSize)', () => {
        const block = new TextBlock()
        // 2pt baseline jitter at 12pt fontSize → tolerance 6 → same line.
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        block.addSegment(upright('F1', 12, 110, 702, 'B'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('AB')
    })

    it('separates lines that exceed the tolerance', () => {
        const block = new TextBlock()
        // 20pt baseline delta at 12pt fontSize → tolerance 6 → different lines.
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        block.addSegment(upright('F1', 12, 100, 680, 'B'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
    })

    it('buckets rotated text separately from upright text', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        // 90° rotated B at (100, 700) — different orientation bucket
        block.addSegment(makeSeg('F1', 12, 0, 1, -1, 0, 100, 700, 'B'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
    })

    it('skips empty position-only segments', () => {
        const empty = new Text([SetTextMatrixOp.create(1, 0, 0, 1, 50, 750)])
        const block = new TextBlock()
        block.addSegment(empty)
        block.addSegment(upright('F1', 12, 100, 700, 'A'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('A')
    })

    it('bakes standalone state + absolute Tm into each output segment', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        block.addSegment(upright('F1', 12, 110, 700, 'B'))

        const regrouped = TextBlock.regroupTextBlocks([block])
        const segs = regrouped[0].getSegments()

        expect(segs).toHaveLength(2)
        for (const seg of segs) {
            expect(seg.ops.some((o) => o instanceof SetFontOp)).toBe(true)
            expect(seg.ops.some((o) => o instanceof SetTextMatrixOp)).toBe(true)
            expect(seg.ops.some((o) => o instanceof ShowTextOp)).toBe(true)
        }

        const firstTm = segs[0].ops.find(
            (o): o is SetTextMatrixOp => o instanceof SetTextMatrixOp,
        )!
        expect(firstTm.e).toBeCloseTo(100, 5)
        expect(firstTm.f).toBeCloseTo(700, 5)
    })

    it('allows text replacement on a regrouped block', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'Hello '))
        block.addSegment(upright('F1', 12, 145, 700, 'World'))

        const regrouped = TextBlock.regroupTextBlocks([block])
        expect(regrouped[0].text).toBe('Hello World')

        regrouped[0].text = 'replaced'
        expect(regrouped[0].text).toBe('replaced')
    })

    it('returns an empty array for empty input', () => {
        expect(TextBlock.regroupTextBlocks([])).toEqual([])
    })

    it('splits segments with different fonts on the same line into separate blocks', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'Intermediary Number'))
        block.addSegment(upright('F2', 12, 300, 700, 'IN'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Intermediary Number')
        expect(regrouped[1].text).toBe('IN')
    })

    it('keeps same-font segments together when splitting by font', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'Hello '))
        block.addSegment(upright('F1', 12, 145, 700, 'World'))
        block.addSegment(upright('F2', 12, 185, 700, 'Bold'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello World')
        expect(regrouped[1].text).toBe('Bold')
    })

    it('splits by font across different lines independently', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 100, 700, 'A'))
        block.addSegment(upright('F2', 12, 200, 700, 'B'))
        block.addSegment(upright('F1', 12, 100, 680, 'C'))
        block.addSegment(upright('F2', 12, 200, 680, 'D'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(4)
        const texts = regrouped.map((r) => r.text)
        expect(texts).toContain('A')
        expect(texts).toContain('B')
        expect(texts).toContain('C')
        expect(texts).toContain('D')
    })

    it('splits same-font segments that are far apart horizontally', () => {
        const block = new TextBlock()
        // "Left" at x=100, "Right" at x=500 — gap far exceeds 3× fontSize
        block.addSegment(upright('F1', 12, 100, 700, 'Left'))
        block.addSegment(upright('F1', 12, 500, 700, 'Right'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Left')
        expect(regrouped[1].text).toBe('Right')
    })

    it('keeps close same-font segments together despite small gaps', () => {
        const block = new TextBlock()
        // "Hello " at x=100, "World" at x=140 — gap well within 3× fontSize
        block.addSegment(upright('F1', 12, 100, 700, 'Hello '))
        block.addSegment(upright('F1', 12, 140, 700, 'World'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(1)
        expect(regrouped[0].text).toBe('Hello World')
    })

    it('splits into three groups with two large gaps', () => {
        const block = new TextBlock()
        block.addSegment(upright('F1', 12, 50, 700, 'A'))
        block.addSegment(upright('F1', 12, 250, 700, 'B'))
        block.addSegment(upright('F1', 12, 450, 700, 'C'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(3)
        expect(regrouped[0].text).toBe('A')
        expect(regrouped[1].text).toBe('B')
        expect(regrouped[2].text).toBe('C')
    })

    it('splits same-font segments when a different-font segment sits between them', () => {
        const block = new TextBlock()
        // "State the reasons " (italic F2) → "and " (bold F1) → "detailed summary" (italic F2)
        // The italic segments are close together but a bold word sits between them
        block.addSegment(upright('F2', 12, 100, 700, 'State the reasons '))
        block.addSegment(upright('F1', 12, 210, 700, 'and '))
        block.addSegment(upright('F2', 12, 240, 700, 'detailed summary'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        // Should produce 3 blocks: "State the reasons ", "and ", "detailed summary"
        expect(regrouped).toHaveLength(3)
        const texts = regrouped.map((r) => r.text)
        expect(texts).toContain('State the reasons ')
        expect(texts).toContain('and ')
        expect(texts).toContain('detailed summary')
    })

    it('does not split same-font segments when no other font sits between them', () => {
        const block = new TextBlock()
        // Two F1 segments close together with an F2 segment elsewhere on the line
        block.addSegment(upright('F1', 12, 100, 700, 'Hello '))
        block.addSegment(upright('F1', 12, 140, 700, 'World'))
        block.addSegment(upright('F2', 12, 300, 700, 'Bold'))

        const regrouped = TextBlock.regroupTextBlocks([block])

        expect(regrouped).toHaveLength(2)
        expect(regrouped[0].text).toBe('Hello World')
        expect(regrouped[1].text).toBe('Bold')
    })
})
