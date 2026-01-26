[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/encodeAsUTF16BE](../README.md) / encodeAsUTF16BE

# Function: encodeAsUTF16BE()

> **encodeAsUTF16BE**(`str`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Encodes a string as UTF-16BE with BOM for PDF

PDF strings can use UTF-16BE encoding to represent Unicode characters.
The encoding must start with the UTF-16BE BOM (0xFE 0xFF) to be recognized.

## Parameters

### str

`string`

The string to encode

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

Byte array with UTF-16BE BOM followed by the encoded string

## Example

```typescript
encodeAsUTF16BE('PROSZĘ')
// Returns Uint8Array([0xFE, 0xFF, 0x00, 0x50, 0x00, 0x52, ...])
```
