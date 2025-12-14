[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [pdf/pdf-document](../README.md) / PdfDocument

# Class: PdfDocument

Represents a PDF document with support for reading, writing, and modifying PDF files.
Handles document structure, revisions, encryption, and digital signatures.

## Example

```typescript
// Create a new document
const document = new PdfDocument()

// Read from bytes
const document = await PdfDocument.fromBytes(fileBytes)

// Add objects and commit
document.add(pdfObject)
await document.commit()
```

## Extends

- [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

## Constructors

### Constructor

> **new PdfDocument**(`options?`): `PdfDocument`

Creates a new PDF document instance.

#### Parameters

##### options?

Configuration options for the document

###### ownerPassword?

`string`

Owner password for encryption

###### password?

`string`

User password for encryption

###### revisions?

[`PdfRevision`](../../pdf-revision/classes/PdfRevision.md)[]

Pre-existing revisions for the document

###### securityHandler?

[`PdfSecurityHandler`](../../../security/handlers/base/classes/PdfSecurityHandler.md)

Custom security handler for encryption

###### signer?

[`PdfSigner`](../../../signing/signer/classes/PdfSigner.md)

Custom signer for digital signatures

###### version?

`string` \| [`PdfComment`](../../../core/objects/pdf-comment/classes/PdfComment.md)

PDF version string (e.g., '1.7', '2.0') or version comment

#### Returns

`PdfDocument`

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`constructor`](../../../core/objects/pdf-object/classes/PdfObject.md#constructor)

## Properties

### header

> **header**: [`PdfComment`](../../../core/objects/pdf-comment/classes/PdfComment.md)

PDF version comment header

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`modified`](../../../core/objects/pdf-object/classes/PdfObject.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`postTokens`](../../../core/objects/pdf-object/classes/PdfObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`preTokens`](../../../core/objects/pdf-object/classes/PdfObject.md#pretokens)

---

### revisions

> **revisions**: [`PdfRevision`](../../pdf-revision/classes/PdfRevision.md)[]

List of document revisions for incremental updates

---

### securityHandler?

> `optional` **securityHandler**: [`PdfSecurityHandler`](../../../security/handlers/base/classes/PdfSecurityHandler.md)

Security handler for encryption/decryption operations

---

### signer

> **signer**: [`PdfSigner`](../../../signing/signer/classes/PdfSigner.md)

Signer instance for digital signature operations

## Accessors

### encryptionDictionary

#### Get Signature

> **get** **encryptionDictionary**(): [`PdfEncryptionDictionaryObject`](../../../security/types/type-aliases/PdfEncryptionDictionaryObject.md) \| `undefined`

Gets the encryption dictionary from the document if present.

##### Throws

Error if the encryption dictionary reference points to a non-dictionary object

##### Returns

[`PdfEncryptionDictionaryObject`](../../../security/types/type-aliases/PdfEncryptionDictionaryObject.md) \| `undefined`

The encryption dictionary object or undefined if not encrypted

---

### latestRevision

#### Get Signature

> **get** **latestRevision**(): [`PdfRevision`](../../pdf-revision/classes/PdfRevision.md)

Gets the latest (most recent) revision of the document.

##### Throws

Error if the revision for the last StartXRef cannot be found

##### Returns

[`PdfRevision`](../../pdf-revision/classes/PdfRevision.md)

The latest PdfRevision

---

### metadataStreamReference

#### Get Signature

> **get** **metadataStreamReference**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `undefined`

Gets the reference to the metadata stream from the document catalog.

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `undefined`

The metadata stream reference or undefined if not present

---

### objects

#### Get Signature

> **get** **objects**(): readonly [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Gets all objects across all revisions in the document.

##### Returns

readonly [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

A readonly array of all PDF objects

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`objectType`](../../../core/objects/pdf-object/classes/PdfObject.md#objecttype)

---

### rootDictionary

#### Get Signature

> **get** **rootDictionary**(): [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\> \| `undefined`

Gets the document catalog (root) dictionary.

##### Throws

Error if the Root reference points to a non-dictionary object

##### Returns

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\> \| `undefined`

The root dictionary or undefined if not found

---

### trailerDict

#### Get Signature

> **get** **trailerDict**(): [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfTrailerEntries`](../../../core/objects/pdf-trailer/type-aliases/PdfTrailerEntries.md)\>

Gets the trailer dictionary from the cross-reference lookup.

##### Returns

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfTrailerEntries`](../../../core/objects/pdf-trailer/type-aliases/PdfTrailerEntries.md)\>

The trailer dictionary containing document metadata references

---

### xrefLookup

#### Get Signature

> **get** **xrefLookup**(): [`PdfXrefLookup`](../../pdf-xref-lookup/classes/PdfXrefLookup.md)

Gets the cross-reference lookup table for the latest revision.

##### Returns

[`PdfXrefLookup`](../../pdf-xref-lookup/classes/PdfXrefLookup.md)

The PdfXrefLookup for the latest revision

## Methods

### add()

> **add**(...`objects`): `void`

Adds objects to the document's latest revision.
Automatically starts a new revision if the current one is locked.

#### Parameters

##### objects

...[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

PDF objects to add to the document

#### Returns

`void`

---

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`as`](../../../core/objects/pdf-object/classes/PdfObject.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep copy of the document.

#### Returns

`this`

A cloned PdfDocument instance

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`clone`](../../../core/objects/pdf-object/classes/PdfObject.md#clone)

---

### commit()

> **commit**(...`newObjects`): `Promise`\<`void`\>

Commits pending objects to the document.
Adds objects, applies encryption if configured, and updates the document structure.

#### Parameters

##### newObjects

...[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Additional objects to add before committing

#### Returns

`Promise`\<`void`\>

---

### decrypt()

> **decrypt**(): `Promise`\<`void`\>

Decrypts all encrypted objects in the document.
Removes the security handler and encryption dictionary after decryption.

#### Returns

`Promise`\<`void`\>

---

### deleteObject()

> **deleteObject**(`obj`): `Promise`\<`void`\>

Deletes an object from all revisions in the document.

#### Parameters

##### obj

The PDF object to delete

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md) | `undefined`

#### Returns

`Promise`\<`void`\>

---

### encrypt()

> **encrypt**(): `Promise`\<`void`\>

Encrypts all objects in the document using the security handler.
Creates and adds an encryption dictionary to all revisions.

#### Returns

`Promise`\<`void`\>

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`equals`](../../../core/objects/pdf-object/classes/PdfObject.md#equals)

---

### findCompressedObject()

> **findCompressedObject**(`options`): `Promise`\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> \| `undefined`\>

Finds a compressed object by its object number within an object stream.

#### Parameters

##### options

Object identifier with objectNumber and optional generationNumber

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) | \{ `generationNumber?`: `number`; `objectNumber`: `number`; \}

#### Returns

`Promise`\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> \| `undefined`\>

The found indirect object or undefined if not found

#### Throws

Error if the object cannot be found in the expected object stream

---

### findUncompressedObject()

> **findUncompressedObject**(`options`): [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> \| `undefined`

Finds an uncompressed indirect object by its object number.

#### Parameters

##### options

Object identifier with objectNumber and optional generationNumber

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) | \{ `generationNumber?`: `number`; `objectNumber`: `number`; \}

#### Returns

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> \| `undefined`

The found indirect object or undefined if not found

#### Throws

FoundCompressedObjectError if the object is compressed (in an object stream)

---

### hasObject()

> **hasObject**(`obj`): `boolean`

Checks if a PDF object exists in the document.

#### Parameters

##### obj

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

The PDF object to check

#### Returns

`boolean`

True if the object exists in the document

---

### isIncremental()

> **isIncremental**(): `boolean`

Checks if the document is in incremental mode.

#### Returns

`boolean`

True if all revisions are locked for incremental updates

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`isModified`](../../../core/objects/pdf-object/classes/PdfObject.md#ismodified)

---

### readObject()

> **readObject**(`options`): `Promise`\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> \| `undefined`\>

Reads and optionally decrypts an object by its object number.
Handles both compressed and uncompressed objects.

#### Parameters

##### options

Object lookup options

###### allowUnindexed?

`boolean`

If true, searches unindexed objects as fallback

###### generationNumber?

`number`

Optional generation number filter

###### objectNumber

`number`

The object number to find

#### Returns

`Promise`\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> \| `undefined`\>

A cloned and decrypted copy of the object, or undefined if not found

---

### setDocumentSecurityStore()

> **setDocumentSecurityStore**(`dss`): `Promise`\<`void`\>

Sets the Document Security Store (DSS) for the document.
Used for long-term validation of digital signatures.

#### Parameters

##### dss

[`PdfDocumentSecurityStoreObject`](../../../signing/document-security-store/classes/PdfDocumentSecurityStoreObject.md)

The Document Security Store object to set

#### Returns

`Promise`\<`void`\>

#### Throws

Error if the document has no root dictionary

---

### setIncremental()

> **setIncremental**(`value`): `void`

Sets whether the document should use incremental updates.
When true, locks all existing revisions to preserve original content.

#### Parameters

##### value

`boolean` = `true`

True to enable incremental mode, false to disable. Defaults to true.

#### Returns

`void`

---

### setModified()

> **setModified**(`modified`): `void`

Sets the modified state of the object. Override this method if the modified state is determined differently

#### Parameters

##### modified

`boolean` = `true`

#### Returns

`void`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`setModified`](../../../core/objects/pdf-object/classes/PdfObject.md#setmodified)

---

### setOwnerPassword()

> **setOwnerPassword**(`ownerPassword`): `void`

Sets the owner password for document encryption.

#### Parameters

##### ownerPassword

`string`

The owner password to set

#### Returns

`void`

#### Throws

Error if the security handler doesn't support password setting

---

### setPassword()

> **setPassword**(`password`): `void`

Sets the user password for document encryption.

#### Parameters

##### password

`string`

The user password to set

#### Returns

`void`

#### Throws

Error if the security handler doesn't support password setting

---

### setVersion()

> **setVersion**(`version`): `void`

Sets the PDF version for the document.

#### Parameters

##### version

`string`

The PDF version string (e.g., '1.7', '2.0')

#### Returns

`void`

#### Throws

Error if attempting to change version after objects have been added in incremental mode

---

### startNewRevision()

> **startNewRevision**(): `PdfDocument`

Starts a new revision for incremental updates.
Creates a new revision linked to the previous one.

#### Returns

`PdfDocument`

The document instance for method chaining

---

### toBytes()

> **toBytes**(): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Serializes the document to a byte array.

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The PDF document as a Uint8Array

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`toBytes`](../../../core/objects/pdf-object/classes/PdfObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Overrides

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`tokenize`](../../../core/objects/pdf-object/classes/PdfObject.md#tokenize)

---

### tokensWithObjects()

> **tokensWithObjects**(): `object`[]

Returns tokens paired with their source objects.
Useful for debugging and analysis of document structure.

#### Returns

`object`[]

Array of token-object pairs

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`toString`](../../../core/objects/pdf-object/classes/PdfObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md).[`toTokens`](../../../core/objects/pdf-object/classes/PdfObject.md#totokens)

---

### verifySignatures()

> **verifySignatures**(): `Promise`\<[`PdfDocumentVerificationResult`](../../../signing/signer/type-aliases/PdfDocumentVerificationResult.md)\>

Verifies all digital signatures in the document.

#### Returns

`Promise`\<[`PdfDocumentVerificationResult`](../../../signing/signer/type-aliases/PdfDocumentVerificationResult.md)\>

A promise that resolves to the verification result

---

### fromBytes()

> `static` **fromBytes**(`input`): `Promise`\<`PdfDocument`\>

Creates a PdfDocument from a byte stream.

#### Parameters

##### input

Async or sync iterable of byte arrays

`Iterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md), `any`, `any`\> | `AsyncIterable`\<[`ByteArray`](../../../types/type-aliases/ByteArray.md), `any`, `any`\>

#### Returns

`Promise`\<`PdfDocument`\>

A promise that resolves to the parsed PdfDocument

---

### fromObjects()

> `static` **fromObjects**(`objects`): `PdfDocument`

Creates a PdfDocument from an array of PDF objects.
Parses objects into revisions based on EOF comments.

#### Parameters

##### objects

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

Array of PDF objects to construct the document from

#### Returns

`PdfDocument`

A new PdfDocument instance
