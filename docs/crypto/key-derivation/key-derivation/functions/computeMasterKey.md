[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-derivation/key-derivation](../README.md) / computeMasterKey

# Function: computeMasterKey()

> **computeMasterKey**(`password`, `ownerKey`, `permissions`, `id0`, `keyLengthBits`, `encryptMetadata`, `revision`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Compute the master encryption key for a PDF file.

## Parameters

### password

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User-supplied password (empty if no password)

### ownerKey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner key (/O value)

### permissions

`number`

/P value

### id0

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

First element of /ID array

### keyLengthBits

`number`

Usually 40, 128 or 256

### encryptMetadata

`boolean`

Whether /EncryptMetadata is false

### revision

`number` = `3`

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>
