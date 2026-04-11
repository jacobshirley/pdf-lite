import { describe, it, expect } from 'vitest'
import { PdfContentStreamTokeniser } from '../../src/graphics/tokeniser'
import { ContentOp } from '../../src/graphics/ops/base'
import {
    BeginTextOp,
    EndTextOp,
    SetFontOp,
    MoveTextOp,
    ShowTextOp,
    ShowTextArrayOp,
} from '../../src/graphics/ops/text'
import { MoveToOp, LineToOp, RectangleOp } from '../../src/graphics/ops/path'
import {
    SaveStateOp,
    RestoreStateOp,
    SetMatrixOp,
} from '../../src/graphics/ops/state'
import {
    StrokeOp,
    FillEvenOddOp,
    FillAndStrokeEvenOddOp,
    ClipEvenOddOp,
    EndPathOp,
} from '../../src/graphics/ops/paint'
import { stringToBytes } from '../../src/utils/stringToBytes'
import { ByteArray } from '../../src/types'

/**
 * Runs the tokeniser on the given input and returns the parsed ContentOps.
 *
 * Feeds in small chunks to exercise the incremental buffering behaviour.
 */
function tokenise(input: string | Uint8Array, chunkSize = 7): ContentOp[] {
    const tokeniser = new PdfContentStreamTokeniser()
    const bytes =
        typeof input === 'string' ? stringToBytes(input) : (input as ByteArray)
    const ops: ContentOp[] = []

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk: ByteArray = bytes.slice(i, i + chunkSize)
        tokeniser.feedBytes(chunk)
        for (const op of tokeniser.nextItems()) {
            ops.push(op)
        }
    }

    tokeniser.eof = true
    for (const op of tokeniser.nextItems()) {
        ops.push(op)
    }

    return ops
}

const toString = (ops: ContentOp[]): string[] => ops.map((o) => o.toString())

/** Concatenate every op's bytes back into a single Uint8Array. */
function concatBytes(ops: ContentOp[]): Uint8Array {
    let total = 0
    for (const op of ops) total += op.bytes.length
    const out = new Uint8Array(total)
    let offset = 0
    for (const op of ops) {
        out.set(op.bytes, offset)
        offset += op.bytes.length
    }
    return out
}

/** Build a Uint8Array from raw byte values. */
const bytes = (...values: number[]) => new Uint8Array(values)

