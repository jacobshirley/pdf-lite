[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/bytesToHexBytes](../README.md) / bytesToHexBytes

# Function: bytesToHexBytes()

> **bytesToHexBytes**(`bytes`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts a byte array to a byte array containing hexadecimal character codes.
Each byte becomes two bytes representing its hex digits.

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to convert.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A byte array with hexadecimal character codes.

## Example

```typescript
bytesToHexBytes(new Uint8Array([255])) // Returns bytes for 'FF'
```
