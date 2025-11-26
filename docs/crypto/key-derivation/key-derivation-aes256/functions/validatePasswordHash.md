[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-derivation/key-derivation-aes256](../README.md) / validatePasswordHash

# Function: validatePasswordHash()

> **validatePasswordHash**(`password`, `key`, `extra?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Validates a password against a stored hash using the Algorithm 2.B hash.

## Parameters

### password

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The password to validate.

### key

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The stored key containing the hash (first 32 bytes) and validation salt (bytes 32-40).

### extra?

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Extra data for owner password validation (user key).

## Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

A promise that resolves to the computed hash if validation succeeds.

## Throws

Error if the password is invalid or salt/hash lengths are incorrect.

## Example

```typescript
try {
    await validatePasswordHash(password, storedKey)
    console.log('Password is valid')
} catch (e) {
    console.log('Invalid password')
}
```
