[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [filters/runlength](../README.md) / runLength

# Function: runLength()

> **runLength**(): [`PdfFilter`](../../types/interfaces/PdfFilter.md)

Creates a Run-Length filter for encoding and decoding PDF stream data.
Run-Length encoding is a simple compression algorithm that replaces
sequences of repeated bytes with a count and the byte value.

## Returns

[`PdfFilter`](../../types/interfaces/PdfFilter.md)

A PdfFilter object with encode and decode methods.

## Example

```typescript
const filter = runLength()
const compressed = filter.encode(rawData)
const decompressed = filter.decode(compressed)
```
