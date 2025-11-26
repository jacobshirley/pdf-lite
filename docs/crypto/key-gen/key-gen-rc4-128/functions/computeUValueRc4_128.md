[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-rc4-128](../README.md) / computeUValueRc4_128

# Function: computeUValueRc4_128()

> **computeUValueRc4_128**(`userPassword`, `oValue`, `permissions`, `id`, `encryptMetadata`, `revision?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the /U value for RC4-128 PDF encryption.
The /U value is used to verify the user password.

## Parameters

### userPassword

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user password.

### oValue

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The /O value.

### permissions

`number`

The /P value (permissions flags).

### id

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The first element of the /ID array.

### encryptMetadata

`boolean`

Whether to encrypt metadata.

### revision?

`number`

The encryption revision number.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the 32-byte /U value.

## Example

```typescript
const U = await computeUValueRc4_128(userPassword, O, permissions, fileId, true)
```
