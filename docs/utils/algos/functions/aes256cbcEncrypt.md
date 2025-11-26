[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes256cbcEncrypt

# Function: aes256cbcEncrypt()

> **aes256cbcEncrypt**(`fileKey`, `block`, `iv`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Encrypts data using AES-256-CBC mode.

## Parameters

### fileKey

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 32-byte encryption key.

### block

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encrypt.

### iv

[`ByteArray`](../../../types/type-aliases/ByteArray.md) = `...`

The 16-byte initialization vector. Defaults to zero IV.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the encrypted data.

## Example

```typescript
const encrypted = await aes256cbcEncrypt(key, plaintext, iv)
```
