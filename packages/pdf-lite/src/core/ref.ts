/**
 * Callback function type for ref update notifications.
 *
 * @typeParam T - The value type of the ref
 */
export type RefUpdateCallback<T> = (oldValue: T, newValue: T) => void

/**
 * A mutable reference wrapper that supports value updates and change notifications.
 * Can hold a direct value or reference another Ref, forming reference chains.
 *
 * @typeParam T - The value type being referenced
 *
 * @example
 * ```typescript
 * const ref = new Ref(42)
 * ref.onUpdate((old, new) => console.log(`Changed from ${old} to ${new}`))
 * ref.update(100) // Logs: Changed from 42 to 100
 * ```
 */
export class Ref<T> {
    /** The current value or a reference to another Ref */
    value: T | Ref<T>
    /** Registered callbacks for update notifications */
    callbacks: Array<RefUpdateCallback<T>> = []

    /**
     * Creates a new Ref with an initial value.
     *
     * @param value - The initial value or another Ref to chain
     * @throws Error if attempting to create a self-referencing Ref
     */
    constructor(value: T | Ref<T>) {
        if (value === this) {
            throw new Error('Cannot create Ref to itself')
        }
        this.value = value
    }

    /**
     * Updates the reference to a new value or another Ref.
     * Notifies all registered callbacks of the change.
     *
     * @param newValue - The new value or Ref to point to
     */
    update(newValue: T | Ref<T>) {
        if (newValue === this) {
            return
        }

        const oldValue = this.resolve()
        this.value = newValue
        this.callbacks.forEach((cb) => cb(oldValue, this.resolve()))
    }

    /**
     * Resolves the reference chain to get the final value.
     *
     * @returns The resolved value of type T
     */
    resolve(): T {
        if (this.value instanceof Ref) {
            return this.value.resolve()
        }
        return this.value
    }

    /**
     * Compares this Ref's resolved value with another value or Ref.
     *
     * @param other - The value or Ref to compare against
     * @returns True if the resolved values are equal
     */
    equals(other?: Ref<T> | T): boolean {
        if (other === undefined) {
            return false
        }

        if (other instanceof Ref) {
            return this.resolve() === other.resolve()
        }

        return this.resolve() === other
    }

    /**
     * Registers a callback to be notified when the value changes.
     *
     * @param callback - The function to call on value updates
     */
    onUpdate(callback: RefUpdateCallback<T>): void {
        this.callbacks.push(callback)
    }
}
