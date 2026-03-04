[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/needsCentralWhitespace](../README.md) / needsCentralWhitespace

# Function: needsCentralWhitespace()

> **needsCentralWhitespace**(`obj1?`, `obj2?`): `boolean`

Returns true if the given PDF object's serialized form starts with a
non-delimiter character, meaning it requires whitespace separation from
a preceding token to avoid ambiguous parsing.

Self-delimiting types (PdfString, PdfHexadecimal, PdfArray, PdfDictionary)
start with `(`, `<`, `[`, or `<<` and do not need a leading space.

## Parameters

### obj1?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

### obj2?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

## Returns

`boolean`
