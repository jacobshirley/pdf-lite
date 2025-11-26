[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [crypto/utils](../README.md) / removePdfPasswordPadding

# Function: removePdfPasswordPadding()

> **removePdfPasswordPadding**(`buffer`): `Uint8Array`\<`ArrayBuffer`\>

Removes PDF standard password padding from a buffer.
Searches from the end of the buffer for the padding pattern and removes it.

## Parameters

### buffer

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The buffer with potential password padding.

## Returns

`Uint8Array`\<`ArrayBuffer`\>

The buffer with padding removed.

## Example

```typescript
const unpadded = removePdfPasswordPadding(paddedPassword)
```
