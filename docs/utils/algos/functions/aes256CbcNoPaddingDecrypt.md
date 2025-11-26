[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes256CbcNoPaddingDecrypt

# Function: aes256CbcNoPaddingDecrypt()

> **aes256CbcNoPaddingDecrypt**(`key`, `ciphertext`, `iv`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Decrypts data using AES-256-CBC mode without PKCS#7 padding.

## Parameters

### key

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
const decrypted = await aes256CbcNoPaddingDecrypt(key, ciphertext, iv)
```
