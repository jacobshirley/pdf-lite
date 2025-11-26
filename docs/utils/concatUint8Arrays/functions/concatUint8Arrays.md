[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/concatUint8Arrays](../README.md) / concatUint8Arrays

# Function: concatUint8Arrays()

> **concatUint8Arrays**(...`arrays`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Concatenates multiple Uint8Array instances into a single ByteArray.

## Parameters

### arrays

...`Uint8Array`\<`ArrayBufferLike`\>[]

The arrays to concatenate.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A new ByteArray containing all input arrays concatenated in order.

## Example

```typescript
const result = concatUint8Arrays(new Uint8Array([1, 2]), new Uint8Array([3, 4])) // Returns Uint8Array([1, 2, 3, 4])
```
