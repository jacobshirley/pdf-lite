[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / hash

# Function: hash()

> **hash**(`input`, `algorithm`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Computes a cryptographic hash of the input data using the specified algorithm.

## Parameters

### input

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to hash.

### algorithm

The hash algorithm to use. Defaults to 'SHA-256'.

`"SHA-1"` | `"SHA-256"` | `"SHA-384"` | `"SHA-512"` | `"MD5"`

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the hash as a byte array.

## Throws

Error if an unsupported hash algorithm is specified.

## Example

```typescript
const hash = await hash(data, 'SHA-256')
```
