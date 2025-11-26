[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-derivation/key-derivation-aes256](../README.md) / computeAlgorithm2bHash

# Function: computeAlgorithm2bHash()

> **computeAlgorithm2bHash**(`password`, `salt`, `userKey`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the Algorithm 2.B hash for PDF 2.0 AES-256 encryption.
This iterative hash algorithm uses SHA-256, SHA-384, or SHA-512 based on
intermediate results, running for at least 64 rounds.

## Parameters

### password

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user or owner password.

### salt

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 8-byte validation or key salt.

### userKey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md) = `...`

The user key (required for owner password validation). Defaults to empty.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to a 32-byte hash.

## Example

```typescript
const hash = await computeAlgorithm2bHash(password, salt)
```
