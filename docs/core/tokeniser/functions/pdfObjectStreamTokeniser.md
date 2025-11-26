[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [core/tokeniser](../README.md) / pdfObjectStreamTokeniser

# Function: pdfObjectStreamTokeniser()

> **pdfObjectStreamTokeniser**(): (`objects`) => `Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

Creates a function that converts a stream of PDF objects to tokens.

## Returns

A generator function that yields tokens from PDF objects

> (`objects`): `Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>

### Parameters

#### objects

`Iterable`\<[`PdfObject`](../../objects/pdf-object/classes/PdfObject.md)\>

### Returns

`Generator`\<[`PdfToken`](../../tokens/token/classes/PdfToken.md)\>
