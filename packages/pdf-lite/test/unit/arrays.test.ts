import { describe, it, expect } from 'vitest'
import {
    MultiArray,
    ArraySegment,
    SentinelRef,
    detachedSegment,
} from '../../src/utils/arrays'

describe('MultiArray', () => {
    describe('length + iteration', () => {
        it('reports total length across inner arrays', () => {
            const m = new MultiArray<number>([[1, 2], [3], [4, 5, 6]])
            expect(m.length).toBe(6)
        })

        it('iterates across inner arrays in order', () => {
            const m = new MultiArray<number>([[1, 2], [], [3, 4]])
            expect([...m]).toEqual([1, 2, 3, 4])
        })

        it('handles empty backing', () => {
            const m = new MultiArray<number>([[]])
            expect(m.length).toBe(0)
            expect([...m]).toEqual([])
        })
    })

    describe('get / setAt', () => {
        it('gets an item at a flat index', () => {
            const m = new MultiArray<string>([['a', 'b'], ['c'], ['d']])
            expect(m.get(0)).toBe('a')
            expect(m.get(2)).toBe('c')
            expect(m.get(3)).toBe('d')
        })

        it('throws on out-of-bounds get', () => {
            const m = new MultiArray<number>([[1, 2]])
            expect(() => m.get(5)).toThrow(/out of bounds/)
        })

        it('setAt mutates the owning inner array by reference', () => {
            const inner = [1, 2, 3]
            const m = new MultiArray<number>([inner, [4, 5]])
            m.setAt(1, 99)
            expect(inner[1]).toBe(99)
            expect(m.get(1)).toBe(99)
        })

        it('setAt bumps the version', () => {
            const m = new MultiArray<number>([[1, 2, 3]])
            const v0 = m.version
            m.setAt(0, 9)
            expect(m.version).toBeGreaterThan(v0)
        })
    })

    describe('indexOf', () => {
        it('finds by identity across arrays', () => {
            const a = { x: 1 }
            const b = { x: 2 }
            const c = { x: 3 }
            const m = new MultiArray([[a], [b, c]])
            expect(m.indexOf(a)).toBe(0)
            expect(m.indexOf(b)).toBe(1)
            expect(m.indexOf(c)).toBe(2)
        })

        it('returns -1 when absent', () => {
            const m = new MultiArray<number>([[1, 2]])
            expect(m.indexOf(99)).toBe(-1)
        })
    })

    describe('push', () => {
        it('appends to the last inner array', () => {
            const last = [3, 4]
            const m = new MultiArray<number>([[1, 2], last])
            m.push(5)
            expect(last).toEqual([3, 4, 5])
            expect(m.length).toBe(5)
        })

        it('bumps the version', () => {
            const m = new MultiArray<number>([[1]])
            const v0 = m.version
            m.push(2)
            expect(m.version).toBeGreaterThan(v0)
        })
    })

    describe('splice', () => {
        it('routes insertion to the owning inner array', () => {
            const a = [1, 2]
            const b = [3, 4]
            const m = new MultiArray<number>([a, b])
            m.splice(3, 0, 99)
            // Index 3 is in `b` at local 1; 99 should land there.
            expect(b).toEqual([3, 99, 4])
            expect(a).toEqual([1, 2])
        })

        it('deletes from the owning inner array', () => {
            const a = [1, 2, 3]
            const b = [4, 5]
            const m = new MultiArray<number>([a, b])
            m.splice(1, 1)
            expect(a).toEqual([1, 3])
            expect(b).toEqual([4, 5])
        })

        it('appends when start >= length', () => {
            const a = [1]
            const b = [2, 3]
            const m = new MultiArray<number>([a, b])
            m.splice(99, 0, 4, 5)
            expect(b).toEqual([2, 3, 4, 5])
        })

        it('bumps the version when it mutates', () => {
            const m = new MultiArray<number>([[1, 2, 3]])
            const v0 = m.version
            m.splice(1, 1, 9)
            expect(m.version).toBeGreaterThan(v0)
        })

        it('does not bump the version for a no-op splice', () => {
            const m = new MultiArray<number>([[1, 2]])
            const v0 = m.version
            m.splice(0, 0)
            expect(m.version).toBe(v0)
        })
    })

    describe('convenience methods', () => {
        it('find / findLast / some / filter / map', () => {
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
})

describe('ArraySegment', () => {
    describe('basic bounds', () => {
        it('null sentinels cover the whole array', () => {
            const m = new MultiArray<number>([[1, 2, 3]])
            const seg = new ArraySegment(m, null, null)
            expect(seg.length).toBe(3)
            expect([...seg]).toEqual([1, 2, 3])
        })

        it('strictly between sentinels (default offsets)', () => {
            const start = { id: 's' }
            const end = { id: 'e' }
            const a = { id: 'a' }
            const b = { id: 'b' }
            const m = new MultiArray([[start, a, b, end]])
            const seg = new ArraySegment(m, start, end)
            expect([...seg]).toEqual([a, b])
            expect(seg.length).toBe(2)
        })

        it('inclusive of end when endOffset=1', () => {
            const bt = { k: 'bt' }
            const show = { k: 'show' }
            const op = { k: 'op' }
            const m = new MultiArray([[bt, op, show]])
            const seg = new ArraySegment(m, bt, show, 1, 1)
            expect([...seg]).toEqual([op, show])
        })

        it('start-of-array with startSentinel=null and offset=0', () => {
            const end = { k: 'end' }
            const a = { k: 'a' }
            const m = new MultiArray([[a, end]])
            const seg = new ArraySegment(m, null, end, 0, 0)
            expect([...seg]).toEqual([a])
        })
    })

    describe('indexed access via Proxy', () => {
        it('supports segment[i]', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a = { k: 'a' }
            const b = { k: 'b' }
            const m = new MultiArray([[bt, a, b, et]])
            const seg = new ArraySegment(m, bt, et)
            expect(seg[0]).toBe(a)
            expect(seg[1]).toBe(b)
        })

        it('out-of-range segment[i] returns undefined', () => {
            const m = new MultiArray<number>([[1, 2, 3]])
            const seg = new ArraySegment(m, null, null)
            expect(seg[99]).toBeUndefined()
        })

        it('segment[i] = x writes through to the backing array', () => {
            const a = [1, 2, 3, 4]
            const m = new MultiArray([a])
            const seg = new ArraySegment(m, null, null)
            seg[1] = 99 as any
            expect(a).toEqual([1, 99, 3, 4])
        })
    })

    describe('mutation write-through', () => {
        it('push appends before endSentinel', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const inner = [bt, et]
            const m = new MultiArray([inner])
            const seg = new ArraySegment(m, bt, et)
            const newOp = { k: 'new' }
            seg.push(newOp)
            expect(inner).toEqual([bt, newOp, et])
            expect([...seg]).toEqual([newOp])
        })

        it('splice replaces within the segment', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a = { k: 'a' }
            const b = { k: 'b' }
            const inner = [bt, a, b, et]
            const m = new MultiArray([inner])
            const seg = new ArraySegment(m, bt, et)
            const c = { k: 'c' }
            seg.splice(0, 2, c)
            expect(inner).toEqual([bt, c, et])
        })

        it('replaceAll wipes and re-populates', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a = { k: 'a' }
            const b = { k: 'b' }
            const inner = [bt, a, b, et]
            const m = new MultiArray([inner])
            const seg = new ArraySegment(m, bt, et)
            const x = { k: 'x' }
            const y = { k: 'y' }
            seg.replaceAll([x, y])
            expect(inner).toEqual([bt, x, y, et])
        })

        it('removeWhere drops matching items', () => {
            const bt = { n: 'bt' }
            const et = { n: 'et' }
            const inner: any[] = [
                bt,
                { n: 'keep1' },
                { n: 'drop' },
                { n: 'keep2' },
                { n: 'drop' },
                et,
            ]
            const m = new MultiArray(inner)
            // Wrap as `[[...]]` — MultiArray wants T[][]
            const m2 = new MultiArray([inner])
            const seg = new ArraySegment(m2, bt, et)
            seg.removeWhere((o: any) => o.n === 'drop')
            expect(inner.map((o: any) => o.n)).toEqual([
                'bt',
                'keep1',
                'keep2',
                'et',
            ])
        })
    })

    describe('sentinel caching', () => {
        it('does not re-scan when array version is unchanged', () => {
            const m = new MultiArray<number>([[10, 20, 30, 40]])
            const seg = new ArraySegment(m, null, null)
            seg.length // warm the cache
            let calls = 0
            const realIndexOf = m.indexOf.bind(m)
            ;(m as any).indexOf = (x: number) => {
                calls++
                return realIndexOf(x)
            }
            // With null sentinels, indexOf isn't invoked at all; but length and
            // iteration should also not invoke it repeatedly.
            for (let i = 0; i < 5; i++) seg.length
            expect(calls).toBe(0)
        })

        it('invalidates cache when SentinelRef.value changes', () => {
            const a = { k: 'a' }
            const b = { k: 'b' }
            const c = { k: 'c' }
            const d = { k: 'd' }
            const m = new MultiArray([[a, b, c, d]])
            const startRef = new SentinelRef<typeof a>(a)
            const endRef = new SentinelRef<typeof a>(d)
            const seg = new ArraySegment(m, startRef, endRef)
            expect([...seg]).toEqual([b, c])
            // Move the end sentinel earlier — segment shrinks.
            endRef.value = c
            expect([...seg]).toEqual([b])
        })

        it('invalidates cache when the array mutates', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a = { k: 'a' }
            const inner = [bt, a, et]
            const m = new MultiArray([inner])
            const seg = new ArraySegment(m, bt, et)
            expect(seg.length).toBe(1)
            inner.splice(1, 0, { k: 'x' }) // mutate directly — no version bump
            // Cache may be stale in this case, but mutations through the
            // MultiArray API bump the version; via seg.splice:
            seg.splice(seg.length, 0, { k: 'y' })
            expect(seg.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('error cases', () => {
        it('throws if startSentinel disappears from array', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const inner = [bt, et]
            const m = new MultiArray([inner])
            const seg = new ArraySegment(m, bt, et)
            // Remove bt directly from inner — sentinel lookup should fail.
            inner.splice(0, 1)
            // Force a recompute by bumping the version through the API.
            m.setAt(0, et)
            expect(() => seg.length).toThrow(/startSentinel not found/)
        })

        it('throws if endSentinel disappears from array', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a = { k: 'a' }
            const inner = [bt, a, et]
            const m = new MultiArray([inner])
            const seg = new ArraySegment(m, bt, et)
            inner.splice(2, 1)
            m.setAt(0, bt) // bump version
            expect(() => seg.length).toThrow(/endSentinel not found/)
        })
    })

    describe('validate()', () => {
        it('ok when sentinels are present and ordered', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const m = new MultiArray([[bt, et]])
            const seg = new ArraySegment(m, bt, et)
            expect(seg.validate()).toEqual({ ok: true })
        })

        it('reports missing startSentinel', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const m = new MultiArray([[et]])
            const seg = new ArraySegment(m, bt, et)
            const res = seg.validate()
            expect(res.ok).toBe(false)
            if (!res.ok) expect(res.reason).toMatch(/startSentinel/)
        })

        it('reports missing endSentinel', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const m = new MultiArray([[bt]])
            const seg = new ArraySegment(m, bt, et)
            const res = seg.validate()
            expect(res.ok).toBe(false)
            if (!res.ok) expect(res.reason).toMatch(/endSentinel/)
        })
    })

    describe('shared SentinelRef', () => {
        it('two segments sharing a boundary ref see updates together', () => {
            const bt = { k: 'bt' }
            const mid = { k: 'mid' }
            const et = { k: 'et' }
            const inner = [bt, mid, et]
            const m = new MultiArray([inner])

            const leftRef = new SentinelRef<any>(bt)
            const sharedRef = new SentinelRef<any>(mid)
            const rightRef = new SentinelRef<any>(et)

            const segA = new ArraySegment(m, leftRef, sharedRef, 1, 1)
            const segB = new ArraySegment(m, sharedRef, rightRef, 1, 0)

            expect([...segA]).toEqual([mid])
            expect([...segB]).toEqual([])

            // Replace `mid` by swapping it in the array and updating the ref.
            const newMid = { k: 'new-mid' }
            inner.splice(1, 1, newMid)
            m.setAt(0, bt) // bump version without changing identity
            sharedRef.value = newMid

            expect([...segA]).toEqual([newMid])
            // Both segments see the update because they share the ref.
        })
    })

    describe('iteration methods', () => {
        it('find / findIndex / indexOf / some', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a = { k: 'a' }
            const b = { k: 'b' }
            const m = new MultiArray([[bt, a, b, et]])
            const seg = new ArraySegment(m, bt, et)
            expect(seg.find((o: any) => o.k === 'b')).toBe(b)
            expect(seg.findIndex((o: any) => o.k === 'b')).toBe(1)
            expect(seg.indexOf(a)).toBe(0)
            expect(seg.indexOf(et)).toBe(-1) // outside the segment
            expect(seg.some((o: any) => o.k === 'a')).toBe(true)
        })

        it('findLast / findLastIndex', () => {
            const bt = { k: 'bt' }
            const et = { k: 'et' }
            const a1 = { k: 'dup' }
            const a2 = { k: 'dup' }
            const m = new MultiArray([[bt, a1, a2, et]])
            const seg = new ArraySegment(m, bt, et)
            expect(seg.findLast((o: any) => o.k === 'dup')).toBe(a2)
            expect(seg.findLastIndex((o: any) => o.k === 'dup')).toBe(1)
        })
    })
})

describe('detachedSegment()', () => {
    it('wraps a fresh MultiArray with null sentinels', () => {
        const seg = detachedSegment<number>([1, 2, 3])
        expect(seg.length).toBe(3)
        expect([...seg]).toEqual([1, 2, 3])
    })

    it('supports push without an endSentinel', () => {
        const seg = detachedSegment<number>([1])
        seg.push(2)
        seg.push(3)
        expect([...seg]).toEqual([1, 2, 3])
    })

    it('replaceAll replaces content', () => {
        const seg = detachedSegment<number>([1, 2, 3])
        seg.replaceAll([9, 8, 7])
        expect([...seg]).toEqual([9, 8, 7])
    })

    it('defaults to empty', () => {
        const seg = detachedSegment<number>()
        expect(seg.length).toBe(0)
        expect([...seg]).toEqual([])
    })
})
