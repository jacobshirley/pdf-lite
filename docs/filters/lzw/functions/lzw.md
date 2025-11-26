[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [filters/lzw](../README.md) / lzw

# Function: lzw()

> **lzw**(): [`PdfFilter`](../../types/interfaces/PdfFilter.md)

Creates an LZW filter for encoding and decoding PDF stream data.
LZW (Lempel-Ziv-Welch) is a lossless compression algorithm.
This is a minimal implementation for PDF (12-bit, no early change, no predictor).

## Returns

[`PdfFilter`](../../types/interfaces/PdfFilter.md)

A PdfFilter object with encode and decode methods.

## Example

```typescript
const filter = lzw()
const compressed = filter.encode(rawData)
const decompressed = filter.decode(compressed)
```
