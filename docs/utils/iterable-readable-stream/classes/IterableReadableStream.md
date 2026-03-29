[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/iterable-readable-stream](../README.md) / IterableReadableStream

# Class: IterableReadableStream\<T\>

A ReadableStream that supports async iteration.
Extends the standard ReadableStream with Symbol.asyncIterator support.

## Example

```typescript
const stream = new IterableReadableStream<Uint8Array>(...)
for await (const chunk of stream) {
  console.log(chunk)
}
```

## Extends

- `ReadableStream`\<`T`\>

## Extended by

- [`PdfObjectStream`](../../../core/streams/object-stream/classes/PdfObjectStream.md)

## Type Parameters

### T

`T`

The type of chunks yielded by the stream.

## Constructors

### Constructor

> **new IterableReadableStream**\<`T`\>(`underlyingSource`, `strategy?`): `IterableReadableStream`\<`T`\>

#### Parameters

##### underlyingSource

`UnderlyingDefaultSource`\<`T`\>

##### strategy?

`QueuingStrategy`\<`T`\>

#### Returns

`IterableReadableStream`\<`T`\>

#### Inherited from

`ReadableStream<T>.constructor`

### Constructor

> **new IterableReadableStream**\<`T`\>(`underlyingSource?`, `strategy?`): `IterableReadableStream`\<`T`\>

#### Parameters

##### underlyingSource?

`UnderlyingSource`\<`T`\>

##### strategy?

`QueuingStrategy`\<`T`\>

#### Returns

`IterableReadableStream`\<`T`\>

#### Inherited from

`ReadableStream<T>.constructor`

## Methods

### \[asyncIterator\]()

> **\[asyncIterator\]**(): `object`

Returns an async iterator for the stream.

#### Returns

`object`

An async iterator that yields chunks from the stream.

##### \[asyncDispose\]()

> **\[asyncDispose\]**(): `Promise`\<`void`\>

###### Returns

`Promise`\<`void`\>

##### \[asyncIterator\]()

> **\[asyncIterator\]**(): \{ next(): Promise\<IteratorResult\<T, any\>\>; \[Symbol.asyncIterator\](): ...; \[Symbol.asyncDispose\](): Promise\<void\>; \}

###### Returns

\{ next(): Promise\<IteratorResult\<T, any\>\>; \[Symbol.asyncIterator\](): ...; \[Symbol.asyncDispose\](): Promise\<void\>; \}

##### next()

> **next**(): `Promise`\<`IteratorResult`\<`T`, `any`\>\>

###### Returns

`Promise`\<`IteratorResult`\<`T`, `any`\>\>

#### Overrides

`ReadableStream.[asyncIterator]`
