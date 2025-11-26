[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes256cbcDecrypt

# Function: aes256cbcDecrypt()

> **aes256cbcDecrypt**(`fileKey`, `ciphertext`, `iv`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Decrypts data using AES-256-CBC mode.

## Parameters

### fileKey

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 32-byte decryption key.

### ciphertext

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The encrypted data to decrypt.

### iv

[`ByteArray`](../../../types/type-aliases/ByteArray.md) = `...`

The 16-byte initialization vector. Defaults to zero IV.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the decrypted data.

## Example

```typescript
const decrypted = await aes256cbcDecrypt(key, ciphertext, iv)
```
