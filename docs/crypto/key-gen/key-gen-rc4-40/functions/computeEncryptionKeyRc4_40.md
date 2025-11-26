[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-rc4-40](../README.md) / computeEncryptionKeyRc4_40

# Function: computeEncryptionKeyRc4_40()

> **computeEncryptionKeyRc4_40**(`userPw`, `oValue`, `permissions`, `fileId`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the 40-bit encryption key for RC4-40 PDF encryption.

## Parameters

### userPw

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user password.

### oValue

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The /O value.

### permissions

`number`

The /P value (permissions flags).

### fileId

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The first element of the /ID array.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the 5-byte (40-bit) encryption key.

## Example

```typescript
const key = await computeEncryptionKeyRc4_40(userPw, O, permissions, fileId)
```
