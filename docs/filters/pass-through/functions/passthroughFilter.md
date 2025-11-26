[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [filters/pass-through](../README.md) / passthroughFilter

# Function: passthroughFilter()

> **passthroughFilter**(): [`PdfFilter`](../../types/interfaces/PdfFilter.md)

Creates a pass-through filter that performs no transformation.
Returns data unchanged, useful for testing or as a placeholder filter.

## Returns

[`PdfFilter`](../../types/interfaces/PdfFilter.md)

A PdfFilter object with encode and decode methods that return data unchanged.

## Example

```typescript
const filter = passthroughFilter()
const result = filter.encode(data) // Returns data unchanged
```
