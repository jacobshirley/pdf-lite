[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / md5

# Function: md5()

> **md5**(`input`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Computes the MD5 hash of the input data.

## Parameters

### input

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to hash.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the MD5 hash as a byte array.

## Example

```typescript
const hash = await md5(new Uint8Array([1, 2, 3]))
```
