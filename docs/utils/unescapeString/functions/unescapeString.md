[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/unescapeString](../README.md) / unescapeString

# Function: unescapeString()

> **unescapeString**(`input`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Unescapes a PDF literal string by processing escape sequences.
Handles escape sequences for special characters including newlines, tabs,
backslashes, parentheses, and octal character codes.

## Parameters

### input

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The escaped byte array to unescape.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A new byte array with escape sequences converted to their literal values.

## Example

```typescript
// Unescapes '\n' to a literal newline
unescapeString(new Uint8Array([0x5c, 0x6e])) // Returns Uint8Array([0x0a])
```
