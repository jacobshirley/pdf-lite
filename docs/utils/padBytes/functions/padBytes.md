[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/padBytes](../README.md) / padBytes

# Function: padBytes()

> **padBytes**(`bytes`, `length`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Pads a byte array to a specified length with trailing zeros.

## Parameters

### bytes

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte array to pad.

### length

`number`

The target length for the padded array.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A new byte array padded to the specified length.

## Throws

Error if the input array is already longer than the target length.

## Example

```typescript
padBytes(new Uint8Array([1, 2]), 4) // Returns Uint8Array([1, 2, 0, 0])
```
