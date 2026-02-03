[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [security/types](../README.md) / PdfCryptFilterDictionary

# Type Alias: PdfCryptFilterDictionary

> **PdfCryptFilterDictionary** = [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `AuthEvent?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"DocOpen"` \| `"EFOpen"`\>; `CFM`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"None"` \| `"V2"` \| `"AESV2"` \| `"AESV3"`\>; `Length?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); \}\>

Dictionary defining a crypt filter for PDF encryption.
Specifies the encryption method and authentication event trigger.
