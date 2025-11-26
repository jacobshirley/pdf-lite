[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/base](../README.md) / PdfStandardSecurityHandlerOptions

# Type Alias: PdfStandardSecurityHandlerOptions

> **PdfStandardSecurityHandlerOptions** = [`PdfSecurityHandlerOptions`](PdfSecurityHandlerOptions.md) & `object`

Options for creating a standard security handler with password-based encryption.

## Type Declaration

### documentId?

> `optional` **documentId**: [`PdfId`](../../../types/type-aliases/PdfId.md) \| `string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Document identifier for key derivation.

### ownerKey?

> `optional` **ownerKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Pre-computed owner key.

### ownerPassword?

> `optional` **ownerPassword**: `string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner password for full document access.

### password?

> `optional` **password**: `string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User password for opening the document.

### userKey?

> `optional` **userKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Pre-computed user key.
