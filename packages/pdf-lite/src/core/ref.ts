export type RefUpdateCallback<T> = (oldValue: T, newValue: T) => void

export class Ref<T> {
    value: T | Ref<T>
    callbacks: Array<RefUpdateCallback<T>> = []

    constructor(value: T | Ref<T>) {
        if (value === this) {
            throw new Error('Cannot create Ref to itself')
        }
        this.value = value
    }

    update(newValue: T | Ref<T>) {
        if (newValue === this) {
            return
        }

        const oldValue = this.resolve()
        this.value = newValue
        this.callbacks.forEach((cb) => cb(oldValue, this.resolve()))
    }

    resolve(): T {
        if (this.value instanceof Ref) {
            return this.value.resolve()
        }
        return this.value
    }

    equals(other?: Ref<T> | T): boolean {
        if (other === undefined) {
            return false
        }

        if (other instanceof Ref) {
            return this.resolve() === other.resolve()
        }

        return this.resolve() === other
    }

    onUpdate(callback: RefUpdateCallback<T>): void {
        this.callbacks.push(callback)
    }
}
