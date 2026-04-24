/**
 * Flattened view over N inner arrays.  Mutations route to the specific inner
 * array that owns the affected index, so callers that hold references to the
 * inner arrays see the changes too.
 */
export class MultiArray<T> implements Iterable<T> {
    arrays: T[][]

    /**
     * Monotonic counter bumped on every in-place mutation.  Downstream views
     * (e.g. `ArraySegment`) snapshot this to decide whether cached bounds are
     * still valid.
     */
    private _version: number = 0
    get version(): number {
        return this._version
    }

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
        this._version++
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
        this._version++
    }

    /**
     * Splice at a flat position.  `deleteCount` may span only the inner array
     * that owns `start`; crossing boundaries is not supported (we'd need a
     * multi-pass delete that is rarely worth the complexity).
     */
    splice(start: number, deleteCount: number, ...items: T[]): T[] {
        let result: T[]
        if (start >= this.length) {
            // Append to the end.
            const last = this.lastArray
            result = last.splice(last.length, deleteCount, ...items)
        } else {
            const loc = this.locate(start)
            if (!loc) return []
            result = loc.arr.splice(loc.local, deleteCount, ...items)
        }
        if (deleteCount > 0 || items.length > 0) this._version++
        return result
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
 * A mutable reference cell for a sentinel value.  Multiple runs that
 * share the same boundary (e.g. the show-op between two adjacent TextRuns)
 * hold the **same** SentinelRef, so replacing the referenced item in one
 * place transparently updates all runs' bounds.
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
 * meaning the run's content is strictly *between* the two sentinels.  The
 * `startOffset` / `endOffset` constructor args let callers change that: for
 * example, a TextBlock whose run should include its own BT and ET markers
 * passes `startOffset: 0, endOffset: 1`.
 *
 * Sentinels may hold `null`, meaning "start of array" or "end of array".
 *
 * All mutations route through the backing MultiArray, so other live runs
 * that view the same region see the updates on their next access (since they
 * recompute bounds via `indexOf`).
 */
export class ArraySegment<T> implements Iterable<T>, ArrayLike<T> {
    readonly array: MultiArray<T>
    readonly startSentinel: SentinelRef<T>
    readonly endSentinel: SentinelRef<T>
    readonly startOffset: number
    readonly endOffset: number

    // Bound cache — invalidated on array mutation or sentinel-value change.
    private _cachedArrayVersion: number = -1
    private _cachedStartValue: T | null = null
    private _cachedEndValue: T | null = null
    private _cachedStart: number = 0
    private _cachedEnd: number = 0

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

    /**
     * Refresh `_cachedStart` / `_cachedEnd` if the backing array has mutated
     * or either sentinel ref has been reassigned since the last lookup.
     * Otherwise this is O(1).
     */
    private _resolveBounds(): void {
        const version = this.array.version
        const sVal = this.startSentinel.value
        const eVal = this.endSentinel.value
        if (
            version === this._cachedArrayVersion &&
            sVal === this._cachedStartValue &&
            eVal === this._cachedEndValue
        ) {
            return
        }

        if (sVal === null) {
            this._cachedStart = 0
        } else {
            const i = this.array.indexOf(sVal)
            if (i === -1) {
                throw new Error(
                    'ArraySegment: startSentinel not found in array',
                )
            }
            this._cachedStart = i + this.startOffset
        }

        if (eVal === null) {
            this._cachedEnd = this.array.length
        } else {
            const i = this.array.indexOf(eVal)
            if (i === -1) {
                throw new Error('ArraySegment: endSentinel not found in array')
            }
            this._cachedEnd = i + this.endOffset
        }

        this._cachedArrayVersion = version
        this._cachedStartValue = sVal
        this._cachedEndValue = eVal
    }

    /** Resolve the inclusive-start flat index in the backing array. */
    get start(): number {
        this._resolveBounds()
        return this._cachedStart
    }

    /** Resolve the exclusive-end flat index in the backing array. */
    get end(): number {
        this._resolveBounds()
        return this._cachedEnd
    }

    /**
     * Check run integrity.  Returns `{ ok: true }` if both sentinels are
     * findable and `start <= end`, otherwise `{ ok: false, reason }`.
     *
     * Useful in tests and development assertions; does not throw.
     */
    validate(): { ok: true } | { ok: false; reason: string } {
        const sVal = this.startSentinel.value
        const eVal = this.endSentinel.value
        if (sVal !== null && this.array.indexOf(sVal) === -1) {
            return { ok: false, reason: 'startSentinel not in backing array' }
        }
        if (eVal !== null && this.array.indexOf(eVal) === -1) {
            return { ok: false, reason: 'endSentinel not in backing array' }
        }
        try {
            const s = this.start
            const e = this.end
            if (e < s) {
                return { ok: false, reason: `end (${e}) < start (${s})` }
            }
        } catch (err) {
            return {
                ok: false,
                reason: err instanceof Error ? err.message : String(err),
            }
        }
        return { ok: true }
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

    /** Append at the run's trailing edge. */
    push(item: T): void {
        this.array.splice(this.end, 0, item)
    }

    splice(localStart: number, deleteCount: number, ...items: T[]): T[] {
        const deleted = this.array.splice(
            this.start + localStart,
            deleteCount,
            ...items,
        )

        // When a deleted item was a sentinel boundary and replacement items
        // were provided, rebind the sentinel so neighbouring runs sharing
        // it stay consistent.
        if (items.length > 0 && deleted.length > 0) {
            const sVal = this.startSentinel.value
            const eVal = this.endSentinel.value
            for (const d of deleted) {
                if (sVal !== null && d === sVal) {
                    this.startSentinel.value = items[0]
                }
                if (eVal !== null && d === eVal) {
                    this.endSentinel.value = items[items.length - 1]
                }
            }
        }

        return deleted
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

    /** Replace every item of the run with the given items. */
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
    [n: number]: T
}

/**
 * Build a freestanding run over a single-array MultiArray.  Useful for
 * nodes that aren't yet attached to a content stream.
 */
export function detachedSegment<T>(items: T[] = []): ArraySegment<T> {
    return new ArraySegment<T>(new MultiArray<T>([items]), null, null)
}
