[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/v4](../README.md) / PdfV4SecurityHandler

# Class: PdfV4SecurityHandler

V4 security handler implementing AES-128-CBC encryption with crypt filters.
Supports different encryption methods for strings, streams, and embedded files (PDF 1.5).

## Example

```typescript
const handler = new PdfV4SecurityHandler({
    password: 'user123',
    ownerPassword: 'admin456',
})
handler.setCryptFilter(
    'StmFilter',
    new AesV2CryptFilter({ authEvent: 'DocOpen' }),
)
```

## Extends

- [`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md)

## Extended by

- [`PdfV5SecurityHandler`](../../v5/classes/PdfV5SecurityHandler.md)

## Constructors

### Constructor

> **new PdfV4SecurityHandler**(`options`): `PdfV4SecurityHandler`

Creates a new V4 security handler with AES-128 encryption.

#### Parameters

##### options

[`PdfStandardSecurityHandlerOptions`](../../base/type-aliases/PdfStandardSecurityHandlerOptions.md)

Configuration options for the handler.

#### Returns

`PdfV4SecurityHandler`

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`constructor`](../../v2/classes/PdfV2SecurityHandler.md#constructor)

## Properties

### cryptFilters

> `protected` **cryptFilters**: `Map`\<`string`, [`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md)\>

Map of named crypt filters.

---

### cryptFiltersByType

> `protected` **cryptFiltersByType**: `object` = `{}`

Mapping of content types to crypt filter names.

#### file?

> `optional` **file**: `string`

#### stream?

> `optional` **stream**: `string`

#### string?

> `optional` **string**: `string`

