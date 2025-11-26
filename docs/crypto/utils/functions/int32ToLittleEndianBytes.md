[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [crypto/utils](../README.md) / int32ToLittleEndianBytes

# Function: int32ToLittleEndianBytes()

> **int32ToLittleEndianBytes**(`value`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts a 32-bit integer to a 4-byte little-endian byte array.

## Parameters

### value

`number`

The 32-bit integer to convert.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A 4-byte array in little-endian order.

## Example

```typescript
int32ToLittleEndianBytes(0x12345678) // Returns [0x78, 0x56, 0x34, 0x12]
```
