[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-derivation/key-derivation-aes256](../README.md) / getFileKey

# Function: getFileKey()

> **getFileKey**(`userPassword`, `ownerPassword`, `u`, `ue`, `o`, `oe`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Retrieves the file encryption key using user or owner password.
Tries owner password first, then falls back to user password.

## Parameters

### userPassword

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user password to try.

### ownerPassword

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The owner password to try.

### u

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 48-byte /U value from the encryption dictionary.

### ue

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 32-byte /UE value (encrypted user key).

### o

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 48-byte /O value from the encryption dictionary.

### oe

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 32-byte /OE value (encrypted owner key).

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the 32-byte file encryption key.

## Throws

Error if both passwords are invalid.

## Example

```typescript
const fileKey = await getFileKey(userPw, ownerPw, U, UE, O, OE)
```
