[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/decodeFromPDFDocEncoding](../README.md) / decodeFromPDFDocEncoding

# Function: decodeFromPDFDocEncoding()

> **decodeFromPDFDocEncoding**(`bytes`): `string`

Decodes a byte array from PDFDocEncoding to a JavaScript string.

PDFDocEncoding is the default encoding for PDF strings:

- Bytes 0-127: Standard ASCII
- Bytes 128-159: Special Unicode characters (see PDF spec)
- Bytes 160-255: ISO Latin-1 (ISO 8859-1)

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to decode.

## Returns

`string`

The decoded string.

## Example

```typescript
// Decode "Hello" (ASCII)
decodeFromPDFDocEncoding(new Uint8Array([72, 101, 108, 108, 111]))

// Decode with special character (0x80 = bullet)
decodeFromPDFDocEncoding(new Uint8Array([72, 0x80, 105]))
```
