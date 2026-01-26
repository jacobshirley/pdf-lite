[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/needsUnicodeEncoding](../README.md) / needsUnicodeEncoding

# Function: needsUnicodeEncoding()

> **needsUnicodeEncoding**(`str`): `boolean`

Checks if a string contains non-ASCII characters that require UTF-16BE encoding

## Parameters

### str

`string`

The string to check

## Returns

`boolean`

True if the string contains characters above ASCII range (code > 127)

## Example

```typescript
needsUnicodeEncoding('Hello') // Returns false
needsUnicodeEncoding('PROSZĘ') // Returns true
```
