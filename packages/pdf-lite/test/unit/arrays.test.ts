import { describe, it, expect } from 'vitest'
import {
    MultiArray,
    ArraySegment,
    SentinelRef,
    detachedSegment,
} from '../../src/utils/arrays'

describe('MultiArray', () => {
    it('reports total length across inner arrays', () => {
        const m = new MultiArray<number>([[1, 2], [3], [4, 5, 6]])
        expect(m.length).toBe(6)
    })

    it('iterates across inner arrays in order', () => {
        const m = new MultiArray<number>([[1, 2], [], [3, 4]])
        expect([...m]).toEqual([1, 2, 3, 4])
    })

    it('get() returns an item at a flat index', () => {
        const m = new MultiArray<string>([['a', 'b'], ['c'], ['d']])
        expect(m.get(0)).toBe('a')
        expect(m.get(2)).toBe('c')
        expect(m.get(3)).toBe('d')
    })

    it('get() throws when out of bounds', () => {
        const m = new MultiArray<number>([[1, 2]])
        expect(() => m.get(5)).toThrow(/out of bounds/)
    })

    it('setAt() mutates the owning inner array by reference', () => {
        const inner = [1, 2, 3]
        const m = new MultiArray<number>([inner, [4, 5]])
        m.setAt(1, 99)
        expect(inner).toEqual([1, 99, 3])
        expect(m.get(1)).toBe(99)
    })

    it('indexOf() finds by identity across arrays', () => {
        const a = { x: 1 }
        const b = { x: 2 }
        const c = { x: 3 }
        const m = new MultiArray([[a], [b, c]])
        expect(m.indexOf(a)).toBe(0)
        expect(m.indexOf(b)).toBe(1)
        expect(m.indexOf(c)).toBe(2)
        expect(m.indexOf({ x: 1 })).toBe(-1) // different identity
    })

    it('push() appends to the last inner array', () => {
        const last = [3, 4]
        const m = new MultiArray<number>([[1, 2], last])
        m.push(5)
        expect(last).toEqual([3, 4, 5])
        expect(m.length).toBe(5)
    })

    it('splice() routes insertion to the owning inner array', () => {
        const a = [1, 2]
        const b = [3, 4]
        const m = new MultiArray<number>([a, b])
        m.splice(3, 0, 99)
        expect(a).toEqual([1, 2])
        expect(b).toEqual([3, 99, 4])
    })

    it('splice() past end appends to the last inner array', () => {
        const a = [1]
        const b = [2, 3]
        const m = new MultiArray<number>([a, b])
        m.splice(99, 0, 4, 5)
        expect(a).toEqual([1])
        expect(b).toEqual([2, 3, 4, 5])
    })

    it('version bumps on setAt / push / splice but not on no-op splice', () => {
        const m = new MultiArray<number>([[1, 2, 3]])
        const v0 = m.version
        m.setAt(0, 9)
        expect(m.version).toBeGreaterThan(v0)

        const v1 = m.version
        m.push(4)
        expect(m.version).toBeGreaterThan(v1)

        const v2 = m.version
        m.splice(1, 1, 99)
        expect(m.version).toBeGreaterThan(v2)

        const v3 = m.version
        m.splice(0, 0) // no-op: nothing added, nothing removed
        expect(m.version).toBe(v3)
    })

    it('convenience methods mirror Array semantics', () => {
        const m = new MultiArray<number>([
            [1, 2],
            [3, 4, 5],
        ])
        expect(m.find((n) => n > 2)).toBe(3)
        expect(m.findLast((n) => n > 2)).toBe(5)
        expect(m.some((n) => n === 4)).toBe(true)
        expect(m.some((n) => n === 99)).toBe(false)
        expect(m.filter((n) => n % 2 === 0)).toEqual([2, 4])
        expect(m.map((n) => n * 2)).toEqual([2, 4, 6, 8, 10])
    })
})

