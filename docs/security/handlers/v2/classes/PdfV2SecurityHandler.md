[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/v2](../README.md) / PdfV2SecurityHandler

# Class: PdfV2SecurityHandler

V2 security handler implementing 128-bit RC4 encryption.
Extends V1 with stronger key length (PDF 1.4).

## Example

```typescript
const handler = new PdfV2SecurityHandler({
    password: 'user123',
    ownerPassword: 'admin456',
})
```

## Extends

- [`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md)

## Extended by

- [`PdfV4SecurityHandler`](../../v4/classes/PdfV4SecurityHandler.md)

## Constructors

### Constructor

> **new PdfV2SecurityHandler**(`options`): `PdfV2SecurityHandler`

Creates a new standard security handler.

#### Parameters

##### options

[`PdfStandardSecurityHandlerOptions`](../../base/type-aliases/PdfStandardSecurityHandlerOptions.md)

Configuration options including passwords and document ID.

#### Returns

`PdfV2SecurityHandler`

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`constructor`](../../v1/classes/PdfV1SecurityHandler.md#constructor)

## Properties

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`dict`](../../v1/classes/PdfV1SecurityHandler.md#dict)

---

### documentId?

> `protected` `optional` **documentId**: [`PdfId`](../../../types/type-aliases/PdfId.md)

Document identifier for key derivation.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`documentId`](../../v1/classes/PdfV1SecurityHandler.md#documentid)

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`encryptMetadata`](../../v1/classes/PdfV1SecurityHandler.md#encryptmetadata)

---

### masterKey?

> `protected` `optional` **masterKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Derived master encryption key.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`masterKey`](../../v1/classes/PdfV1SecurityHandler.md#masterkey)

---

### ownerKey?

> `protected` `optional` **ownerKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed owner key (O value).

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`ownerKey`](../../v1/classes/PdfV1SecurityHandler.md#ownerkey)

---

### ownerPassword?

> `protected` `optional` **ownerPassword**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner password for full access.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`ownerPassword`](../../v1/classes/PdfV1SecurityHandler.md#ownerpassword)

---

### password

> `protected` **password**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User password for authentication.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`password`](../../v1/classes/PdfV1SecurityHandler.md#password)

---

### permissions

> **permissions**: `number`

Numeric permission flags.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`permissions`](../../v1/classes/PdfV1SecurityHandler.md#permissions)

---

### userKey?

> `protected` `optional` **userKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed user key (U value).

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`userKey`](../../v1/classes/PdfV1SecurityHandler.md#userkey)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`buildPermissions`](../../v1/classes/PdfV1SecurityHandler.md#buildpermissions)

---

### canEncryptMetadata()

> **canEncryptMetadata**(): `boolean`

Checks if metadata encryption is enabled.

#### Returns

`boolean`

True if metadata should be encrypted.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`canEncryptMetadata`](../../v1/classes/PdfV1SecurityHandler.md#canencryptmetadata)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`computeMasterKey`](../../v1/classes/PdfV1SecurityHandler.md#computemasterkey)

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

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`computeObjectKey`](../../v1/classes/PdfV1SecurityHandler.md#computeobjectkey)

---

### computeOwnerKey()

> `protected` **computeOwnerKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the owner key (O value) using RC4-128 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed owner key.

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`computeOwnerKey`](../../v1/classes/PdfV1SecurityHandler.md#computeownerkey)

---

### computeUserKey()

> `protected` **computeUserKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the user key (U value) using RC4-128 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed user key.

#### Throws

Error if document ID, owner key, or permissions are not set.

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`computeUserKey`](../../v1/classes/PdfV1SecurityHandler.md#computeuserkey)

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`decodePermissions`](../../v1/classes/PdfV1SecurityHandler.md#decodepermissions)

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

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`decrypt`](../../v1/classes/PdfV1SecurityHandler.md#decrypt)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`decryptObject`](../../v1/classes/PdfV1SecurityHandler.md#decryptobject)

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

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`encrypt`](../../v1/classes/PdfV1SecurityHandler.md#encrypt)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`encryptObject`](../../v1/classes/PdfV1SecurityHandler.md#encryptobject)

---

### getCipher()

> `protected` **getCipher**(`objectNumber?`, `generationNumber?`): `Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

Gets an RC4 cipher for the specified object.

#### Parameters

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

#### Returns

`Promise`\<[`Cipher`](../../../../crypto/types/interfaces/Cipher.md)\>

An RC4 cipher instance.

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`getCipher`](../../v1/classes/PdfV1SecurityHandler.md#getcipher)

---

### getDocumentId()

> **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`getDocumentId`](../../v1/classes/PdfV1SecurityHandler.md#getdocumentid)

---

### getKeyBits()

> **getKeyBits**(): `number`

Gets the encryption key length in bits.

#### Returns

`number`

128 for V2 encryption.

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`getKeyBits`](../../v1/classes/PdfV1SecurityHandler.md#getkeybits)

---

### getName()

> **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

'Standard' for password-based encryption.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`getName`](../../v1/classes/PdfV1SecurityHandler.md#getname)

---

### getRevision()

> **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

3 for V2 encryption.

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`getRevision`](../../v1/classes/PdfV1SecurityHandler.md#getrevision)

---

### getVersion()

> **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

2 for 128-bit RC4 encryption.

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`getVersion`](../../v1/classes/PdfV1SecurityHandler.md#getversion)

---

### initKeys()

> `protected` **initKeys**(): `Promise`\<`void`\>

Initializes the user and owner keys if not already set.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`initKeys`](../../v1/classes/PdfV1SecurityHandler.md#initkeys)

---

### isReady()

> **isReady**(): `boolean`

Checks if the handler is ready (has document ID).

#### Returns

`boolean`

True if document ID is set.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`isReady`](../../v1/classes/PdfV1SecurityHandler.md#isready)

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

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`readEncryptionDictionary`](../../v1/classes/PdfV1SecurityHandler.md#readencryptiondictionary)

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

#### Overrides

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`recoverUserPassword`](../../v1/classes/PdfV1SecurityHandler.md#recoveruserpassword)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`setDocumentId`](../../v1/classes/PdfV1SecurityHandler.md#setdocumentid)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`setMasterKey`](../../v1/classes/PdfV1SecurityHandler.md#setmasterkey)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`setOwnerPassword`](../../v1/classes/PdfV1SecurityHandler.md#setownerpassword)

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

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`setPassword`](../../v1/classes/PdfV1SecurityHandler.md#setpassword)

---

### write()

> **write**(): `Promise`\<`void`\>

Writes the encryption dictionary with all computed keys and parameters.

#### Returns

`Promise`\<`void`\>

#### Throws

Error if required keys are not computed.

#### Inherited from

[`PdfV1SecurityHandler`](../../v1/classes/PdfV1SecurityHandler.md).[`write`](../../v1/classes/PdfV1SecurityHandler.md#write)
