[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/document-security-store](../README.md) / PdfVriObject

# Type Alias: PdfVriObject

> **PdfVriObject** = [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{\[`CertHash`: `string`\]: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `Cert?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\>\>; `CRL?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\>\>; `OCSP?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\>\>; `TS?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md); `TU?`: [`PdfDate`](../../../core/objects/pdf-date/classes/PdfDate.md); `Type?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"VRI"`\>; \}\>; \}\>\>

Validation Related Information (VRI) dictionary.
Associates revocation data with specific certificate hashes.
