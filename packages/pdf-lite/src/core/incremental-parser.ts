import { Parser } from './parser'

export class NoMoreTokensError extends Error {}
export class EofReachedError extends Error {}

export abstract class IncrementalParser<I, O> extends Parser<I, O> {
    protected inputOffset: number = 0
    protected outputOffset: number = 0

    protected buffer: I[] = []
    protected bufferIndex: number = 0

    eof: boolean = false

    feed(...input: (I | I[])[]): void {
        for (const item of input) {
            if (Array.isArray(item)) {
                for (const subItem of item) {
                    this.buffer.push(subItem)
                }

                continue
            }

            this.buffer.push(item)
        }
    }

    protected atEof(): boolean {
        return this.eof && this.bufferIndex >= this.buffer.length
    }

    protected peek(ahead: number = 0): I | null {
        const index = this.bufferIndex + ahead
        if (index >= this.buffer.length) {
            if (!this.eof) {
                throw new NoMoreTokensError('No more items available')
            }
            return null
        }
        return this.buffer[index]
    }

    protected next(): I {
        if (this.bufferIndex >= this.buffer.length) {
            if (!this.eof) {
                throw new NoMoreTokensError('No more items available')
            }
            throw new EofReachedError('End of file reached')
        }
        this.inputOffset++
        return this.buffer[this.bufferIndex++]
    }

    private expectValue<T extends I>(
        value: I,
        itemType: (new (...args: any[]) => T) | T,
    ): T {
        if (typeof itemType === 'function') {
            if (!(value instanceof itemType)) {
                throw new Error(
                    `[offset: ${this.inputOffset}] Expected ${itemType.name} but got ${value}`,
                )
            }
            return value as T
        }

        if (value !== itemType) {
            const type =
                typeof value === 'object'
                    ? (value?.constructor.name ?? value)
                    : value

            throw new Error(
                `[offset: ${this.inputOffset}] Expected ${itemType} but got ${type}`,
            )
        }
        return value as T
    }

    protected expect<T extends I>(
        itemType: (new (...args: any[]) => T) | T,
    ): T {
        const item = this.next()
        return this.expectValue(item, itemType)
    }

    protected oneOf(...fn: (() => O)[]): O {
        for (const f of fn) {
            const savedOffset = this.inputOffset
            const savedIndex = this.bufferIndex

            try {
                return f.bind(this)()
            } catch (err) {
                if (err instanceof NoMoreTokensError) {
                    throw err
                }
                this.inputOffset = savedOffset
                this.bufferIndex = savedIndex
            }
        }

        throw new Error('No parsing function succeeded')
    }

    /**
     * Compacts the buffer by removing consumed items
     */
    protected compact(): void {
        if (this.bufferIndex > 0) {
            this.buffer = this.buffer.slice(this.bufferIndex)
            this.bufferIndex = 0
        }
    }

    /**
     * Override to customize when to compact the buffer
     * By default, compacts when more than 1000 items have been consumed
     *
     * @returns boolean indicating whether to compact the buffer
     */
    protected canCompact(): boolean {
        return this.bufferIndex > 1000
    }

    *nextItems(): Generator<O> {
        while (!this.atEof()) {
            const savedIndex = this.bufferIndex

            try {
                yield this.parse()
                this.outputOffset++

                if (this.canCompact()) {
                    this.compact()
                }
            } catch (err) {
                if (!(err instanceof NoMoreTokensError)) {
                    throw err
                }
                this.bufferIndex = savedIndex
                break
            }
        }
    }

    protected abstract parse(): O
}
