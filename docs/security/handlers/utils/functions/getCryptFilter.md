[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/utils](../README.md) / getCryptFilter

# Function: getCryptFilter()

> **getCryptFilter**(`method`): [`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md)

Creates a crypt filter for the specified encryption algorithm.

## Parameters

### method

[`PdfEncryptionAlgorithmType`](../../../types/type-aliases/PdfEncryptionAlgorithmType.md)

The encryption algorithm type.

## Returns

[`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md)

The appropriate crypt filter instance.

## Throws

Error if the method is unsupported.

## Example

```typescript
const filter = getCryptFilter('AES-256-CBC')
```
