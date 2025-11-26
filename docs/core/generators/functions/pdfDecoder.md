[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/generators](../README.md) / pdfDecoder

# Function: pdfDecoder()

> **pdfDecoder**(`input`, `options?`): `Generator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md), `void`, `any`\>

Decodes an iterable of byte arrays into PDF objects.
Allows configuring whitespace handling.

## Parameters

### input

`Iterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Iterable of byte arrays to decode

### options?

Configuration options

#### ignoreWhitespace?

`boolean`

If true, whitespace tokens are ignored

## Returns

`Generator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md), `void`, `any`\>

A generator yielding parsed PDF objects
