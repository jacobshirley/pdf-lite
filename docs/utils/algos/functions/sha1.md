[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / sha1

# Function: sha1()

> **sha1**(`input`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Computes the SHA-1 hash of the input data.

## Parameters

### input

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to hash.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the SHA-1 hash as a byte array.

## Example

```typescript
const hash = await sha1(new Uint8Array([1, 2, 3]))
```
