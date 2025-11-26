[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [filters/flate](../README.md) / flate

# Function: flate()

> **flate**(): [`PdfFilter`](../../types/interfaces/PdfFilter.md)

Creates a Flate filter for compressing and decompressing PDF stream data.
Uses the DEFLATE compression algorithm (same as zlib/gzip).

## Returns

[`PdfFilter`](../../types/interfaces/PdfFilter.md)

A PdfFilter object with encode and decode methods.

## Example

```typescript
const filter = flate()
const compressed = filter.encode(rawData)
const decompressed = filter.decode(compressed)
```
