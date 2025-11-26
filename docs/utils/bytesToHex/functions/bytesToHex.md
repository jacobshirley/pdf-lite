[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/bytesToHex](../README.md) / bytesToHex

# Function: bytesToHex()

> **bytesToHex**(`bytes`): `string`

Converts a byte array to a hexadecimal string.

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to convert.

## Returns

`string`

A hexadecimal string representation of the bytes.

## Example

```typescript
bytesToHex(new Uint8Array([255, 0, 127])) // Returns 'FF007F'
```
