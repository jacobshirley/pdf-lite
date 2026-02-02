import { PdfEndDictionaryToken } from '../tokens/end-dictionary-token.js'
import { PdfStartDictionaryToken } from '../tokens/start-dictionary-token.js'
import { PdfToken } from '../tokens/token.js'
import { PdfWhitespaceToken } from '../tokens/whitespace-token.js'
import { PdfName } from './pdf-name.js'
import { PdfObject } from './pdf-object.js'

export type PdfDictionaryEntry = PdfObject | undefined
export type PdfDictionaryEntries = Record<string, PdfDictionaryEntry>
export type PdfDictionaryMap = Map<PdfName, PdfObject | undefined>

export class PdfDictionary<
    T extends PdfDictionaryEntries = PdfDictionaryEntries,
> extends PdfObject {
    #entries: PdfDictionaryMap
    innerTokens: PdfToken[] = []

    constructor(entries?: T | PdfDictionaryMap) {
        super()

        this.#entries = entries instanceof Map ? entries : new Map<any, any>()
        if (entries) {
            for (const [key, value] of Object.entries(entries)) {
                this.#entries.set(new PdfName(key), value)
            }
        }
    }

    get<K extends Extract<keyof T, string>>(
        key: PdfName<K> | K,
    ): T[K] | undefined {
        if (key instanceof PdfName) {
            return this.#entries.get(key) as T[K] | undefined
        } else {
            for (const [k, v] of this.#entries) {
                if (k.value === key) {
                    return v as T[K] | undefined
                }
            }
        }
    }

    set<K extends Extract<keyof T, string>>(key: PdfName<K> | K, value: T[K]) {
        const currentValue = this.get(key)
        if (currentValue !== value && !currentValue?.equals(value)) {
            this.modified = true
        }

        if (key instanceof PdfName) {
            this.#entries.set(key, value)
            return
        } else {
            for (const k of this.#entries.keys()) {
                if (k.value === key) {
                    this.#entries.set(k, value)
                    return
                }
            }
        }
        this.#entries.set(new PdfName(key), value)
    }

    delete<K extends Extract<keyof T, string>>(key: PdfName<K> | K) {
        if (this.has(key)) {
            this.modified = true
        }

        if (key instanceof PdfName) {
            this.#entries.delete(key)
            return
        } else {
            for (const k of this.#entries.keys()) {
                if (k.value === key) {
                    this.#entries.delete(k)
                    return
                }
            }
        }
    }

    has<K extends Extract<keyof T, string>>(key: PdfName<K> | K): boolean {
        if (key instanceof PdfName) {
            return this.#entries.has(key)
        } else {
            for (const k of this.#entries.keys()) {
                if (k.value === key) {
                    return true
                }
            }
        }
        return false
    }

    get values(): {
        readonly [K in Extract<keyof T, string>]: T[K]
    } {
        const obj: Partial<T> = {}
        for (const [key, value] of this.#entries) {
            obj[key.value as Extract<keyof T, string>] = value as T[Extract<
                keyof T,
                string
            >]
        }
        return obj as T
    }

    /**
     * Returns an iterator for the dictionary entries.
     * Each entry is a tuple of [key string, value].
     */
    entries(): IterableIterator<[string, PdfObject | undefined]> {
        const entries = Array.from(this.#entries.entries()).map(
            ([key, value]) =>
                [key.value, value] as [string, PdfObject | undefined],
        )
        return entries[Symbol.iterator]()
    }

    protected tokenize() {
        let index = 0

        const entries = Array.from(this.#entries.entries()).flatMap(
            ([key, value]) => {
                if (value === undefined) {
                    return []
                }

                const preTokens = key.preTokens
                    ? []
                    : index === 0
                      ? [PdfWhitespaceToken.SPACE]
                      : []

                const centralTokens =
                    key.postTokens || value.preTokens
                        ? []
                        : [PdfWhitespaceToken.SPACE]

                const postTokens = value.postTokens
                    ? []
                    : [PdfWhitespaceToken.SPACE]

                index++
                return [
                    ...preTokens,
                    ...key.toTokens(),
                    ...centralTokens,
                    ...value.toTokens(),
                    ...postTokens,
                ]
            },
        )

        return [
            new PdfStartDictionaryToken(),
            ...this.innerTokens,
            ...entries,
            new PdfEndDictionaryToken(),
        ]
    }

    copyFrom(other: PdfDictionary<any>) {
        for (const [key, value] of other.#entries) {
            this.#entries.set(key, value)
        }
        this.modified = true
    }

    clone(): this {
        const clonedEntries = new Map<PdfName, PdfObject | undefined>()
        for (const [key, value] of this.#entries) {
            clonedEntries.set(key.clone(), value ? value.clone() : undefined)
        }
        return new PdfDictionary(clonedEntries) as this
    }

    isModified(): boolean {
        return (
            super.isModified() ||
            Array.from(this.#entries.values()).some((v) => v?.isModified())
        )
    }
}
