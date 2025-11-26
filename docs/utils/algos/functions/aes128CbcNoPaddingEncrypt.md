[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / aes128CbcNoPaddingEncrypt

# Function: aes128CbcNoPaddingEncrypt()

> **aes128CbcNoPaddingEncrypt**(`key`, `data`, `iv`): `Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

Encrypts data using AES-128-CBC mode without PKCS#7 padding.

## Parameters

### key

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 16-byte encryption key.

### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The data to encrypt. Must be a multiple of 16 bytes.

### iv

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The 16-byte initialization vector.

## Returns

`Promise`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the encrypted data.

## Example

```typescript
const encrypted = await aes128CbcNoPaddingEncrypt(key, data, iv)
```
