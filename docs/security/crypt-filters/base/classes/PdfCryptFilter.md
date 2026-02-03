[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/crypt-filters/base](../README.md) / PdfCryptFilter

# Abstract Class: PdfCryptFilter

Abstract base class for PDF crypt filters.
Crypt filters define how specific types of data (strings, streams, files) are encrypted.

## Example

```typescript
const filter = new AesV2CryptFilter({ authEvent: 'DocOpen' })
filter.setSecurityHandler(securityHandler)
const encrypted = await filter.encrypt(data, objectNumber, generationNumber)
```

## Extended by

- [`AesV2CryptFilter`](../../aesv2/classes/AesV2CryptFilter.md)
- [`AesV3CryptFilter`](../../aesv3/classes/AesV3CryptFilter.md)
- [`IdentityCryptFilter`](../../identity/classes/IdentityCryptFilter.md)
- [`V2CryptFilter`](../../v2/classes/V2CryptFilter.md)

## Constructors

### Constructor

> **new PdfCryptFilter**(`options`): `PdfCryptFilter`

Creates a new crypt filter with the specified options.

#### Parameters

##### options

[`CryptFilterOptions`](../type-aliases/CryptFilterOptions.md)

Configuration options for the crypt filter.

#### Returns

`PdfCryptFilter`

## Properties

### authEvent?

> `optional` **authEvent**: `"DocOpen"` \| `"EFOpen"`

Authentication event trigger.

---

### cfm

> **cfm**: `"None"` \| `"V2"` \| `"AESV2"` \| `"AESV3"`

Crypt filter method identifier.

---

### length

> **length**: `number`

Key length in bits.

---

### securityHandler?

> `protected` `optional` **securityHandler**: [`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md)

Security handler for cryptographic operations.

## Methods

### decrypt()

> **decrypt**(`data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Decrypts data using this crypt filter.

#### Parameters

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The data to decrypt.

##### objectNumber?

`number`

The PDF object number for key derivation.

##### generationNumber?

`number`

The PDF generation number for key derivation.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The decrypted data.

---

### encrypt()

> **encrypt**(`data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Encrypts data using this crypt filter.

#### Parameters

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The data to encrypt.

##### objectNumber?

`number`

The PDF object number for key derivation.

##### generationNumber?

`number`

The PDF generation number for key derivation.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The encrypted data.

---

### getCipher()

> `abstract` **getCipher**(`objectNumber?`, `generationNumber?`): `Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

Gets a cipher instance for encrypting/decrypting data.

#### Parameters

##### objectNumber?

`number`

The PDF object number for key derivation.

##### generationNumber?

`number`

The PDF generation number for key derivation.

#### Returns

`Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

A cipher instance for encryption/decryption operations.

---

### getSecurityHandler()

> **getSecurityHandler**(): [`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md) \| `undefined`

Gets the current security handler.

#### Returns

[`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md) \| `undefined`

The security handler, or undefined if not set.

---

### setSecurityHandler()

> **setSecurityHandler**(`handler`): `void`

Sets the security handler for this crypt filter.

#### Parameters

##### handler

[`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md)

The security handler to use for key derivation.

#### Returns

`void`

---

### toDictionary()

> **toDictionary**(): [`PdfCryptFilterDictionary`](../../../types/type-aliases/PdfCryptFilterDictionary.md)

Converts this crypt filter to a PDF dictionary representation.

#### Returns

[`PdfCryptFilterDictionary`](../../../types/type-aliases/PdfCryptFilterDictionary.md)

The crypt filter dictionary.
