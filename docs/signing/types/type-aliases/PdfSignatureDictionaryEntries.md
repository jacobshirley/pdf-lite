[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/types](../README.md) / PdfSignatureDictionaryEntries

# Type Alias: PdfSignatureDictionaryEntries

> **PdfSignatureDictionaryEntries** = `object`

Entries in a PDF signature dictionary.

## Properties

### ByteRange

> **ByteRange**: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md)\>

---

### Cert?

> `optional` **Cert**: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md) \| [`PdfHexadecimal`](../../../core/objects/pdf-hexadecimal/classes/PdfHexadecimal.md)\> \| [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md) \| [`PdfHexadecimal`](../../../core/objects/pdf-hexadecimal/classes/PdfHexadecimal.md)

---

### Changes?

> `optional` **Changes**: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md)\>

---

### ContactInfo?

> `optional` **ContactInfo**: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)

---

### Contents

> **Contents**: [`PdfHexadecimal`](../../../core/objects/pdf-hexadecimal/classes/PdfHexadecimal.md)

---

### Filter

> **Filter**: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)

---

### Location?

> `optional` **Location**: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)

---

### M?

> `optional` **M**: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)

---

### Name?

> `optional` **Name**: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)

---

### Reason?

> `optional` **Reason**: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md)

---

### Reference?

> `optional` **Reference**: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\>

---

### SubFilter

> **SubFilter**: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<[`PdfSignatureSubType`](PdfSignatureSubType.md)\>

---

### Type

> **Type**: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<[`PdfSignatureType`](PdfSignatureType.md)\>

---

### V?

> `optional` **V**: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"2.2"`\>
