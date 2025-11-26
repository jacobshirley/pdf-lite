[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [filters/ascii85](../README.md) / ascii85

# Function: ascii85()

> **ascii85**(): [`PdfFilter`](../../types/interfaces/PdfFilter.md)

Creates an ASCII85 filter for encoding and decoding PDF stream data.
ASCII85 (also known as Base85) encodes binary data into ASCII characters,
resulting in a 25% expansion compared to the original data.

## Returns

[`PdfFilter`](../../types/interfaces/PdfFilter.md)

A PdfFilter object with encode and decode methods.

## Example

```typescript
const filter = ascii85()
const encoded = filter.encode(binaryData)
const decoded = filter.decode(encoded)
```
