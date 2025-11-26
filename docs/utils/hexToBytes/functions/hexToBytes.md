[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/hexToBytes](../README.md) / hexToBytes

# Function: hexToBytes()

> **hexToBytes**(`hex`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts a hexadecimal string to a byte array.

## Parameters

### hex

`string`

The hexadecimal string to convert.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A byte array containing the decoded values.

## Example

```typescript
hexToBytes('FF00') // Returns Uint8Array([255, 0])
```
