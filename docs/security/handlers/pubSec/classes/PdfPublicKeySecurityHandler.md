[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/pubSec](../README.md) / PdfPublicKeySecurityHandler

# Class: PdfPublicKeySecurityHandler

Public key security handler implementing certificate-based encryption.
Uses PKCS#7 enveloped data to encrypt the file key for each recipient.

## Example

```typescript
const handler = new PdfPublicKeySecurityHandler({
    recipients: [
        {
            certificate: recipientCertBytes,
            privateKey: privateKeyBytes,
        },
    ],
})
```

## Extends

- [`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md)

## Constructors

### Constructor

> **new PdfPublicKeySecurityHandler**(`options`): `PdfPublicKeySecurityHandler`

Creates a new public key security handler.

#### Parameters

##### options

Configuration including recipients and encryption settings.

###### encryptMetadata?

`boolean`

###### permissions?

`number` \| [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

###### recipients

[`PdfEncryptionRecipient`](../../../types/type-aliases/PdfEncryptionRecipient.md)[]

###### seed?

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

###### standardSecurityHandler?

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md)

#### Returns

`PdfPublicKeySecurityHandler`

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`constructor`](../../base/classes/PdfSecurityHandler.md#constructor)

## Properties

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

#### Inherited from

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`dict`](../../base/classes/PdfSecurityHandler.md#dict)

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

#### Inherited from

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`encryptMetadata`](../../base/classes/PdfSecurityHandler.md#encryptmetadata)

---

### permissions

> **permissions**: `number`

Numeric permission flags.

#### Inherited from

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`permissions`](../../base/classes/PdfSecurityHandler.md#permissions)

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

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`buildPermissions`](../../base/classes/PdfSecurityHandler.md#buildpermissions)

---

### canEncryptMetadata()

> **canEncryptMetadata**(): `boolean`

Checks if metadata encryption is enabled.

#### Returns

`boolean`

True if metadata should be encrypted.

---

### computeObjectKey()

> **computeObjectKey**(`objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Computes the object encryption key.

#### Parameters

##### objectNumber?

`number`

The PDF object number.

##### generationNumber?

`number`

The PDF generation number.

#### Returns

`Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

The computed object key.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`computeObjectKey`](../../base/classes/PdfSecurityHandler.md#computeobjectkey)

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

#### Inherited from

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`decodePermissions`](../../base/classes/PdfSecurityHandler.md#decodepermissions)

---

### decrypt()

> **decrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Decrypts data using the underlying security handler.

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

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`decrypt`](../../base/classes/PdfSecurityHandler.md#decrypt)

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

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`decryptObject`](../../base/classes/PdfSecurityHandler.md#decryptobject)

---

### encrypt()

> **encrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Encrypts data using the underlying security handler.

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

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`encrypt`](../../base/classes/PdfSecurityHandler.md#encrypt)

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

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`encryptObject`](../../base/classes/PdfSecurityHandler.md#encryptobject)

---

### getDocumentId()

> **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`getDocumentId`](../../base/classes/PdfSecurityHandler.md#getdocumentid)

---

### getName()

> **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

'Adobe.PubSec' for public key encryption.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`getName`](../../base/classes/PdfSecurityHandler.md#getname)

---

### getRevision()

> **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

The revision from the underlying handler.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`getRevision`](../../base/classes/PdfSecurityHandler.md#getrevision)

---

### getStandardSecurityHandler()

> **getStandardSecurityHandler**(): [`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md)

Gets the underlying standard security handler.

#### Returns

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md)

The standard security handler used for encryption.

---

### getVersion()

> **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

The version from the underlying handler.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`getVersion`](../../base/classes/PdfSecurityHandler.md#getversion)

---

### isReady()

> **isReady**(): `boolean`

Checks if the handler is ready.

#### Returns

`boolean`

True if the underlying handler is ready.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`isReady`](../../base/classes/PdfSecurityHandler.md#isready)

---

### readEncryptionDictionary()

> **readEncryptionDictionary**(`dictionary`): `void`

Reads encryption parameters from the encryption dictionary.

#### Parameters

##### dictionary

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF.

#### Returns

`void`

#### Throws

Error if required entries are missing.

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`readEncryptionDictionary`](../../base/classes/PdfSecurityHandler.md#readencryptiondictionary)

---

### setDocumentId()

> **setDocumentId**(`id`): `void`

Sets the document ID.

#### Parameters

##### id

[`PdfId`](../../../types/type-aliases/PdfId.md)

The document ID array.

#### Returns

`void`

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`setDocumentId`](../../base/classes/PdfSecurityHandler.md#setdocumentid)

---

### write()

> **write**(): `Promise`\<`void`\>

Writes the encryption dictionary with public key-specific entries.

#### Returns

`Promise`\<`void`\>

#### Overrides

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md).[`write`](../../base/classes/PdfSecurityHandler.md#write)
