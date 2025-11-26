[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-rc4-128](../README.md) / computeOValueRc4_128

# Function: computeOValueRc4_128()

> **computeOValueRc4_128**(`ownerPassword`, `userPassword`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the /O value for RC4-128 PDF encryption.
The /O value is used to verify the owner password.

## Parameters

### ownerPassword

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The owner password.

### userPassword

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user password.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the 32-byte /O value.

## Example

```typescript
const O = await computeOValueRc4_128(ownerPassword, userPassword)
```
