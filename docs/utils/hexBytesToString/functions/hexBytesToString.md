[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/hexBytesToString](../README.md) / hexBytesToString

# Function: hexBytesToString()

> **hexBytesToString**(`bytes`): `string`

Converts a byte array to a lowercase hexadecimal string.

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to convert.

## Returns

`string`

A lowercase hexadecimal string representation.

## Example

```typescript
hexBytesToString(new Uint8Array([255, 0])) // Returns 'ff00'
```
