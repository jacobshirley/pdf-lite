/**
 * Flattened view over N inner arrays.  Mutations route to the specific inner
 * array that owns the affected index, so callers that hold references to the
 * inner arrays see the changes too.
 */
export class MultiArray<T> implements Iterable<T> {
    arrays: T[][]

    constructor(arrays: T[][]) {
        this.arrays = arrays
    }

    *[Symbol.iterator](): IterableIterator<T> {
        for (const arr of this.arrays) {
            for (const item of arr) yield item
        }
    }

    get length(): number {
        let n = 0
        for (const arr of this.arrays) n += arr.length
        return n
    }

    get lastArray(): T[] {
        return this.arrays[this.arrays.length - 1]
    }

    /** Locate the inner array and local index that owns a flat index. */
    private locate(index: number): { arr: T[]; local: number } | undefined {
        let current = 0
        for (const arr of this.arrays) {
            if (current + arr.length > index) {
                return { arr, local: index - current }
            }
            current += arr.length
        }
        return undefined
    }

    get(index: number): T {
        const loc = this.locate(index)
        if (!loc) throw new Error(`MultiArray index ${index} out of bounds`)
        return loc.arr[loc.local]
    }

    setAt(index: number, value: T): void {
        const loc = this.locate(index)
        if (!loc) throw new Error(`MultiArray index ${index} out of bounds`)
        loc.arr[loc.local] = value
    }

    /** Identity-based lookup across all inner arrays. */
    indexOf(item: T): number {
        let offset = 0
        for (const arr of this.arrays) {
            const i = arr.indexOf(item)
            if (i !== -1) return offset + i
            offset += arr.length
        }
        return -1
    }

    /** Append to the last array. */
    push(item: T): void {
        this.lastArray.push(item)
    }

    /**
     * Splice at a flat position.  `deleteCount` may span only the inner array
     * that owns `start`; crossing boundaries is not supported (we'd need a
     * multi-pass delete that is rarely worth the complexity).
     */
    splice(start: number, deleteCount: number, ...items: T[]): T[] {
        if (start >= this.length) {
            // Append to the end.
            const last = this.lastArray
            return last.splice(last.length, deleteCount, ...items)
        }
        const loc = this.locate(start)
        if (!loc) return []
        return loc.arr.splice(loc.local, deleteCount, ...items)
    }

    // --- Convenience (iteration-based) ---

    find(predicate: (item: T) => boolean): T | undefined {
        for (const item of this) if (predicate(item)) return item
        return undefined
    }

    findLast(predicate: (item: T) => boolean): T | undefined {
        let found: T | undefined
        for (const item of this) if (predicate(item)) found = item
        return found
    }

    filter(predicate: (item: T) => boolean): T[] {
        const out: T[] = []
        for (const item of this) if (predicate(item)) out.push(item)
        return out
    }

    map<U>(mapper: (item: T) => U): U[] {
        const out: U[] = []
        for (const item of this) out.push(mapper(item))
        return out
    }

    some(predicate: (item: T) => boolean): boolean {
        for (const item of this) if (predicate(item)) return true
        return false
    }
}

/**
 * A mutable reference cell for a sentinel value.  Multiple segments that
 * share the same boundary (e.g. the show-op between two adjacent TextNodes)
 * hold the **same** SentinelRef, so replacing the referenced item in one
 * place transparently updates all segments' bounds.
 */
export class SentinelRef<T> {
    value: T | null
    constructor(value: T | null) {
        this.value = value
    }
}

/**
 * A live view into a region of a {@link MultiArray}.  Boundaries are tracked by
 * *sentinel items* (by identity), not by integer indices — this way, insertions
 * or deletions elsewhere in the array don't invalidate the region.
 *
 * `startSentinel` and `endSentinel` default to offsets +1 and +0 respectively,
 * meaning the segment's content is strictly *between* the two sentinels.  The
 * `startOffset` / `endOffset` constructor args let callers change that: for
 * example, a TextBlock whose segment should include its own BT and ET markers
 * passes `startOffset: 0, endOffset: 1`.
 *
 * Sentinels may hold `null`, meaning "start of array" or "end of array".
 *
 * All mutations route through the backing MultiArray, so other live segments
 * that view the same region see the updates on their next access (since they
 * recompute bounds via `indexOf`).
 */
export class ArraySegment<T> implements Iterable<T> {
    readonly array: MultiArray<T>
    readonly startSentinel: SentinelRef<T>
    readonly endSentinel: SentinelRef<T>
    readonly startOffset: number
    readonly endOffset: number

