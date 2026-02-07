[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/decodeWithFontEncoding](../README.md) / decodeWithFontEncoding

# Function: decodeWithFontEncoding()

> **decodeWithFontEncoding**(`bytes`, `encodingMap`): `string`

Decodes a byte array using a custom font encoding map.
Falls back to PDFDocEncoding for unmapped bytes.

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to decode

### encodingMap

Map from byte code to Unicode character

`Map`\<`number`, `string`\> | `null`

## Returns

`string`

The decoded string
