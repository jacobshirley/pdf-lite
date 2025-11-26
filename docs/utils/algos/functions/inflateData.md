[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [utils/algos](../README.md) / inflateData

# Function: inflateData()

> **inflateData**(`data`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Decompresses data using the INFLATE algorithm (reverses DEFLATE).

## Parameters

### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The compressed data to decompress.

## Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The decompressed data as a byte array.

## Throws

Error if inflation fails due to invalid or corrupted data.

## Example

```typescript
const decompressed = inflateData(compressedData)
```
