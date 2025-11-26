[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/crypt-filters/identity](../README.md) / IdentityCryptFilter

# Class: IdentityCryptFilter

Identity crypt filter that passes data through without encryption.
Used when no encryption is needed for specific content types.

## Example

```typescript
const filter = new IdentityCryptFilter({ authEvent: 'DocOpen' })
const output = await filter.encrypt(data) // Returns data unchanged
```

## Extends

- [`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md)

## Constructors

### Constructor

> **new IdentityCryptFilter**(`options`): `IdentityCryptFilter`

Creates a new identity crypt filter.

#### Parameters

##### options

Configuration options with authentication event.

###### authEvent

`"DocOpen"` \| `"EFOpen"`

#### Returns

`IdentityCryptFilter`

#### Overrides

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`constructor`](../../base/classes/PdfCryptFilter.md#constructor)

## Properties

### authEvent

> **authEvent**: `"DocOpen"` \| `"EFOpen"`

Authentication event trigger.

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`authEvent`](../../base/classes/PdfCryptFilter.md#authevent)

---

### cfm

> **cfm**: `"None"` \| `"V2"` \| `"AESV2"` \| `"AESV3"`

Crypt filter method identifier.

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`cfm`](../../base/classes/PdfCryptFilter.md#cfm)

---

### length

> **length**: `number`

Key length in bits.

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`length`](../../base/classes/PdfCryptFilter.md#length)

---

### securityHandler?

> `protected` `optional` **securityHandler**: [`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md)

Security handler for cryptographic operations.

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`securityHandler`](../../base/classes/PdfCryptFilter.md#securityhandler)

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

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`decrypt`](../../base/classes/PdfCryptFilter.md#decrypt)

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

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`encrypt`](../../base/classes/PdfCryptFilter.md#encrypt)

---

### getCipher()

> **getCipher**(): `Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

Gets a passthrough cipher that returns data unchanged.

#### Returns

`Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

A cipher that performs no encryption or decryption.

#### Overrides

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`getCipher`](../../base/classes/PdfCryptFilter.md#getcipher)

---

### getSecurityHandler()

> **getSecurityHandler**(): [`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md) \| `undefined`

Gets the current security handler.

#### Returns

[`PdfSecurityHandler`](../../../handlers/base/classes/PdfSecurityHandler.md) \| `undefined`

The security handler, or undefined if not set.

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`getSecurityHandler`](../../base/classes/PdfCryptFilter.md#getsecurityhandler)

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

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`setSecurityHandler`](../../base/classes/PdfCryptFilter.md#setsecurityhandler)

---

### toDictionary()

> **toDictionary**(): [`PdfCryptFilterDictionary`](../../../types/type-aliases/PdfCryptFilterDictionary.md)

Converts this crypt filter to a PDF dictionary representation.

#### Returns

[`PdfCryptFilterDictionary`](../../../types/type-aliases/PdfCryptFilterDictionary.md)

The crypt filter dictionary.

#### Inherited from

[`PdfCryptFilter`](../../base/classes/PdfCryptFilter.md).[`toDictionary`](../../base/classes/PdfCryptFilter.md#todictionary)
