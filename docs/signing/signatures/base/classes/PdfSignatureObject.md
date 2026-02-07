[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [signing/signatures/base](../README.md) / PdfSignatureObject

# Abstract Class: PdfSignatureObject

Abstract base class for PDF signature objects.
Subclasses implement specific signature formats (PKCS#7, CAdES, etc.).

## Example

```typescript
const signature = new PdfAdbePkcs7DetachedSignatureObject({
    privateKey,
    certificate,
    reason: 'Approval',
})
document.add(signature)
await document.commit()
```

## Extends

- [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfSignatureDictionary`](PdfSignatureDictionary.md)\>

## Extended by

- [`PdfAdbePkcs7DetachedSignatureObject`](../../adbe-pkcs7-detached/classes/PdfAdbePkcs7DetachedSignatureObject.md)
- [`PdfAdbePkcs7Sha1SignatureObject`](../../adbe-pkcs7-sha1/classes/PdfAdbePkcs7Sha1SignatureObject.md)
- [`PdfAdbePkcsX509RsaSha1SignatureObject`](../../adbe-x509-rsa-sha1/classes/PdfAdbePkcsX509RsaSha1SignatureObject.md)
- [`PdfEtsiCadesDetachedSignatureObject`](../../etsi-cades-detached/classes/PdfEtsiCadesDetachedSignatureObject.md)
- [`PdfEtsiRfc3161SignatureObject`](../../etsi-rfc3161/classes/PdfEtsiRfc3161SignatureObject.md)

## Constructors

### Constructor

> **new PdfSignatureObject**(`content`): `PdfSignatureObject`

Creates a new signature object.

#### Parameters

##### content

Either a signature dictionary or options to create one.

[`PdfSignatureDictionary`](PdfSignatureDictionary.md) | [`PdfSignatureSignOptions`](../type-aliases/PdfSignatureSignOptions.md) & `object`

#### Returns

`PdfSignatureObject`

#### Overrides

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`constructor`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#constructor)

## Properties

### content

> **content**: [`PdfSignatureDictionary`](PdfSignatureDictionary.md)

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`content`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`encryptable`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`generationNumber`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`immutable`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`modified`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectNumber`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`offset`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`orderIndex`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`postTokens`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`preTokens`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`MAX_ORDER_INDEX`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#max_order_index)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectType`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`reference`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#reference)

---

### signedBytes

#### Get Signature

> **get** **signedBytes**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Gets the raw signature bytes.

##### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The signature bytes.

---

### signedHexadecimal

#### Get Signature

> **get** **signedHexadecimal**(): [`PdfHexadecimal`](../../../../core/objects/pdf-hexadecimal/classes/PdfHexadecimal.md)

Gets the signature hexadecimal content.

##### Throws

Error if Contents entry is missing.

##### Returns

[`PdfHexadecimal`](../../../../core/objects/pdf-hexadecimal/classes/PdfHexadecimal.md)

The Contents entry as hexadecimal.

## Methods

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`as`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`clone`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#clone)

---

### compareArrays()

> `protected` **compareArrays**(`a`, `b`): `boolean`

Compares two byte arrays for equality.

#### Parameters

##### a

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

First byte array.

##### b

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Second byte array.

#### Returns

`boolean`

True if arrays are equal, false otherwise.

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`copyFrom`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#copyfrom)

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`equals`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`inPdf`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isEncryptable`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isImmutable`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isModified`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`matchesReference`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#matchesreference)

---

### order()

> **order**(): `number`

Gets the insertion order for this object in the PDF.

#### Returns

`number`

High order value to place signature near end of document.

#### Overrides

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`order`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#order)

---

### setByteRange()

> **setByteRange**(`byteRange`): `void`

Sets the byte range array for the signature.

#### Parameters

##### byteRange

`number`[]

Array of [offset1, length1, offset2, length2].

#### Returns

`void`

#### Throws

Error if ByteRange entry is missing.

---

### setImmutable()

> **setImmutable**(`immutable?`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable?

`boolean`

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setImmutable`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setimmutable)

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

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setModified`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setmodified)

---

### setSignedBytes()

> **setSignedBytes**(`signedBytes`): `void`

Sets the signed bytes in the signature dictionary.

#### Parameters

##### signedBytes

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The signature bytes to set.

#### Returns

`void`

#### Throws

Error if Contents entry is missing.

---

### sign()

> `abstract` **sign**(`options`): `Promise`\<\{ `revocationInfo?`: [`RevocationInfo`](../../../types/type-aliases/RevocationInfo.md); `signedBytes`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

Signs the document bytes and returns the signature.

#### Parameters

##### options

Signing options including bytes to sign.

###### bytes

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

###### embedRevocationInfo?

`boolean`

#### Returns

`Promise`\<\{ `revocationInfo?`: [`RevocationInfo`](../../../types/type-aliases/RevocationInfo.md); `signedBytes`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

The signed bytes and optional revocation information.

---

### toBytes()

> **toBytes**(`padTo?`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Parameters

##### padTo?

`number`

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toBytes`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`tokenize`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toString`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toTokens`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#totokens)

---

### verify()

> `abstract` **verify**(`options`): `Promise`\<[`PdfSignatureVerificationResult`](../../../types/type-aliases/PdfSignatureVerificationResult.md)\>

Verifies the signature against the provided document bytes.

#### Parameters

##### options

[`PdfSignatureVerificationOptions`](../../../types/type-aliases/PdfSignatureVerificationOptions.md)

Verification options including the signed bytes.

#### Returns

`Promise`\<[`PdfSignatureVerificationResult`](../../../types/type-aliases/PdfSignatureVerificationResult.md)\>

The verification result.

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Inherited from

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`createPlaceholder`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#createplaceholder)
