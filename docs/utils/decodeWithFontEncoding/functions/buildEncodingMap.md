[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/decodeWithFontEncoding](../README.md) / buildEncodingMap

# Function: buildEncodingMap()

> **buildEncodingMap**(`differences`): `Map`\<`number`, `string`\> \| `null`

Builds a character encoding map from a PDF Encoding Differences array.
The Differences array format is: [code name1 name2 ... code name1 name2 ...]
where code is a number and names are glyph names.

## Parameters

### differences

[`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)

PdfArray containing the Differences array

## Returns

`Map`\<`number`, `string`\> \| `null`

Map from byte code to Unicode character
