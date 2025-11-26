[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/replaceInBuffer](../README.md) / replaceInBuffer

# Function: replaceInBuffer()

> **replaceInBuffer**\<`T`\>(`searchBuffer`, `replaceBuffer`, `targetBuffer`, `multiple`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Replaces occurrences of a search buffer with a replacement buffer within a target buffer.

## Type Parameters

### T

`T` _extends_ [`ByteArray`](../../../types/type-aliases/ByteArray.md)

The type of the target buffer, extending ByteArray.

## Parameters

### searchBuffer

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte pattern to search for.

### replaceBuffer

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The byte pattern to replace with.

### targetBuffer

`T`

The buffer to search within.

### multiple

`boolean` = `false`

Whether to replace all occurrences or just the first. Defaults to false.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A new byte array with the replacements made.

## Throws

Error if the search buffer is not found in the target buffer.

## Example

```typescript
const result = replaceInBuffer(
    new Uint8Array([1, 2]),
    new Uint8Array([3, 4, 5]),
    new Uint8Array([0, 1, 2, 6]),
) // Returns Uint8Array([0, 3, 4, 5, 6])
```
