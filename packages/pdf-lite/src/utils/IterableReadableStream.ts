export class IterableReadableStream<T> extends ReadableStream<T> {
    [Symbol.asyncIterator]() {
        const reader = this.getReader()
        return {
            async next(): Promise<IteratorResult<T>> {
                const result = await reader.read()
                return result as IteratorResult<T>
            },
        }
    }
}
