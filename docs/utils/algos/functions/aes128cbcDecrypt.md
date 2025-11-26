[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes128cbcDecrypt

# Function: aes128cbcDecrypt()

> **aes128cbcDecrypt**(`key`, `encrypted`, `iv`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Decrypts data using AES-128-CBC mode.

## Parameters

### key

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 16-byte decryption key.

### encrypted

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The encrypted data to decrypt.

### iv

[`ByteArray`](../../../types/type-aliases/ByteArray.md) = `...`

The 16-byte initialization vector. Defaults to zero IV.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the decrypted data.

## Throws

Error if the key is not exactly 16 bytes or encrypted data is too short.

## Example

```typescript
const decrypted = await aes128cbcDecrypt(key, ciphertext, iv)
```
