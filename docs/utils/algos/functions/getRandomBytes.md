[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / getRandomBytes

# Function: getRandomBytes()

> **getRandomBytes**(`length`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Generates cryptographically secure random bytes.

## Parameters

### length

`number`

The number of random bytes to generate.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A byte array containing random bytes.

## Throws

Error if length is not a positive integer.

## Example

```typescript
const randomBytes = getRandomBytes(16) // 16 random bytes
```
