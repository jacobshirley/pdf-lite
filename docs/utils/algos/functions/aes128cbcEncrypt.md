[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes128cbcEncrypt

# Function: aes128cbcEncrypt()

> **aes128cbcEncrypt**(`key`, `data`, `iv`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Encrypts data using AES-128-CBC mode.

## Parameters

### key

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 16-byte encryption key.

### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encrypt.

### iv

[`ByteArray`](../../../types/type-aliases/ByteArray.md) = `...`

The 16-byte initialization vector. Defaults to zero IV.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the encrypted data.

## Throws

Error if the key is not exactly 16 bytes.

## Example

```typescript
const encrypted = await aes128cbcEncrypt(key, plaintext, iv)
```
