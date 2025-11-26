[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes256ecbDecrypt

# Function: aes256ecbDecrypt()

> **aes256ecbDecrypt**(`fileKey`, `encrypted`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Decrypts data using AES-256-ECB mode.

## Parameters

### fileKey

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 32-byte decryption key.

### encrypted

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The encrypted data to decrypt.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the decrypted data.

## Throws

Error if the key is not exactly 32 bytes.

## Example

```typescript
const decrypted = await aes256ecbDecrypt(key, ciphertext)
```
