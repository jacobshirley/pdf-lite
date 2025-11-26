[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/stringToHexBytes](../README.md) / stringToHexBytes

# Function: stringToHexBytes()

> **stringToHexBytes**(`str`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts a hexadecimal string (optionally with angle brackets) to a byte array.
Strips any surrounding angle brackets before conversion.

## Parameters

### str

`string`

The hexadecimal string to convert, optionally wrapped in angle brackets.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

A byte array with the decoded values.

## Example

```typescript
stringToHexBytes('<FF00>') // Returns Uint8Array([255, 0])
stringToHexBytes('FF00') // Also returns Uint8Array([255, 0])
```
