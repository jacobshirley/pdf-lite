[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/v1](../README.md) / PdfV1SecurityHandler

# Class: PdfV1SecurityHandler

V1 security handler implementing 40-bit RC4 encryption.
This is the original PDF encryption format (PDF 1.1).

## Example

```typescript
const handler = new PdfV1SecurityHandler({
    password: 'user123',
    ownerPassword: 'admin456',
})
```

## Extends

- [`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md)

## Extended by

- [`PdfV2SecurityHandler`](../../v2/classes/PdfV2SecurityHandler.md)

## Constructors

### Constructor

> **new PdfV1SecurityHandler**(`options`): `PdfV1SecurityHandler`

Creates a new standard security handler.

#### Parameters

##### options

[`PdfStandardSecurityHandlerOptions`](../../base/type-aliases/PdfStandardSecurityHandlerOptions.md)

Configuration options including passwords and document ID.

#### Returns

`PdfV1SecurityHandler`

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`constructor`](../../base/classes/PdfStandardSecurityHandler.md#constructor)

## Properties

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`dict`](../../base/classes/PdfStandardSecurityHandler.md#dict)

---

### documentId?

> `protected` `optional` **documentId**: [`PdfId`](../../../types/type-aliases/PdfId.md)

Document identifier for key derivation.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`documentId`](../../base/classes/PdfStandardSecurityHandler.md#documentid)

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`encryptMetadata`](../../base/classes/PdfStandardSecurityHandler.md#encryptmetadata)

---

### masterKey?

> `protected` `optional` **masterKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Derived master encryption key.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`masterKey`](../../base/classes/PdfStandardSecurityHandler.md#masterkey)

---

### ownerKey?

> `protected` `optional` **ownerKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed owner key (O value).

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`ownerKey`](../../base/classes/PdfStandardSecurityHandler.md#ownerkey)

---

### ownerPassword?

> `protected` `optional` **ownerPassword**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Owner password for full access.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`ownerPassword`](../../base/classes/PdfStandardSecurityHandler.md#ownerpassword)

---

### password

> `protected` **password**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

User password for authentication.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`password`](../../base/classes/PdfStandardSecurityHandler.md#password)

---

### permissions

> **permissions**: `number`

Numeric permission flags.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`permissions`](../../base/classes/PdfStandardSecurityHandler.md#permissions)

---

### userKey?

> `protected` `optional` **userKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Computed user key (U value).

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`userKey`](../../base/classes/PdfStandardSecurityHandler.md#userkey)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`buildPermissions`](../../base/classes/PdfStandardSecurityHandler.md#buildpermissions)

---

### canEncryptMetadata()

> **canEncryptMetadata**(): `boolean`

Checks if metadata encryption is enabled.

#### Returns

`boolean`

True if metadata should be encrypted.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`canEncryptMetadata`](../../base/classes/PdfStandardSecurityHandler.md#canencryptmetadata)

---

### computeMasterKey()

> `protected` **computeMasterKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the master encryption key from the password.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed master key.

#### Throws

Error if required parameters are missing or password is incorrect.

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`computeObjectKey`](../../base/classes/PdfStandardSecurityHandler.md#computeobjectkey)

---

### computeOwnerKey()

> `protected` **computeOwnerKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the owner key (O value) using RC4-40 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed owner key.

#### Overrides

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`computeOwnerKey`](../../base/classes/PdfStandardSecurityHandler.md#computeownerkey)

---

### computeUserKey()

> `protected` **computeUserKey**(): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the user key (U value) using RC4-40 algorithm.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed user key.

#### Throws

Error if document ID, owner key, or permissions are not set.

#### Overrides

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`computeUserKey`](../../base/classes/PdfStandardSecurityHandler.md#computeuserkey)

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`decodePermissions`](../../base/classes/PdfStandardSecurityHandler.md#decodepermissions)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`decrypt`](../../base/classes/PdfStandardSecurityHandler.md#decrypt)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`decryptObject`](../../base/classes/PdfStandardSecurityHandler.md#decryptobject)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`encrypt`](../../base/classes/PdfStandardSecurityHandler.md#encrypt)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`encryptObject`](../../base/classes/PdfStandardSecurityHandler.md#encryptobject)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`getCipher`](../../base/classes/PdfStandardSecurityHandler.md#getcipher)

---

### getDocumentId()

> **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`getDocumentId`](../../base/classes/PdfStandardSecurityHandler.md#getdocumentid)

---

### getKeyBits()

> **getKeyBits**(): `number`

Gets the encryption key length in bits.

#### Returns

`number`

40 for V1 encryption.

#### Overrides

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`getKeyBits`](../../base/classes/PdfStandardSecurityHandler.md#getkeybits)

---

### getName()

> **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

'Standard' for password-based encryption.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`getName`](../../base/classes/PdfStandardSecurityHandler.md#getname)

---

### getRevision()

> **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

2 for V1 encryption.

#### Overrides

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`getRevision`](../../base/classes/PdfStandardSecurityHandler.md#getrevision)

---

### getVersion()

> **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

1 for 40-bit RC4 encryption.

#### Overrides

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`getVersion`](../../base/classes/PdfStandardSecurityHandler.md#getversion)

---

### initKeys()

> `protected` **initKeys**(): `Promise`\<`void`\>

Initializes the user and owner keys if not already set.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`initKeys`](../../base/classes/PdfStandardSecurityHandler.md#initkeys)

---

### isReady()

> **isReady**(): `boolean`

Checks if the handler is ready (has document ID).

#### Returns

`boolean`

True if document ID is set.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`isReady`](../../base/classes/PdfStandardSecurityHandler.md#isready)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`readEncryptionDictionary`](../../base/classes/PdfStandardSecurityHandler.md#readencryptiondictionary)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`recoverUserPassword`](../../base/classes/PdfStandardSecurityHandler.md#recoveruserpassword)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`setDocumentId`](../../base/classes/PdfStandardSecurityHandler.md#setdocumentid)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`setMasterKey`](../../base/classes/PdfStandardSecurityHandler.md#setmasterkey)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`setOwnerPassword`](../../base/classes/PdfStandardSecurityHandler.md#setownerpassword)

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

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`setPassword`](../../base/classes/PdfStandardSecurityHandler.md#setpassword)

---

### write()

> **write**(): `Promise`\<`void`\>

Writes the encryption dictionary with all computed keys and parameters.

#### Returns

`Promise`\<`void`\>

#### Throws

Error if required keys are not computed.

#### Inherited from

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md).[`write`](../../base/classes/PdfStandardSecurityHandler.md#write)