// Small factory: builds a single-array MultiArray backing a sentinel-bounded
// segment, returning both so tests can assert on the raw inner array too.
function makeSegment<T>(
    items: T[],
    startSentinel: T | null,
    endSentinel: T | null,
    startOffset = 1,
    endOffset = 0,
) {
    const array = new MultiArray<T>([items])
    const segment = new ArraySegment<T>(
        array,
        startSentinel,
        endSentinel,
        startOffset,
        endOffset,
    )
    return { array, inner: items, segment }
}

describe('ArraySegment', () => {
    // Tests below use string sentinels (e.g. '__bt__') and plain string data.
    // Strings compare by identity via `===` for primitives, so this faithfully
    // models the sentinel-by-identity semantics that ContentOp uses in the
    // real codebase — without bringing in tricky mixed-type arrays.
    const BT = '__bt__'
    const ET = '__et__'

    describe('bounds', () => {
        it('null sentinels cover the whole array', () => {
            const { segment } = makeSegment([1, 2, 3], null, null)
            expect(segment.length).toBe(3)
            expect([...segment]).toEqual([1, 2, 3])
        })

        it('strict between-sentinel default (startOffset=1, endOffset=0)', () => {
            const { segment } = makeSegment([BT, 'a', 'b', ET], BT, ET)
            expect([...segment]).toEqual(['a', 'b'])
        })

        it('end-inclusive via endOffset=1', () => {
            const show = '__show__'
            const { segment } = makeSegment([BT, 'op', show], BT, show, 1, 1)
            expect([...segment]).toEqual(['op', show])
        })

        it('length clamps to zero when end <= start', () => {
            const { segment } = makeSegment([BT, ET], BT, ET)
            expect(segment.length).toBe(0)
            expect([...segment]).toEqual([])
        })
    })

    describe('indexed access (Proxy)', () => {
        it('reads via segment[i]', () => {
            const { segment } = makeSegment([BT, 'a', 'b', ET], BT, ET)
            expect(segment[0]).toBe('a')
            expect(segment[1]).toBe('b')
        })

        it('returns undefined for out-of-range indices', () => {
            const { segment } = makeSegment([1, 2, 3], null, null)
            expect(segment[99]).toBeUndefined()
        })

        it('writes via segment[i] = x', () => {
            const { inner, segment } = makeSegment([1, 2, 3, 4], null, null)
            segment[1] = 99
            expect(inner).toEqual([1, 99, 3, 4])
        })
    })

    describe('mutation', () => {
        it('push inserts before the end sentinel', () => {
            const { inner, segment } = makeSegment([BT, ET], BT, ET)
            segment.push('x')
            segment.push('y')
            expect(inner).toEqual([BT, 'x', 'y', ET])
            expect([...segment]).toEqual(['x', 'y'])
        })

        it('splice replaces within the segment', () => {
            const { inner, segment } = makeSegment([BT, 'a', 'b', ET], BT, ET)
            segment.splice(0, 2, 'c')
            expect(inner).toEqual([BT, 'c', ET])
        })

        it('replaceAll wipes and repopulates', () => {
            const { inner, segment } = makeSegment([BT, 'a', 'b', ET], BT, ET)
            segment.replaceAll(['x', 'y'])
            expect(inner).toEqual([BT, 'x', 'y', ET])
        })

        it('removeWhere drops matching items', () => {
            const { inner, segment } = makeSegment(
                [BT, 'keep', 'drop', 'keep', 'drop', ET],
                BT,
                ET,
            )
            segment.removeWhere((v) => v === 'drop')
            expect(inner).toEqual([BT, 'keep', 'keep', ET])
        })
    })

    describe('sentinel model', () => {
        it('recomputes bounds after an array mutation (version bump)', () => {
            const { segment } = makeSegment([BT, 'a', ET], BT, ET)
            expect(segment.length).toBe(1)
            segment.push('b')
            expect([...segment]).toEqual(['a', 'b'])
        })

        it('reflects a SentinelRef value change without an array mutation', () => {
            const items = ['a', 'b', 'c', 'd']
            const array = new MultiArray<string>([items])
            const startRef = new SentinelRef<string>(items[0])
            const endRef = new SentinelRef<string>(items[3])
            const segment = new ArraySegment<string>(array, startRef, endRef)

            expect([...segment]).toEqual(['b', 'c'])
            // Narrow the segment by moving the end sentinel left.
            endRef.value = 'c'
            expect([...segment]).toEqual(['b'])
        })

        it('two segments sharing a SentinelRef see swaps through it', () => {
            const MID = '__mid__'
            const items = [BT, MID, ET]
            const array = new MultiArray<string>([items])
            const leftRef = new SentinelRef<string>(BT)
            const sharedRef = new SentinelRef<string>(MID)
            const rightRef = new SentinelRef<string>(ET)
            const segA = new ArraySegment<string>(
                array,
                leftRef,
                sharedRef,
                1,
                1,
            )
            const segB = new ArraySegment<string>(
                array,
                sharedRef,
                rightRef,
                1,
                0,
            )
            expect([...segA]).toEqual([MID])
            expect([...segB]).toEqual([])

            // Replace MID in the backing and update the shared ref.
            const NEW_MID = '__new-mid__'
            items.splice(1, 1, NEW_MID)
            array.setAt(0, BT) // bump version
            sharedRef.value = NEW_MID
            expect([...segA]).toEqual([NEW_MID])
            expect([...segB]).toEqual([])
        })

        it('throws when the start sentinel disappears', () => {
            const { inner, array, segment } = makeSegment([BT, ET], BT, ET)
            inner.splice(0, 1) // remove BT directly
            array.setAt(0, ET) // bump version so the cache invalidates
            expect(() => segment.length).toThrow(/startSentinel not found/)
        })

        it('throws when the end sentinel disappears', () => {
            const { inner, array, segment } = makeSegment([BT, 'a', ET], BT, ET)
            inner.splice(2, 1) // remove ET
            array.setAt(0, BT) // bump version
            expect(() => segment.length).toThrow(/endSentinel not found/)
        })
    })

    describe('validate()', () => {
        it('returns ok when both sentinels are present and ordered', () => {
            const { segment } = makeSegment([BT, ET], BT, ET)
            expect(segment.validate()).toEqual({ ok: true })
        })

        it('reports a missing start sentinel', () => {
            const { segment } = makeSegment([ET], BT, ET)
            const res = segment.validate()
            expect(res.ok).toBe(false)
            if (!res.ok) expect(res.reason).toMatch(/startSentinel/)
        })

        it('reports a missing end sentinel', () => {
            const { segment } = makeSegment([BT], BT, ET)
            const res = segment.validate()
            expect(res.ok).toBe(false)
            if (!res.ok) expect(res.reason).toMatch(/endSentinel/)
        })
    })

    describe('iteration helpers', () => {
        it('find / findIndex / indexOf / some', () => {
            const { segment } = makeSegment([BT, 'a', 'b', ET], BT, ET)
            expect(segment.find((v) => v === 'b')).toBe('b')
            expect(segment.findIndex((v) => v === 'b')).toBe(1)
            expect(segment.indexOf('a')).toBe(0)
            expect(segment.indexOf(ET)).toBe(-1) // outside the bounds
            expect(segment.some((v) => v === 'a')).toBe(true)
        })

        it('findLast / findLastIndex', () => {
            const { segment } = makeSegment([BT, 'dup', 'dup', ET], BT, ET)
            expect(segment.findLastIndex((v) => v === 'dup')).toBe(1)
        })
    })
})

describe('detachedSegment()', () => {
    it('wraps a fresh MultiArray with null sentinels', () => {
        const seg = detachedSegment<number>([1, 2, 3])
        expect(seg.length).toBe(3)
        expect([...seg]).toEqual([1, 2, 3])
    })

    it('supports push and replaceAll with no end sentinel', () => {
        const seg = detachedSegment<number>([1])
        seg.push(2)
        seg.push(3)
        expect([...seg]).toEqual([1, 2, 3])
        seg.replaceAll([9, 8])
        expect([...seg]).toEqual([9, 8])
    })

    it('defaults to empty', () => {
        const seg = detachedSegment<number>()
        expect(seg.length).toBe(0)
    })
})
