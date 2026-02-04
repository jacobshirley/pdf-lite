[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/escapeString](../README.md) / escapeString

# Function: escapeString()

> **escapeString**(`bytes`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Escapes special characters in a PDF string according to PDF specification.
Escapes parentheses, backslashes, and control characters (\n, \r, \t, \b, \f).

## Parameters

### bytes

The byte array or string to escape.

`string` | [`ByteArray`](../../../types/type-aliases/ByteArray.md)

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A new byte array with escaped characters.

## Example

```typescript
escapeString('Hello (World)') // Escapes the parentheses
```
