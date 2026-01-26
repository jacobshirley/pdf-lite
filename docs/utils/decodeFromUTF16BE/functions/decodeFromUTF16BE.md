[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/decodeFromUTF16BE](../README.md) / decodeFromUTF16BE

# Function: decodeFromUTF16BE()

> **decodeFromUTF16BE**(`bytes`): `string`

Decodes a UTF-16BE byte array to a string

Assumes the byte array starts with UTF-16BE BOM (0xFE 0xFF) which is skipped.
Each character is represented by 2 bytes (high byte, low byte).

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to decode (should start with BOM)

## Returns

`string`

The decoded string

## Example

```typescript
// Byte array with BOM: 0xFE, 0xFF, 0x00, 0x50, 0x00, 0x52 -> "PR"
decodeFromUTF16BE(new Uint8Array([0xfe, 0xff, 0x00, 0x50, 0x00, 0x52]))
// Returns "PR"
```
