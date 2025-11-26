[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [security/types](../README.md) / PdfEncryptionOptions

# Type Alias: PdfEncryptionOptions

> **PdfEncryptionOptions** = `object`

Options for configuring PDF encryption.
Includes encryption method, passwords, document ID, and permission settings.

## Properties

### documentId?

> `optional` **documentId**: [`PdfId`](PdfId.md) \| [`ByteArray`](../../../types/type-aliases/ByteArray.md) \| `string`

---

### encryptMetadata?

> `optional` **encryptMetadata**: `boolean`

---

### method?

> `optional` **method**: [`PdfEncryptionAlgorithmOptions`](PdfEncryptionAlgorithmOptions.md)

---

### ownerPassword?

> `optional` **ownerPassword**: [`ByteArray`](../../../types/type-aliases/ByteArray.md) \| `string`

---

### password?

> `optional` **password**: [`ByteArray`](../../../types/type-aliases/ByteArray.md) \| `string`

---

### permissions?

> `optional` **permissions**: `object`

#### all?

> `optional` **all**: `boolean`

#### annotate?

> `optional` **annotate**: `boolean`

#### assemble?

> `optional` **assemble**: `boolean`

#### copy?

> `optional` **copy**: `boolean`

#### extract?

> `optional` **extract**: `boolean`

#### fill?

> `optional` **fill**: `boolean`

#### modify?

> `optional` **modify**: `boolean`

#### print?

> `optional` **print**: `boolean`

#### printHighQuality?

> `optional` **printHighQuality**: `boolean`

---

### recipients?

> `optional` **recipients**: [`PdfEncryptionRecipient`](PdfEncryptionRecipient.md)[]
