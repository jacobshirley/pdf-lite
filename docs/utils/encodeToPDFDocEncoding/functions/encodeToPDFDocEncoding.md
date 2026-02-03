[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/encodeToPDFDocEncoding](../README.md) / encodeToPDFDocEncoding

# Function: encodeToPDFDocEncoding()

> **encodeToPDFDocEncoding**(`str`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Encodes a JavaScript string to PDFDocEncoding bytes.

PDFDocEncoding is the default encoding for PDF strings:

- Bytes 0-127: Standard ASCII
- Bytes 128-159: Special Unicode characters (see PDF spec)
- Bytes 160-255: ISO Latin-1 (ISO 8859-1)

## Parameters

### str

`string`

The string to encode.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The encoded byte array.

## Example

```typescript
// Encode "Hello" (ASCII)
encodeToPDFDocEncoding('Hello')

// Encode with special character (bullet → 0x80)
encodeToPDFDocEncoding('H•i')
```
