[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/crypt-filters/base](../README.md) / CryptFilterOptions

# Type Alias: CryptFilterOptions

> **CryptFilterOptions** = `object`

Configuration options for creating a crypt filter.

## Properties

### authEvent

> **authEvent**: `"DocOpen"` \| `"EFOpen"`

Event that triggers authentication: 'DocOpen' or 'EFOpen' (embedded file open).

---

### cfm

> **cfm**: `"None"` \| `"V2"` \| `"AESV2"` \| `"AESV3"`

Crypt filter method: 'None' (identity), 'V2' (RC4), 'AESV2' (AES-128), or 'AESV3' (AES-256).

---

### length?

> `optional` **length**: `number`

Key length in bits.

---

### securityHandler?

> `optional` **securityHandler**: [`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md)

Security handler for key derivation and encryption operations.
