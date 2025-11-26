[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [crypto/key-derivation/key-derivation](../README.md) / padPassword

# Function: padPassword()

> **padPassword**(`password`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Pads a password to exactly 32 bytes using the PDF standard padding.
If the password is shorter than 32 bytes, it is padded with bytes from DEFAULT_PADDING.
If the password is 32 bytes or longer, only the first 32 bytes are used.

## Parameters

### password

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The password to pad.

## Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

A 32-byte padded password.

## Example

```typescript
const padded = padPassword(new Uint8Array([1, 2, 3])) // Returns 32-byte array
```