    constructor(
        array: MultiArray<T>,
        startSentinel: T | null | SentinelRef<T>,
        endSentinel: T | null | SentinelRef<T>,
        startOffset: number = 1,
        endOffset: number = 0,
    ) {
        this.array = array
        this.startSentinel =
            startSentinel instanceof SentinelRef
                ? startSentinel
                : new SentinelRef(startSentinel)
        this.endSentinel =
            endSentinel instanceof SentinelRef
                ? endSentinel
                : new SentinelRef(endSentinel)
        this.startOffset = startOffset
        this.endOffset = endOffset

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (typeof prop === 'string') {
                    const idx = Number(prop)
                    if (
                        Number.isInteger(idx) &&
                        idx >= 0 &&
                        idx < target.length
                    ) {
                        return target.array.get(target.start + idx)
                    }
                }
                return Reflect.get(target, prop, receiver)
            },
            set(target, prop, value) {
                if (typeof prop === 'string') {
                    const idx = Number(prop)
                    if (Number.isInteger(idx) && idx >= 0) {
                        target.setAt(idx, value)
                        return true
                    }
                }
                return Reflect.set(target, prop, value)
            },
            has(target, prop) {
                if (typeof prop === 'string') {
                    const idx = Number(prop)
                    if (Number.isInteger(idx) && idx >= 0) {
                        return idx < target.length
                    }
                }
                return Reflect.has(target, prop)
            },
        })
    }

    /** Resolve the inclusive-start flat index in the backing array. */
    get start(): number {
        if (this.startSentinel.value === null) return 0
        const i = this.array.indexOf(this.startSentinel.value)
        if (i === -1) {
            throw new Error('ArraySegment: startSentinel not found in array')
        }
        return i + this.startOffset
    }

    /** Resolve the exclusive-end flat index in the backing array. */
    get end(): number {
        if (this.endSentinel.value === null) return this.array.length
        const i = this.array.indexOf(this.endSentinel.value)
        if (i === -1) {
            throw new Error('ArraySegment: endSentinel not found in array')
        }
        return i + this.endOffset
    }

    get length(): number {
        return Math.max(0, this.end - this.start)
    }

    *[Symbol.iterator](): IterableIterator<T> {
        const start = this.start
        const end = this.end
        for (let i = start; i < end; i++) yield this.array.get(i)
    }

    get(i: number): T {
        return this.array.get(this.start + i)
    }

    setAt(i: number, value: T): void {
        this.array.setAt(this.start + i, value)
    }

    /** Append at the segment's trailing edge. */
    push(item: T): void {
        this.array.splice(this.end, 0, item)
    }

    splice(localStart: number, deleteCount: number, ...items: T[]): T[] {
        return this.array.splice(this.start + localStart, deleteCount, ...items)
    }

    indexOf(item: T): number {
        let i = 0
        for (const el of this) {
            if (el === item) return i
            i++
        }
        return -1
    }

    findIndex(predicate: (item: T) => boolean): number {
        let i = 0
        for (const el of this) {
            if (predicate(el)) return i
            i++
        }
        return -1
    }

    find<S extends T>(predicate: (item: T) => item is S): S | undefined
    find(predicate: (item: T) => boolean): T | undefined
    find(predicate: (item: T) => boolean): T | undefined {
        for (const el of this) if (predicate(el)) return el
        return undefined
    }

    findLast<S extends T>(predicate: (item: T) => item is S): S | undefined
    findLast(predicate: (item: T) => boolean): T | undefined
    findLast(predicate: (item: T) => boolean): T | undefined {
        let found: T | undefined
        for (const el of this) if (predicate(el)) found = el
        return found
    }

    findLastIndex(predicate: (item: T) => boolean): number {
        let i = 0
        let found = -1
        for (const el of this) {
            if (predicate(el)) found = i
            i++
        }
        return found
    }

    filter<S extends T>(predicate: (item: T) => item is S): S[]
    filter(predicate: (item: T) => boolean): T[]
    filter(predicate: (item: T) => boolean): T[] {
        const out: T[] = []
        for (const el of this) if (predicate(el)) out.push(el)
        return out
    }

    map<U>(mapper: (item: T) => U): U[] {
        const out: U[] = []
        for (const el of this) out.push(mapper(el))
        return out
    }

    some(predicate: (item: T) => boolean): boolean {
        for (const el of this) if (predicate(el)) return true
        return false
    }

    /** Remove every item matching `predicate`, preserving order of the rest. */
    removeWhere(predicate: (item: T) => boolean): void {
        const snapshot = [...this]
        for (let i = snapshot.length - 1; i >= 0; i--) {
            if (predicate(snapshot[i])) this.splice(i, 1)
        }
    }

    /** Replace every item of the segment with the given items. */
    replaceAll(items: T[]): void {
        this.splice(0, this.length, ...items)
    }

    toArray(): T[] {
        return [...this]
    }

    toString(): string {
        return this.toArray().toString()
    }
}

// Make indexed access typecheck via declaration merging.
export interface ArraySegment<T> {
    readonly [n: number]: T
}

/**
 * Build a freestanding segment over a single-array MultiArray.  Useful for
 * nodes that aren't yet attached to a content stream.
 */
export function detachedSegment<T>(items: T[] = []): ArraySegment<T> {
    return new ArraySegment<T>(new MultiArray<T>([items]), null, null)
}
