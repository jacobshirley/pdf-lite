[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [pdf/pdf-reader](../README.md) / PdfReader

# Class: PdfReader

A reader for parsing PDF data into PdfDocument instances.
Processes streams of PDF objects and constructs documents from them.

## Example

```typescript
// Read PDF from file bytes
const document = await PdfReader.fromBytes(fileBytes)
```

## Constructors

### Constructor

> **new PdfReader**(`objectStream`): `PdfReader`

Creates a new PdfReader instance.

#### Parameters

##### objectStream

An async or sync iterable of PDF objects

`Iterable`\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md), `any`, `any`\> | `AsyncIterable`\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md), `any`, `any`\>

#### Returns

`PdfReader`

## Properties

### objectStream

> `protected` **objectStream**: `Iterable`\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md), `any`, `any`\> \| `AsyncIterable`\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md), `any`, `any`\>

The stream of PDF objects to read from

## Methods

### read()

> **read**(): `Promise`\<[`PdfDocument`](../../pdf-document/classes/PdfDocument.md)\>

Reads all objects from the stream and constructs a PdfDocument.

#### Returns

`Promise`\<[`PdfDocument`](../../pdf-document/classes/PdfDocument.md)\>

A promise that resolves to the parsed PdfDocument

---

### fromBytes()

> `static` **fromBytes**(`input`, `options?`): `Promise`\<[`PdfDocument`](../../pdf-document/classes/PdfDocument.md)\>

Creates a PdfDocument directly from a byte stream.
Convenience method that creates a reader internally.

#### Parameters

##### input

Async or sync iterable of byte arrays

`Iterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md), `any`, `any`\> | `AsyncIterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md), `any`, `any`\>

##### options?

###### incremental?

`boolean`

###### ownerPassword?

`string`

###### password?

`string`

#### Returns

`Promise`\<[`PdfDocument`](../../pdf-document/classes/PdfDocument.md)\>

A promise that resolves to the parsed PdfDocument
