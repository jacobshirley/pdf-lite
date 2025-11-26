[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-rc4-40](../README.md) / computeURc4_40

# Function: computeURc4_40()

> **computeURc4_40**(`userPw`, `oValue`, `permissions`, `fileId`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the /U value for RC4-40 PDF encryption.
The /U value is used to verify the user password.

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

A promise that resolves to the 32-byte /U value.

## Example

```typescript
const U = await computeURc4_40(userPassword, O, permissions, fileId)
```
