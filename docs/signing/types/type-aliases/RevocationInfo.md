[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/types](../README.md) / RevocationInfo

# Type Alias: RevocationInfo

> **RevocationInfo** = `object`

Revocation information for certificate validation.

## Properties

### crls?

> `optional` **crls**: [`ByteArray`](../../../types/type-aliases/ByteArray.md)[]

Certificate Revocation Lists (CRLs).

---

### ocsps?

> `optional` **ocsps**: [`ByteArray`](../../../types/type-aliases/ByteArray.md)[]

OCSP responses.

---

### otherRevInfo?

> `optional` **otherRevInfo**: `object`[]

Other revocation information types.

#### type

> **type**: `string`

#### value

> **value**: [`ByteArray`](../../../types/type-aliases/ByteArray.md)
