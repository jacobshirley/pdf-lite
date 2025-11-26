[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/streams/object-stream](../README.md) / PdfObjectStream

# Class: PdfObjectStream

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

- [`IterableReadableStream`](../../../../utils/IterableReadableStream/classes/IterableReadableStream.md)\<[`PdfObject`](../../../objects/pdf-object/classes/PdfObject.md)\>

## Constructors

### Constructor

> **new PdfObjectStream**(`input`): `PdfObjectStream`

#### Parameters

##### input

`Iterable`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md), `any`, `any`\> | `AsyncIterable`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md), `any`, `any`\>

#### Returns

`PdfObjectStream`

#### Overrides

[`IterableReadableStream`](../../../../utils/IterableReadableStream/classes/IterableReadableStream.md).[`constructor`](../../../../utils/IterableReadableStream/classes/IterableReadableStream.md#constructor)

## Methods

### \[asyncIterator\]()

> **\[asyncIterator\]**(): `object`

Returns an async iterator for the stream.

#### Returns

`object`

An async iterator that yields chunks from the stream.

##### next()

> **next**(): `Promise`\<`IteratorResult`\<[`PdfObject`](../../../objects/pdf-object/classes/PdfObject.md), `any`\>\>

###### Returns

`Promise`\<`IteratorResult`\<[`PdfObject`](../../../objects/pdf-object/classes/PdfObject.md), `any`\>\>

#### Inherited from

[`IterableReadableStream`](../../../../utils/IterableReadableStream/classes/IterableReadableStream.md).[`[asyncIterator]`](../../../../utils/IterableReadableStream/classes/IterableReadableStream.md#asynciterator)
