[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/ciphers/rc4](../README.md) / rc4

# Function: rc4()

> **rc4**(`key`): [`Cipher`](../../../types/interfaces/Cipher.md)

Creates an RC4 cipher for PDF encryption.
RC4 is a symmetric stream cipher where encryption and decryption
use the same operation (XOR with the key stream).

## Parameters

### key

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The encryption key (variable length).

## Returns

[`Cipher`](../../../types/interfaces/Cipher.md)

A Cipher object with encrypt and decrypt methods.

## Example

```typescript
const cipher = rc4(key)
const encrypted = await cipher.encrypt(plaintext)
const decrypted = await cipher.decrypt(encrypted)
```