---

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`dict`](../../v2/classes/PdfV2SecurityHandler.md#dict)

---

### documentId?

> `protected` `optional` **documentId**: [`PdfId`](../../../types/type-aliases/PdfId.md)

Document identifier for key derivation.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`documentId`](../../v2/classes/PdfV2SecurityHandler.md#documentid)

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`encryptMetadata`](../../v2/classes/PdfV2SecurityHandler.md#encryptmetadata)

---

### masterKey?

> `protected` `optional` **masterKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Derived master encryption key.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`masterKey`](../../v2/classes/PdfV2SecurityHandler.md#masterkey)

---

### ownerKey?

> `protected` `optional` **ownerKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed owner key (O value).

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`ownerKey`](../../v2/classes/PdfV2SecurityHandler.md#ownerkey)

---

### ownerPassword?

> `protected` `optional` **ownerPassword**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner password for full access.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`ownerPassword`](../../v2/classes/PdfV2SecurityHandler.md#ownerpassword)

---

### password

> `protected` **password**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User password for authentication.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`password`](../../v2/classes/PdfV2SecurityHandler.md#password)

---

### permissions

> **permissions**: `number`

Numeric permission flags.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`permissions`](../../v2/classes/PdfV2SecurityHandler.md#permissions)

---

### userKey?

> `protected` `optional` **userKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed user key (U value).

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`userKey`](../../v2/classes/PdfV2SecurityHandler.md#userkey)

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

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`buildPermissions`](../../v2/classes/PdfV2SecurityHandler.md#buildpermissions)

---

### canEncryptMetadata()

> **canEncryptMetadata**(): `boolean`

Checks if metadata encryption is enabled.

#### Returns

`boolean`

True if metadata should be encrypted.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`canEncryptMetadata`](../../v2/classes/PdfV2SecurityHandler.md#canencryptmetadata)

---

### computeMasterKey()

> `protected` **computeMasterKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the master encryption key from the password.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed master key.

#### Throws

Error if required parameters are missing or password is incorrect.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`computeMasterKey`](../../v2/classes/PdfV2SecurityHandler.md#computemasterkey)

---

### computeObjectKey()

> **computeObjectKey**(`objectNumber?`, `generationNumber?`, `algorithm?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

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

#### Throws

Error if object or generation number is invalid.

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`computeObjectKey`](../../v2/classes/PdfV2SecurityHandler.md#computeobjectkey)

---

### computeOwnerKey()

> `protected` **computeOwnerKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the owner key (O value) using RC4-128 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed owner key.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`computeOwnerKey`](../../v2/classes/PdfV2SecurityHandler.md#computeownerkey)

---

### computeUserKey()

> `protected` **computeUserKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the user key (U value) using RC4-128 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed user key.

#### Throws

Error if document ID, owner key, or permissions are not set.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`computeUserKey`](../../v2/classes/PdfV2SecurityHandler.md#computeuserkey)

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`decodePermissions`](../../v2/classes/PdfV2SecurityHandler.md#decodepermissions)

---

### decrypt()

> **decrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Decrypts data using the appropriate crypt filter for the content type.

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

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`decrypt`](../../v2/classes/PdfV2SecurityHandler.md#decrypt)

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

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`decryptObject`](../../v2/classes/PdfV2SecurityHandler.md#decryptobject)

---

### encrypt()

> **encrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Encrypts data using the appropriate crypt filter for the content type.

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

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`encrypt`](../../v2/classes/PdfV2SecurityHandler.md#encrypt)

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

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`encryptObject`](../../v2/classes/PdfV2SecurityHandler.md#encryptobject)

---

### getCipher()

> `protected` **getCipher**(`objectNumber?`, `generationNumber?`): `Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

Gets an AES-128 cipher for the specified object.

#### Parameters

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

#### Returns

`Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

An AES-128 cipher instance.

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`getCipher`](../../v2/classes/PdfV2SecurityHandler.md#getcipher)

---

### getCryptFilter()

> **getCryptFilter**(`name`): [`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md) \| `undefined`

Gets a crypt filter by name.

#### Parameters

##### name

`string`

The crypt filter name.

#### Returns

[`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md) \| `undefined`

The crypt filter, or undefined if not found.

---

### getCryptFilterByType()

> **getCryptFilterByType**(`type`): [`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md) \| `null`

Gets the crypt filter assigned to a content type.

#### Parameters

##### type

[`CryptFilterType`](../../../types/type-aliases/CryptFilterType.md)

The content type ('string', 'stream', or 'file').

#### Returns

[`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md) \| `null`

The assigned crypt filter, or null if none.

---

### getDocumentId()

> **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`getDocumentId`](../../v2/classes/PdfV2SecurityHandler.md#getdocumentid)

---

### getKeyBits()

> **getKeyBits**(): `number`

Gets the encryption key length in bits.

#### Returns

`number`

128 for V2 encryption.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`getKeyBits`](../../v2/classes/PdfV2SecurityHandler.md#getkeybits)

---

### getName()

> **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

'Standard' for password-based encryption.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`getName`](../../v2/classes/PdfV2SecurityHandler.md#getname)

---

### getRevision()

> **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

4 for V4 encryption.

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`getRevision`](../../v2/classes/PdfV2SecurityHandler.md#getrevision)

---

### getVersion()

> **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

4 for crypt filter-based encryption.

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`getVersion`](../../v2/classes/PdfV2SecurityHandler.md#getversion)

---

### initKeys()

> `protected` **initKeys**(): `Promise`\<`void`\>

Initializes the user and owner keys if not already set.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`initKeys`](../../v2/classes/PdfV2SecurityHandler.md#initkeys)

---

### isReady()

> **isReady**(): `boolean`

Checks if the handler is ready (has document ID).

#### Returns

`boolean`

True if document ID is set.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`isReady`](../../v2/classes/PdfV2SecurityHandler.md#isready)

---

### readEncryptionDictionary()

> **readEncryptionDictionary**(`encryptionDictionary`): `void`

Reads encryption parameters and crypt filter definitions from the dictionary.

#### Parameters

##### encryptionDictionary

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF.

#### Returns

`void`

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`readEncryptionDictionary`](../../v2/classes/PdfV2SecurityHandler.md#readencryptiondictionary)

---

### recoverUserPassword()

> **recoverUserPassword**(`ownerPassword?`): `Promise`\<`string`\>

Recovers the user password from the owner password.

#### Parameters

##### ownerPassword?

The owner password.

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`Promise`\<`string`\>

The recovered user password as a string.

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`recoverUserPassword`](../../v2/classes/PdfV2SecurityHandler.md#recoveruserpassword)

---

### setCryptFilter()

> **setCryptFilter**(`name`, `filter`): `void`

Registers a named crypt filter.

#### Parameters

##### name

`string`

The filter name.

##### filter

[`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md)

The crypt filter instance.

#### Returns

`void`

---

### setCryptFilterForType()

> **setCryptFilterForType**(`type`, `name`): `void`

Assigns a crypt filter to a content type.

#### Parameters

##### type

[`CryptFilterType`](../../../types/type-aliases/CryptFilterType.md)

The content type.

##### name

`string`

The crypt filter name.

#### Returns

`void`

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

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`setDocumentId`](../../v2/classes/PdfV2SecurityHandler.md#setdocumentid)

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

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`setMasterKey`](../../v2/classes/PdfV2SecurityHandler.md#setmasterkey)

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

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`setOwnerPassword`](../../v2/classes/PdfV2SecurityHandler.md#setownerpassword)

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

#### Inherited from

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`setPassword`](../../v2/classes/PdfV2SecurityHandler.md#setpassword)

---

### write()

> **write**(): `Promise`\<`void`\>

Writes the encryption dictionary including crypt filter definitions.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md).[`write`](../../v2/classes/PdfV2SecurityHandler.md#write)
