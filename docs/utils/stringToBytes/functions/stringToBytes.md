[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/stringToBytes](../README.md) / stringToBytes

# Function: stringToBytes()

> **stringToBytes**(`str`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts a string or byte array to a byte array using UTF-8 encoding.
If the input is already a byte array, it is returned as-is.

## Parameters

### str

The string or byte array to convert.

`string` | [`ByteArray`](../../../types/type-aliases/ByteArray.md)

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The input as a byte array.

## Example

```typescript
stringToBytes('Hello') // Returns Uint8Array([72, 101, 108, 108, 111])
```