describe('PdfContentStreamTokeniser', () => {
    describe('feedBytes + incremental parsing', () => {
        it('tokenises a simple operator with no operands', () => {
            const ops = tokenise('q\n')
            expect(toString(ops)).toEqual(['q\n'])
        })

        it('tokenises an operator with numeric operands', () => {
            const ops = tokenise('1 0 0 1 100 200 cm\n')
            expect(toString(ops)).toEqual(['1 0 0 1 100 200 cm\n'])
        })

        it('tokenises multiple operators on one line', () => {
            const ops = tokenise('q 10 20 m 30 40 l S Q\n')
            expect(toString(ops)).toEqual([
                'q ',
                '10 20 m ',
                '30 40 l ',
                'S ',
                'Q\n',
            ])
        })

        it('handles operators separated by varied whitespace (space/tab/LF/CR)', () => {
            const ops = tokenise('q\t10\n20\rm\n\r30 40 l S Q\n')
            expect(toString(ops)).toEqual([
                'q\t',
                '10\n20\rm\n\r',
                '30 40 l ',
                'S ',
                'Q\n',
            ])
        })

        it('is not sensitive to chunk boundaries', () => {
            const input = '1 0 0 1 100 200 cm 10 20 m 30 40 l S\n'
            for (const chunkSize of [1, 2, 3, 5, 11, 1000]) {
                const ops = tokenise(input, chunkSize)
                expect(toString(ops)).toEqual([
                    '1 0 0 1 100 200 cm ',
                    '10 20 m ',
                    '30 40 l ',
                    'S\n',
                ])
            }
        })
    })

    describe('numeric operands', () => {
        it('parses negative numbers', () => {
            expect(toString(tokenise('-10 -20.5 m\n'))).toEqual([
                '-10 -20.5 m\n',
            ])
        })

        it('parses leading-dot numbers', () => {
            expect(toString(tokenise('.5 .25 m\n'))).toEqual(['.5 .25 m\n'])
        })

        it('parses floats', () => {
            expect(toString(tokenise('1.5 2.75 l\n'))).toEqual(['1.5 2.75 l\n'])
        })
    })

    describe('names', () => {
        it('parses a name operand', () => {
            expect(toString(tokenise('/F1 12 Tf\n'))).toEqual(['/F1 12 Tf\n'])
        })

        it('terminates name at whitespace', () => {
            expect(toString(tokenise('/Name1 /Name2 gs\n'))).toEqual([
                '/Name1 /Name2 gs\n',
            ])
        })

        it('terminates name at a delimiter', () => {
            // Delimiter immediately after /Name1 — no whitespace between.
            expect(toString(tokenise('/Name1[1 2]SC\n'))).toEqual([
                '/Name1[1 2]SC\n',
            ])
        })
    })

    describe('literal strings', () => {
        it('parses a simple literal string Tj', () => {
            expect(toString(tokenise('(Hello) Tj\n'))).toEqual(['(Hello) Tj\n'])
        })

        it('preserves balanced nested parentheses', () => {
            expect(toString(tokenise('(a (b) c) Tj\n'))).toEqual([
                '(a (b) c) Tj\n',
            ])
        })

        it('preserves deeply nested parentheses', () => {
            expect(toString(tokenise('(a (b (c) d) e) Tj\n'))).toEqual([
                '(a (b (c) d) e) Tj\n',
            ])
        })

        it('preserves escaped parentheses via backslash', () => {
            expect(toString(tokenise('(foo\\)bar) Tj\n'))).toEqual([
                '(foo\\)bar) Tj\n',
            ])
        })

        it('preserves escaped backslash', () => {
            expect(toString(tokenise('(foo\\\\bar) Tj\n'))).toEqual([
                '(foo\\\\bar) Tj\n',
            ])
        })

        it('preserves raw newline bytes inside a literal string', () => {
            // PDF literal strings may legally contain raw newlines.
            const ops = tokenise('(line1\nline2) Tj\n')
            expect(toString(ops)).toEqual(['(line1\nline2) Tj\n'])
            // Raw bytes round-trip.
            expect(ops[0].bytes).toEqual(
                bytes(
                    0x28,
                    0x6c,
                    0x69,
                    0x6e,
                    0x65,
                    0x31,
                    0x0a,
                    0x6c,
                    0x69,
                    0x6e,
                    0x65,
                    0x32,
                    0x29,
                    0x20,
                    0x54,
                    0x6a,
                    0x0a,
                ),
            )
        })
    })

    describe('hex strings', () => {
        it('parses a hex string', () => {
            expect(toString(tokenise('<00480065006C006C006F> Tj\n'))).toEqual([
                '<00480065006C006C006F> Tj\n',
            ])
        })

        it('parses an empty hex string', () => {
            expect(toString(tokenise('<> Tj\n'))).toEqual(['<> Tj\n'])
        })
    })

    describe('dictionary operands', () => {
        it('parses << >> as an opaque operand', () => {
            expect(toString(tokenise('/P <</MCID 3>> BDC\n'))).toEqual([
                '/P <</MCID 3>> BDC\n',
            ])
        })

        it('preserves << >> with inner whitespace', () => {
            expect(
                toString(tokenise('/P <</MCID 3 /Lang (en)>> BDC\n')),
            ).toEqual(['/P <</MCID 3 /Lang (en)>> BDC\n'])
        })
    })

    describe('arrays', () => {
        it('parses a numeric array for TJ', () => {
            expect(toString(tokenise('[(He) -10 (llo)] TJ\n'))).toEqual([
                '[(He) -10 (llo)] TJ\n',
            ])
        })

        it('parses nested strings with parens inside an array', () => {
            expect(toString(tokenise('[(a(b)c) 5 (d)] TJ\n'))).toEqual([
                '[(a(b)c) 5 (d)] TJ\n',
            ])
        })

        it('parses an empty array', () => {
            expect(toString(tokenise('[] TJ\n'))).toEqual(['[] TJ\n'])
        })

        it('parses nested arrays', () => {
            expect(toString(tokenise('[[1 2] [3 4]] TJ\n'))).toEqual([
                '[[1 2] [3 4]] TJ\n',
            ])
        })
    })

    describe('operator keyword handling', () => {
        it('parses star-suffix operators like f*', () => {
            expect(toString(tokenise('10 10 m 100 10 l f*\n'))).toEqual([
                '10 10 m ',
                '100 10 l ',
                'f*\n',
            ])
        })

        it('parses star-suffix operators like B*', () => {
            expect(toString(tokenise('B*\n'))).toEqual(['B*\n'])
        })

        it('parses star-suffix operators like W*', () => {
            expect(toString(tokenise('W* n\n'))).toEqual(['W* ', 'n\n'])
        })

        it("parses the single-quote operator (')", () => {
            expect(toString(tokenise("(Hello) '\n"))).toEqual(["(Hello) '\n"])
        })

        it('parses the double-quote operator (")', () => {
            expect(toString(tokenise('1 2 (Hello) "\n'))).toEqual([
                '1 2 (Hello) "\n',
            ])
        })
    })

    describe('typed op dispatch', () => {
        it('emits a SaveStateOp for `q`', () => {
            const ops = tokenise('q\n')
            expect(ops[0]).toBeInstanceOf(SaveStateOp)
        })

        it('emits a RestoreStateOp for `Q`', () => {
            const ops = tokenise('Q\n')
            expect(ops[0]).toBeInstanceOf(RestoreStateOp)
        })

        it('emits the correct typed op for each token in a mixed stream', () => {
            const ops = tokenise(
                '1 0 0 1 10 20 cm\n10 20 m\n30 40 l\nS\n10 20 30 40 re\nf*\nQ\n',
            )
            expect(ops[0]).toBeInstanceOf(SetMatrixOp)
            expect(ops[1]).toBeInstanceOf(MoveToOp)
            expect(ops[2]).toBeInstanceOf(LineToOp)
            expect(ops[3]).toBeInstanceOf(StrokeOp)
            expect(ops[4]).toBeInstanceOf(RectangleOp)
            expect(ops[5]).toBeInstanceOf(FillEvenOddOp)
            expect(ops[6]).toBeInstanceOf(RestoreStateOp)
        })

        it('emits typed text ops for a BT/ET block', () => {
            const ops = tokenise(
                'BT /F1 12 Tf 100 700 Td (Hello) Tj [(He) -10 (llo)] TJ ET\n',
            )
            expect(ops[0]).toBeInstanceOf(BeginTextOp)
            expect(ops[1]).toBeInstanceOf(SetFontOp)
            expect(ops[2]).toBeInstanceOf(MoveTextOp)
            expect(ops[3]).toBeInstanceOf(ShowTextOp)
            expect(ops[4]).toBeInstanceOf(ShowTextArrayOp)
            expect(ops[5]).toBeInstanceOf(EndTextOp)
        })

        it('reads structured fields off the typed ops', () => {
            const ops = tokenise('10 20 m\n/F1 12 Tf\n')
            const move = ops[0] as MoveToOp
            expect(move).toBeInstanceOf(MoveToOp)
            expect(move.x).toBe(10)
            expect(move.y).toBe(20)

            const tf = ops[1] as SetFontOp
            expect(tf).toBeInstanceOf(SetFontOp)
            expect(tf.fontName).toBe('F1')
            expect(tf.fontSize).toBe(12)
        })

        it('emits typed ops for star-suffix operators', () => {
            const ops = tokenise('W* n B*\n')
            expect(ops[0]).toBeInstanceOf(ClipEvenOddOp)
            expect(ops[1]).toBeInstanceOf(EndPathOp)
            expect(ops[2]).toBeInstanceOf(FillAndStrokeEvenOddOp)
        })

        it('typed ops still round-trip their original bytes exactly', () => {
            const input =
                'q\n1 0 0 1 100 200 cm\nBT\n\t/F1 12 Tf\n\t100 700 Td\n\t(Hello) Tj\nET\n[(a) -10 (b)] TJ\nQ\n'
            const ops = tokenise(input)
            // Sanity: these are actually typed subclasses, not bare ContentOps.
            expect(ops[0]).toBeInstanceOf(SaveStateOp)
            expect(ops[1]).toBeInstanceOf(SetMatrixOp)
            expect(ops[2]).toBeInstanceOf(BeginTextOp)
            expect(ops[3]).toBeInstanceOf(SetFontOp)
            // And yet every byte is preserved.
            expect(concatBytes(ops)).toEqual(stringToBytes(input))
        })

        it('falls back to ContentOp for unknown operators', () => {
            const ops = tokenise('42 xyzzy\n')
            expect(ops[0]).toBeInstanceOf(ContentOp)
            // Not one of the typed subclasses.
            expect(ops[0]).not.toBeInstanceOf(SaveStateOp)
        })
    })

    describe('ShowTextArrayOp segments', () => {
        it('parses mixed string/hex/number segments from [...] TJ', () => {
            const ops = tokenise('[(He) -10 <AB> 5 (llo)] TJ\n')
            const tj = ops[0] as ShowTextArrayOp
            expect(tj).toBeInstanceOf(ShowTextArrayOp)
            const segs = tj.segments
            expect(segs).toHaveLength(5)
            expect((segs[0] as { value: string }).value).toBe('He')
            expect((segs[1] as { value: number }).value).toBe(-10)
            expect((segs[2] as { hexString: string }).hexString).toBe('AB')
            expect((segs[3] as { value: number }).value).toBe(5)
            expect((segs[4] as { value: string }).value).toBe('llo')
        })

        it('returns an empty array for an empty TJ operand', () => {
            const ops = tokenise('[] TJ\n')
            expect((ops[0] as ShowTextArrayOp).segments).toEqual([])
        })

        it('honours balanced parens and backslash escapes inside segments', () => {
            const ops = tokenise('[(a\\)b) (c(d)e)] TJ\n')
            const segs = (ops[0] as ShowTextArrayOp).segments
            expect(segs).toHaveLength(2)
            expect((segs[0] as { value: string }).value).toBe('a)b')
            expect((segs[1] as { value: string }).value).toBe('c(d)e')
        })
    })

    describe('text blocks', () => {
        it('emits BT and ET as separate operators', () => {
            expect(
                toString(tokenise('BT /F1 12 Tf 100 700 Td (Hello) Tj ET\n')),
            ).toEqual([
                'BT ',
                '/F1 12 Tf ',
                '100 700 Td ',
                '(Hello) Tj ',
                'ET\n',
            ])
        })

        it('emits two back-to-back BT/ET blocks', () => {
            expect(
                toString(
                    tokenise(
                        'BT /F1 12 Tf 100 700 Td (Hello) Tj ET\nBT /F1 12 Tf 100 680 Td (World) Tj ET\n',
                    ),
                ),
            ).toEqual([
                'BT ',
                '/F1 12 Tf ',
                '100 700 Td ',
                '(Hello) Tj ',
                'ET\n',
                'BT ',
                '/F1 12 Tf ',
                '100 680 Td ',
                '(World) Tj ',
                'ET\n',
            ])
        })
    })

    describe('eof handling', () => {
        it('flushes a final operator only after eof is signalled', () => {
            const tokeniser = new PdfContentStreamTokeniser()
            tokeniser.feedBytes(stringToBytes('q 10 20 m 30 40 l S'))

            // Without a trailing whitespace char, the final "S" cannot be
            // committed yet because the tokeniser doesn't know if more
            // keyword chars are coming.
            const partial: ContentOp[] = []
            for (const op of tokeniser.nextItems()) partial.push(op)
            expect(toString(partial)).toEqual(['q ', '10 20 m ', '30 40 l '])

            tokeniser.eof = true
            const rest: ContentOp[] = []
            for (const op of tokeniser.nextItems()) rest.push(op)
            expect(toString(rest)).toEqual(['S'])
        })

        it('final operator absorbs all trailing whitespace into its own bytes', () => {
            // Trailing whitespace after the final operator is eaten
            // greedily by that op, not emitted as a separate tail op.
            const ops = tokenise('q\n   \t\n')
            expect(toString(ops)).toEqual(['q\n   \t\n'])
            expect(ops[0].parts().operator).toBe('q')
        })

        it('does not emit a tail op when there is no trailing whitespace', () => {
            const ops = tokenise('q')
            expect(toString(ops)).toEqual(['q'])
        })

        it('emits a whitespace-only op for whitespace-only input', () => {
            const ops = tokenise('   \n\t')
            expect(toString(ops)).toEqual(['   \n\t'])
            expect(ops[0].parts().operator).toBe('')
        })
    })

    // -----------------------------------------------------------------
    // Byte-exact round-tripping
    // -----------------------------------------------------------------
    describe('byte-exact round-trip', () => {
        it('preserves exact whitespace bytes between operators', () => {
            const input = 'q\t10\n20\rm\n\r30 40 l  S Q\n  \t\n'
            const ops = tokenise(input)
            expect(concatBytes(ops)).toEqual(stringToBytes(input))
        })

        it('preserves binary (>= 0x80) bytes inside a literal string', () => {
            // Byte sequence: "( \xFE\xFF ) Tj"
            const input = bytes(
                0x28,
                0x20,
                0xfe,
                0xff,
                0x20,
                0x29,
                0x20,
                0x54,
                0x6a,
            )
            const ops = tokenise(input)
            expect(ops).toHaveLength(1)
            expect(ops[0].bytes).toEqual(input)
        })

        it('preserves binary bytes inside a hex string', () => {
            const input = bytes(
                0x3c,
                0x41,
                0x42,
                0xff,
                0xfe,
                0x3e,
                0x20,
                0x54,
                0x6a,
            )
            const ops = tokenise(input)
            expect(ops).toHaveLength(1)
            expect(ops[0].bytes).toEqual(input)
        })

        it('full round-trip: concatenated op bytes equal the original input byte-for-byte', () => {
            const input =
                'q\n1 0 0 1 100 200 cm\nBT\n\t/F1 12 Tf\n\t100 700 Td\n\t(Hello, World!) Tj\nET\n[(a) -10 (b)] TJ\nQ\n'
            const ops = tokenise(input)
            expect(concatBytes(ops)).toEqual(stringToBytes(input))
        })
    })
})
