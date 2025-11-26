[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes256ecbEncrypt

# Function: aes256ecbEncrypt()

> **aes256ecbEncrypt**(`fileKey`, `data`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Encrypts data using AES-256-ECB mode.

## Parameters

### fileKey

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 32-byte encryption key.

### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encrypt.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the encrypted data.

## Throws

Error if the key is not exactly 32 bytes.

## Example

```typescript
const encrypted = await aes256ecbEncrypt(key, plaintext)
```
