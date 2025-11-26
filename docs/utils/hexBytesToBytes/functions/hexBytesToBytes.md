[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/hexBytesToBytes](../README.md) / hexBytesToBytes

# Function: hexBytesToBytes()

> **hexBytesToBytes**(`hex`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts a byte array containing hexadecimal ASCII characters to raw bytes.
Each pair of hex character bytes is converted to a single byte value.

## Parameters

### hex

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array containing hex character codes.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A byte array with decoded values.

## Example

```typescript
// 'FF' as bytes (0x46, 0x46) becomes 0xFF
hexBytesToBytes(new Uint8Array([70, 70])) // Returns Uint8Array([255])
```
