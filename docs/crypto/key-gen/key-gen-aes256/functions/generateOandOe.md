[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-gen/key-gen-aes256](../README.md) / generateOandOe

# Function: generateOandOe()

> **generateOandOe**(`password`, `U`, `fileKey`): `Promise`\<\{ `O`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); `OE`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

Generates the /O and /OE values for AES-256 PDF encryption.
These values are used to validate the owner password and decrypt the file key.

## Parameters

### password

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The owner password.

### U

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 48-byte /U value (required for owner key derivation).

### fileKey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The 32-byte file encryption key.

## Returns

`Promise`\<\{ `O`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); `OE`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

A promise that resolves to an object containing the 48-byte O and 32-byte OE values.

## Example

```typescript
const { O, OE } = await generateOandOe(ownerPassword, U, fileKey)
```
