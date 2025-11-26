[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/generators](../README.md) / bytesToPdfObjects

# Function: bytesToPdfObjects()

> **bytesToPdfObjects**(`bytes`): `Generator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

Converts an iterable of byte arrays into PDF objects.
Processes bytes through tokenization and decoding.

## Parameters

### bytes

`Iterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Iterable of byte arrays to process

## Returns

`Generator`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

A generator yielding parsed PDF objects
