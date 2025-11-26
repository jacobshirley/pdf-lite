[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/generators](../README.md) / pdfDecoderAsync

# Function: pdfDecoderAsync()

> **pdfDecoderAsync**(`input`): `AsyncGenerator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

Asynchronously decodes byte arrays into PDF objects.
Supports both async and sync iterables for streaming PDF parsing.

## Parameters

### input

Async or sync iterable of byte arrays

`Iterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md), `any`, `any`\> | `AsyncIterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md), `any`, `any`\>

## Returns

`AsyncGenerator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

An async generator yielding parsed PDF objects
