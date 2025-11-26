[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-aes256](../README.md) / generateUandUe

# Function: generateUandUe()

> **generateUandUe**(`password`, `fileKey`): `Promise`\<\{ `U`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); `UE`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

Generates the /U and /UE values for AES-256 PDF encryption.
These values are used to validate the user password and decrypt the file key.

## Parameters

### password

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The user password.

### fileKey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 32-byte file encryption key.

## Returns

`Promise`\<\{ `U`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); `UE`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

A promise that resolves to an object containing the 48-byte U and 32-byte UE values.

## Example

```typescript
const { U, UE } = await generateUandUe(password, fileKey)
```
