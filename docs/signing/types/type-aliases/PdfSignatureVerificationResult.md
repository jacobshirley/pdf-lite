[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/types](../README.md) / PdfSignatureVerificationResult

# Type Alias: PdfSignatureVerificationResult

> **PdfSignatureVerificationResult** = `object`

Result of a PDF signature verification operation.

## Properties

### certificateValidationResult?

> `optional` **certificateValidationResult**: `CertificateValidationResult`

Certificate validation result, if certificate validation was performed.

---

### reasons?

> `optional` **reasons**: `string`[]

Reasons for verification failure, if any.

---

### valid

> **valid**: `boolean`

Whether the signature is valid.
