[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/base](../README.md) / PdfStandardSecurityHandler

# Abstract Class: PdfStandardSecurityHandler

Abstract base class for standard PDF security handlers.
Implements password-based encryption as defined in the PDF specification.

## Example

```typescript
const handler = new PdfV5SecurityHandler({
    password: 'user123',
    ownerPassword: 'admin456',
    permissions: { print: true, copy: false },
})
```

## Extends

- [`PdfSecurityHandler`](PdfSecurityHandler.md)

## Extended by

- [`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md)

## Constructors

### Constructor

> **new PdfStandardSecurityHandler**(`options`): `PdfStandardSecurityHandler`

Creates a new standard security handler.

#### Parameters

##### options

[`PdfStandardSecurityHandlerOptions`](../type-aliases/PdfStandardSecurityHandlerOptions.md)

Configuration options including passwords and document ID.

#### Returns

`PdfStandardSecurityHandler`

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`constructor`](PdfSecurityHandler.md#constructor)

## Properties

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`dict`](PdfSecurityHandler.md#dict)

---

### documentId?

> `protected` `optional` **documentId**: [`PdfId`](../../../types/type-aliases/PdfId.md)

Document identifier for key derivation.

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`encryptMetadata`](PdfSecurityHandler.md#encryptmetadata)

---

### masterKey?

> `protected` `optional` **masterKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Derived master encryption key.

---

### ownerKey?

> `protected` `optional` **ownerKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed owner key (O value).

---

### ownerPassword?

> `protected` `optional` **ownerPassword**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner password for full access.

---

### password

> `protected` **password**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User password for authentication.

---

### permissions

> **permissions**: `number`

Numeric permission flags.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`permissions`](PdfSecurityHandler.md#permissions)

---

### userKey?

> `protected` `optional` **userKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed user key (U value).

## Methods

### buildPermissions()

> `protected` **buildPermissions**(`perm`): `number`

Builds the numeric permission flags from a PdfPermissions object.

#### Parameters

##### perm

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

The permissions to encode.

#### Returns

`number`

The numeric permission flags.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`buildPermissions`](PdfSecurityHandler.md#buildpermissions)

---

### canEncryptMetadata()

> **canEncryptMetadata**(): `boolean`

Checks if metadata encryption is enabled.

#### Returns

`boolean`

True if metadata should be encrypted.

---

### computeObjectKey()

> `abstract` **computeObjectKey**(`objectNumber?`, `generationNumber?`, `algorithm?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the object-specific encryption key.

#### Parameters

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

##### algorithm?

[`PdfEncryptionAlgorithmType`](../../../types/type-aliases/PdfEncryptionAlgorithmType.md)

Optional algorithm type for key derivation.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed object key.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`computeObjectKey`](PdfSecurityHandler.md#computeobjectkey)

---

### computeOwnerKey()

> `abstract` `protected` **computeOwnerKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the owner key (O value) for the encryption dictionary.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed owner key.

---

### computeUserKey()

> `abstract` `protected` **computeUserKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the user key (U value) for the encryption dictionary.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed user key.

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`decodePermissions`](PdfSecurityHandler.md#decodepermissions)

---

### decrypt()

> **decrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Decrypts data using the appropriate cipher.

#### Parameters

##### type

The type of content being decrypted.

`"string"` | `"stream"` | `"file"`

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The encrypted data.

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The decrypted data.

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`decrypt`](PdfSecurityHandler.md#decrypt)

---

### decryptObject()

> **decryptObject**(`object`): `Promise`\<`void`\>

Recursively decrypts all strings and streams within an indirect object.

#### Parameters

##### object

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

The indirect object to decrypt.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`decryptObject`](PdfSecurityHandler.md#decryptobject)

---

### encrypt()

> **encrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Encrypts data using the appropriate cipher.

#### Parameters

##### type

The type of content being encrypted.

`"string"` | `"stream"` | `"file"`

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The data to encrypt.

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The encrypted data.

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`encrypt`](PdfSecurityHandler.md#encrypt)

---

### encryptObject()

> **encryptObject**(`object`): `Promise`\<`void`\>

Recursively encrypts all strings and streams within an indirect object.

#### Parameters

##### object

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

The indirect object to encrypt.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`encryptObject`](PdfSecurityHandler.md#encryptobject)

---

### getCipher()

> `abstract` `protected` **getCipher**(`objectNumber?`, `generationNumber?`): `Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md) \| `null`\>

Gets a cipher for the specified object.

#### Parameters

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

#### Returns

`Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md) \| `null`\>

A cipher instance, or null if no encryption needed.

---

### getDocumentId()

> **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`getDocumentId`](PdfSecurityHandler.md#getdocumentid)

---

### getKeyBits()

> `abstract` **getKeyBits**(): `number`

Gets the encryption key length in bits.

#### Returns

`number`

The key length in bits.

---

### getName()

> **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

'Standard' for password-based encryption.

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`getName`](PdfSecurityHandler.md#getname)

---

### getRevision()

> `abstract` **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

The revision number.

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`getRevision`](PdfSecurityHandler.md#getrevision)

---

### getVersion()

> `abstract` **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

The version number (1-5).

#### Inherited from

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`getVersion`](PdfSecurityHandler.md#getversion)

---

### initKeys()

> `protected` **initKeys**(): `Promise`\<`void`\>

Initializes the user and owner keys if not already set.

#### Returns

`Promise`\<`void`\>

---

### isReady()

> **isReady**(): `boolean`

Checks if the handler is ready (has document ID).

#### Returns

`boolean`

True if document ID is set.

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`isReady`](PdfSecurityHandler.md#isready)

---

### readEncryptionDictionary()

> **readEncryptionDictionary**(`encryptionDictionary`): `void`

Reads encryption parameters from the encryption dictionary.

#### Parameters

##### encryptionDictionary

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF.

#### Returns

`void`

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`readEncryptionDictionary`](PdfSecurityHandler.md#readencryptiondictionary)

---

### recoverUserPassword()

> `abstract` **recoverUserPassword**(`ownerPassword?`): `Promise`\<`string`\>

Recovers the user password from the owner password.

#### Parameters

##### ownerPassword?

The owner password.

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`Promise`\<`string`\>

The recovered user password.

#### Throws

Error if recovery is not supported.

---

### setDocumentId()

> **setDocumentId**(`id`): `void`

Sets the document ID for key derivation.

#### Parameters

##### id

[`PdfId`](../../../types/type-aliases/PdfId.md)

The document ID array.

#### Returns

`void`

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`setDocumentId`](PdfSecurityHandler.md#setdocumentid)

---

### setMasterKey()

> **setMasterKey**(`masterKey`): `void`

Sets the master encryption key directly.

#### Parameters

##### masterKey

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The master key to use.

#### Returns

`void`

---

### setOwnerPassword()

> **setOwnerPassword**(`ownerPassword`): `void`

Sets the owner password.

#### Parameters

##### ownerPassword

The owner password string or bytes.

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`void`

---

### setPassword()

> **setPassword**(`password`): `void`

Sets the user password.

#### Parameters

##### password

The user password string or bytes.

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`void`

---

### write()

> **write**(): `Promise`\<`void`\>

Writes the encryption dictionary with all computed keys and parameters.

#### Returns

`Promise`\<`void`\>

#### Throws

Error if required keys are not computed.

#### Overrides

[`PdfSecurityHandler`](PdfSecurityHandler.md).[`write`](PdfSecurityHandler.md#write)
