[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/types](../README.md) / PdfSignatureVerificationOptions

# Type Alias: PdfSignatureVerificationOptions

> **PdfSignatureVerificationOptions** = `object`

Options for PDF signature verification.

## Properties

### bytes

> **bytes**: [`ByteArray`](../../../types/type-aliases/ByteArray.md)

The original document bytes that were signed.

---

### certificateValidation?

> `optional` **certificateValidation**: `CertificateValidationOptions` \| `boolean`

Certificate validation options.
Pass `true` to use default certificate validation, or provide custom options.
Pass `undefined` or `false` to skip certificate validation.
