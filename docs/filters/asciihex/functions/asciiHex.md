[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [filters/asciihex](../README.md) / asciiHex

# Function: asciiHex()

> **asciiHex**(): [`PdfFilter`](../../types/interfaces/PdfFilter.md)

Creates an ASCIIHex filter for encoding and decoding PDF stream data.
ASCIIHex encodes binary data as pairs of hexadecimal digits,
resulting in a 100% expansion compared to the original data.

## Returns

[`PdfFilter`](../../types/interfaces/PdfFilter.md)

A PdfFilter object with encode and decode methods.

## Example

```typescript
const filter = asciiHex()
const encoded = filter.encode(binaryData)
const decoded = filter.decode(encoded)
```
