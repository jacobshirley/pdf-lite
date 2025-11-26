[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/bytesToString](../README.md) / bytesToString

# Function: bytesToString()

> **bytesToString**(`bytes`): `string`

Converts a byte array to a string using UTF-8 decoding.

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to decode.

## Returns

`string`

The decoded string.

## Example

```typescript
bytesToString(new Uint8Array([72, 101, 108, 108, 111])) // Returns 'Hello'
```
