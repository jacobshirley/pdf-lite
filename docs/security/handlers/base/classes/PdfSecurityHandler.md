[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/base](../README.md) / PdfSecurityHandler

# Abstract Class: PdfSecurityHandler

Abstract base class for PDF security handlers.
Security handlers manage encryption, decryption, and access permissions for PDF documents.

## Example

```typescript
const handler = new PdfV5SecurityHandler({ password: 'secret' })
await handler.write()
const encryptedData = await handler.encrypt(
    'stream',
    data,
    objectNumber,
    generationNumber,
)
```

## Extended by

- [`PdfStandardSecurityHandler`](PdfStandardSecurityHandler.md)
- [`PdfPublicKeySecurityHandler`](../../pubSec/classes/PdfPublicKeySecurityHandler.md)

## Constructors

### Constructor

> **new PdfSecurityHandler**(`options?`): `PdfSecurityHandler`

Creates a new security handler.

#### Parameters

##### options?

[`PdfSecurityHandlerOptions`](../type-aliases/PdfSecurityHandlerOptions.md)

Configuration options for the security handler.

#### Returns

`PdfSecurityHandler`

## Properties

### dict

> **dict**: [`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary containing all encryption parameters.

---

### encryptMetadata

> **encryptMetadata**: `boolean`

Whether to encrypt document metadata.

---

### permissions

> **permissions**: `number`

Numeric permission flags.

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

---

### decodePermissions()

> **decodePermissions**(): [`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

Decodes the numeric permission flags into a PdfPermissions object.

#### Returns

[`PdfPermissions`](../../../../types/type-aliases/PdfPermissions.md)

An object with boolean flags for each permission.

---

### decrypt()

> `abstract` **decrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Decrypts data of a specific type.

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

---

### encrypt()

> `abstract` **encrypt**(`type`, `data`, `objectNumber?`, `generationNumber?`): `Promise`\<[`ByteArray`](../../../../types/type-aliases/ByteArray.md)\>

Encrypts data of a specific type.

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

---

### getDocumentId()

> `abstract` **getDocumentId**(): [`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

Gets the document ID array.

#### Returns

[`PdfId`](../../../types/type-aliases/PdfId.md) \| `undefined`

The document ID, or undefined if not set.

---

### getName()

> `abstract` **getName**(): `string`

Gets the security handler filter name.

#### Returns

`string`

The filter name (e.g., 'Standard').

---

### getRevision()

> `abstract` **getRevision**(): `number`

Gets the encryption revision number.

#### Returns

`number`

The revision number.

---

### getVersion()

> `abstract` **getVersion**(): `number`

Gets the encryption version number.

#### Returns

`number`

The version number (1-5).

---

### isReady()

> `abstract` **isReady**(): `boolean`

Checks if the security handler is ready for encryption/decryption.

#### Returns

`boolean`

True if ready, false otherwise.

---

### readEncryptionDictionary()

> `abstract` **readEncryptionDictionary**(`dictionary`): `void`

Reads and applies encryption parameters from a dictionary.

#### Parameters

##### dictionary

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF trailer.

#### Returns

`void`

---

### setDocumentId()

> `abstract` **setDocumentId**(`id`): `void`

Sets the document ID array.

#### Parameters

##### id

[`PdfId`](../../../types/type-aliases/PdfId.md)

The document ID to set.

#### Returns

`void`

---

### write()

> `abstract` **write**(): `Promise`\<`void`\>

Writes the encryption dictionary with computed keys.

#### Returns

`Promise`\<`void`\>
