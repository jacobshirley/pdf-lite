[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-rc4-40](../README.md) / computeORc4_40

# Function: computeORc4_40()

> **computeORc4_40**(`ownerPw`, `userPw`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the /O value for RC4-40 PDF encryption.
The /O value is used to verify the owner password.

## Parameters

### ownerPw

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The owner password.

### userPw

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user password.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the 32-byte /O value.

## Example

```typescript
const O = await computeORc4_40(ownerPassword, userPassword)
```
