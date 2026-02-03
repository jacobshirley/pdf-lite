[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/needsUnicodeEncoding](../README.md) / needsUnicodeEncoding

# Function: needsUnicodeEncoding()

> **needsUnicodeEncoding**(`str`): `boolean`

Checks if a string contains characters that require UTF-16BE encoding.

PDFDocEncoding can represent:

- ASCII characters (0-127)
- Special PDF characters (mapped from specific Unicode chars to bytes 128-159)
- ISO Latin-1 characters (160-255)

Anything outside this range requires UTF-16BE encoding.

## Parameters

### str

`string`

The string to check

## Returns

`boolean`

True if the string contains characters that cannot be represented in PDFDocEncoding

## Example

```typescript
needsUnicodeEncoding('Hello') // Returns false (ASCII)
needsUnicodeEncoding('Café') // Returns false (ISO Latin-1)
needsUnicodeEncoding('Test • item') // Returns false (special PDF char)
needsUnicodeEncoding('Hello 世界') // Returns true (needs UTF-16BE)
```
