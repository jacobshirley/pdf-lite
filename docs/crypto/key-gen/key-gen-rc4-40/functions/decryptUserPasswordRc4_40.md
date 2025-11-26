[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-rc4-40](../README.md) / decryptUserPasswordRc4_40

# Function: decryptUserPasswordRc4_40()

> **decryptUserPasswordRc4_40**(`ownerPw`, `ownerKey`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Decrypts the user password from the /O value using RC4-40.
Used to recover the user password when the owner password is known.

## Parameters

### ownerPw

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The owner password.

### ownerKey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The /O value from the encryption dictionary.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the decrypted user password (with padding removed).

## Example

```typescript
const userPassword = await decryptUserPasswordRc4_40(ownerPw, O)
```
