[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-derivation/key-derivation](../README.md) / deriveObjectKey

# Function: deriveObjectKey()

> **deriveObjectKey**(`mkey`, `objNumber`, `objGeneration`, `useAesSalt`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Derives an object-specific encryption key from the master key.
Used to encrypt individual PDF objects with unique keys.

## Parameters

### mkey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The master encryption key.

### objNumber

`number`

The PDF object number.

### objGeneration

`number`

The PDF object generation number.

### useAesSalt

`boolean` = `true`

Whether to include the AES salt ('sAlT'). Defaults to true.

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the derived object key.

## Example

```typescript
const objectKey = await deriveObjectKey(masterKey, 5, 0)
```
