[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/v5](../README.md) / PdfV5SecurityHandler

# Class: PdfV5SecurityHandler

V5 security handler implementing AES-256-CBC encryption.
This is the most secure encryption method (PDF 2.0).

## Example

```typescript
const handler = new PdfV5SecurityHandler({
    password: 'strongPassword123',
    ownerPassword: 'adminPassword456',
})
```

## Extends

- [`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md)

## Constructors

### Constructor

> **new PdfV5SecurityHandler**(`options`): `PdfV5SecurityHandler`

Creates a new V5 security handler with AES-256 encryption.

#### Parameters

##### options

[`PdfSecurityHandlerOptions`](../../base/type-aliases/PdfSecurityHandlerOptions.md) & `object` & `object`

Configuration options including optional pre-computed keys.

#### Returns

`PdfV5SecurityHandler`

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`constructor`](../../v4/classes/PdfV4SecurityHandler.md#constructor)

## Properties

### cryptFilters

> `protected` **cryptFilters**: `Map`\<`string`, [`PdfCryptFilter`](../../../crypt-filters/base/classes/PdfCryptFilter.md)\>

Map of named crypt filters.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`cryptFilters`](../../v4/classes/PdfV4SecurityHandler.md#cryptfilters)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`cryptFiltersByType`](../../v4/classes/PdfV4SecurityHandler.md#cryptfiltersbytype)

---

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`dict`](../../v4/classes/PdfV4SecurityHandler.md#dict)

---

### documentId?

> `protected` `optional` **documentId**: [`PdfId`](../../../types/type-aliases/PdfId.md)

Document identifier for key derivation.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`documentId`](../../v4/classes/PdfV4SecurityHandler.md#documentid)

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`encryptMetadata`](../../v4/classes/PdfV4SecurityHandler.md#encryptmetadata)

---

### fileKey?

> `protected` `optional` **fileKey**: `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Promise resolving to the file encryption key.

---

### masterKey?

> `protected` `optional` **masterKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Derived master encryption key.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`masterKey`](../../v4/classes/PdfV4SecurityHandler.md#masterkey)

---

### ownerEncryptedFileKey?

> `protected` `optional` **ownerEncryptedFileKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner encrypted file key (OE value).

---

### ownerKey?

> `protected` `optional` **ownerKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed owner key (O value).

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`ownerKey`](../../v4/classes/PdfV4SecurityHandler.md#ownerkey)

---

### ownerPassword?

> `protected` `optional` **ownerPassword**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner password for full access.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`ownerPassword`](../../v4/classes/PdfV4SecurityHandler.md#ownerpassword)

---

### password

> `protected` **password**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User password for authentication.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`password`](../../v4/classes/PdfV4SecurityHandler.md#password)

---

### permissions

> **permissions**: `number`

Numeric permission flags.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`permissions`](../../v4/classes/PdfV4SecurityHandler.md#permissions)

---

### perms?

> `protected` `optional` **perms**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Permissions entry (Perms value).

---

### userEncryptedFileKey?

> `protected` `optional` **userEncryptedFileKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User encrypted file key (UE value).

---

### userKey?

> `protected` `optional` **userKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed user key (U value).

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`userKey`](../../v4/classes/PdfV4SecurityHandler.md#userkey)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`buildPermissions`](../../v4/classes/PdfV4SecurityHandler.md#buildpermissions)

---

### canEncryptMetadata()

> **canEncryptMetadata**(): `boolean`

Checks if metadata encryption is enabled.

#### Returns

`boolean`

True if metadata should be encrypted.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`canEncryptMetadata`](../../v4/classes/PdfV4SecurityHandler.md#canencryptmetadata)

---

### computeMasterKey()

> `protected` **computeMasterKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the master encryption key.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The file encryption key.

#### Throws

Error if file key is not initialized.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`computeMasterKey`](../../v4/classes/PdfV4SecurityHandler.md#computemasterkey)

---

### computeObjectKey()

> **computeObjectKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the object encryption key (same as master key for V5).

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The master encryption key.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`computeObjectKey`](../../v4/classes/PdfV4SecurityHandler.md#computeobjectkey)

---

### computeOwnerKey()

> `protected` **computeOwnerKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the owner key (O value) using RC4-128 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed owner key.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`computeOwnerKey`](../../v4/classes/PdfV4SecurityHandler.md#computeownerkey)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`computeUserKey`](../../v4/classes/PdfV4SecurityHandler.md#computeuserkey)

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`decodePermissions`](../../v4/classes/PdfV4SecurityHandler.md#decodepermissions)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`decrypt`](../../v4/classes/PdfV4SecurityHandler.md#decrypt)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`decryptObject`](../../v4/classes/PdfV4SecurityHandler.md#decryptobject)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`encrypt`](../../v4/classes/PdfV4SecurityHandler.md#encrypt)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`encryptObject`](../../v4/classes/PdfV4SecurityHandler.md#encryptobject)

---

### getCipher()

> `protected` **getCipher**(): `Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

Gets an AES-256 cipher.

#### Returns

`Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

An AES-256 cipher instance.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getCipher`](../../v4/classes/PdfV4SecurityHandler.md#getcipher)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getCryptFilter`](../../v4/classes/PdfV4SecurityHandler.md#getcryptfilter)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getCryptFilterByType`](../../v4/classes/PdfV4SecurityHandler.md#getcryptfilterbytype)

---

### getDocumentId()

> **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getDocumentId`](../../v4/classes/PdfV4SecurityHandler.md#getdocumentid)

---

### getKeyBits()

> **getKeyBits**(): `number`

Gets the encryption key length in bits.

#### Returns

`number`

256 for V5 encryption.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getKeyBits`](../../v4/classes/PdfV4SecurityHandler.md#getkeybits)

---

### getName()

> **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

'Standard' for password-based encryption.

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getName`](../../v4/classes/PdfV4SecurityHandler.md#getname)

---

### getRevision()

> **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

6 for V5 encryption.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getRevision`](../../v4/classes/PdfV4SecurityHandler.md#getrevision)

---

### getVersion()

> **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

5 for AES-256 encryption.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`getVersion`](../../v4/classes/PdfV4SecurityHandler.md#getversion)

---

### initKeys()

> `protected` **initKeys**(): `Promise`\<`void`\>

Initializes encryption keys, either deriving from existing values or generating new ones.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`initKeys`](../../v4/classes/PdfV4SecurityHandler.md#initkeys)

---

### isReady()

> **isReady**(): `boolean`

Checks if the handler is ready (has user encrypted file key).

#### Returns

`boolean`

True if the handler has the required keys.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`isReady`](../../v4/classes/PdfV4SecurityHandler.md#isready)

---

### readEncryptionDictionary()

> **readEncryptionDictionary**(`encryptionDictionary`): `void`

Reads V5-specific encryption parameters from the dictionary.

#### Parameters

##### encryptionDictionary

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF.

#### Returns

`void`

#### Throws

Error if required entries are missing or invalid.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`readEncryptionDictionary`](../../v4/classes/PdfV4SecurityHandler.md#readencryptiondictionary)

---

### recoverUserPassword()

> **recoverUserPassword**(`ownerPassword?`): `Promise`\<`string`\>

Recovers the user password from the owner password.
Not supported for AES-256 encryption.

#### Parameters

##### ownerPassword?

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`Promise`\<`string`\>

#### Throws

Error always, as this operation is not supported for V5.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`recoverUserPassword`](../../v4/classes/PdfV4SecurityHandler.md#recoveruserpassword)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`setCryptFilter`](../../v4/classes/PdfV4SecurityHandler.md#setcryptfilter)

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

#### Inherited from

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`setCryptFilterForType`](../../v4/classes/PdfV4SecurityHandler.md#setcryptfilterfortype)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`setDocumentId`](../../v4/classes/PdfV4SecurityHandler.md#setdocumentid)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`setMasterKey`](../../v4/classes/PdfV4SecurityHandler.md#setmasterkey)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`setOwnerPassword`](../../v4/classes/PdfV4SecurityHandler.md#setownerpassword)

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

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`setPassword`](../../v4/classes/PdfV4SecurityHandler.md#setpassword)

---

### write()

> **write**(): `Promise`\<`void`\>

Writes the encryption dictionary including V5-specific entries.

#### Returns

`Promise`\<`void`\>

#### Throws

Error if required keys are not computed.

#### Overrides

[`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md).[`write`](../../v4/classes/PdfV4SecurityHandler.md#write)
