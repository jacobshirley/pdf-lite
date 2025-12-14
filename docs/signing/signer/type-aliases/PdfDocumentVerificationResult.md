[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/signer](../README.md) / PdfDocumentVerificationResult

# Type Alias: PdfDocumentVerificationResult

> **PdfDocumentVerificationResult** = `object`

Result of verifying all signatures in a document.

## Properties

### signatures

> **signatures**: `object`[]

Individual signature verification results.

#### index

> **index**: `number`

Index of the signature in the document.

#### result

> **result**: [`PdfSignatureVerificationResult`](../../types/type-aliases/PdfSignatureVerificationResult.md)

The verification result.

#### signature

> **signature**: [`PdfSignatureObject`](../../signatures/base/classes/PdfSignatureObject.md)

The signature object.

#### type

> **type**: [`PdfSignatureSubType`](../../types/type-aliases/PdfSignatureSubType.md)

The signature subfilter type.

---

### valid

> **valid**: `boolean`

Whether all signatures in the document are valid.
