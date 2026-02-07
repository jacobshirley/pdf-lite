[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [signing/signatures/adbe-pkcs7-sha1](../README.md) / PdfAdbePkcs7Sha1SignatureObject

# Class: PdfAdbePkcs7Sha1SignatureObject

PKCS#7 SHA-1 signature object (adbe.pkcs7.sha1).
Creates CMS SignedData with SHA-1 hash embedded as signed content.

## Example

```typescript
const signature = new PdfAdbePkcs7Sha1SignatureObject({
    privateKey: keyBytes,
    certificate: certBytes,
})
```

## Extends

- [`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md)

## Constructors

### Constructor

> **new PdfAdbePkcs7Sha1SignatureObject**(`options`): `PdfAdbePkcs7Sha1SignatureObject`

Creates a new PKCS#7 SHA-1 signature object.

#### Parameters

##### options

[`PdfSignatureSignOptions`](../../base/type-aliases/PdfSignatureSignOptions.md) & `object`

Signature configuration options.

#### Returns

`PdfAdbePkcs7Sha1SignatureObject`

#### Overrides

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`constructor`](../../base/classes/PdfSignatureObject.md#constructor)

## Properties

### additionalCertificates

> **additionalCertificates**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)[]

Additional certificates for chain building.

---

### certificate

> **certificate**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Signer certificate.

---

### content

> **content**: [`PdfSignatureDictionary`](../../base/classes/PdfSignatureDictionary.md)

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`content`](../../base/classes/PdfSignatureObject.md#content)

---

### date?

> `optional` **date**: `Date`

Signing date.

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`encryptable`](../../base/classes/PdfSignatureObject.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`generationNumber`](../../base/classes/PdfSignatureObject.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`immutable`](../../base/classes/PdfSignatureObject.md#immutable)

---

### issuerCertificate?

> `optional` **issuerCertificate**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Issuer certificate for OCSP requests.

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`modified`](../../base/classes/PdfSignatureObject.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`objectNumber`](../../base/classes/PdfSignatureObject.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`offset`](../../base/classes/PdfSignatureObject.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`orderIndex`](../../base/classes/PdfSignatureObject.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`postTokens`](../../base/classes/PdfSignatureObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`preTokens`](../../base/classes/PdfSignatureObject.md#pretokens)

---

### privateKey

> **privateKey**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Private key for signing.

---

### revocationInfo?

> `optional` **revocationInfo**: [`RevocationInfo`](../../../types/type-aliases/RevocationInfo.md) \| `"fetch"`

Revocation information or 'fetch' to retrieve automatically.

---

### sign()

> **sign**: (`options`) => `Promise`\<\{ `revocationInfo?`: [`RevocationInfo`](../../../types/type-aliases/RevocationInfo.md); `signedBytes`: [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}\>

Signs the document bytes using PKCS#7 SHA-1 format.

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

#### Param

Signing options with bytes and revocation embedding flag.

#### Returns

The CMS SignedData and revocation information.

#### Overrides

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`sign`](../../base/classes/PdfSignatureObject.md#sign)

---

### timeStampAuthority?

> `optional` **timeStampAuthority**: [`TimeStampAuthority`](../../../types/type-aliases/TimeStampAuthority.md)

Timestamp authority configuration.

---

### verify()

> **verify**: (`options`) => `Promise`\<[`PdfSignatureVerificationResult`](../../../types/type-aliases/PdfSignatureVerificationResult.md)\>

Verifies the signature against the provided document bytes.

Verifies the signature against the provided document bytes.

#### Parameters

##### options

[`PdfSignatureVerificationOptions`](../../../types/type-aliases/PdfSignatureVerificationOptions.md)

Verification options including the signed bytes.

#### Returns

`Promise`\<[`PdfSignatureVerificationResult`](../../../types/type-aliases/PdfSignatureVerificationResult.md)\>

The verification result.

#### Param

Verification options including the signed bytes.

#### Returns

The verification result.

#### Overrides

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`verify`](../../base/classes/PdfSignatureObject.md#verify)

---

### ALGORITHM

> `readonly` `static` **ALGORITHM**: `AsymmetricEncryptionAlgorithmParams`

Fixed algorithm for SHA-1 signatures.

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`MAX_ORDER_INDEX`](../../base/classes/PdfSignatureObject.md#max_order_index)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`objectType`](../../base/classes/PdfSignatureObject.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`reference`](../../base/classes/PdfSignatureObject.md#reference)

---

### signedBytes

#### Get Signature

> **get** **signedBytes**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Gets the raw signature bytes.

##### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

The signature bytes.

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`signedBytes`](../../base/classes/PdfSignatureObject.md#signedbytes)

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

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`signedHexadecimal`](../../base/classes/PdfSignatureObject.md#signedhexadecimal)

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

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`as`](../../base/classes/PdfSignatureObject.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`clone`](../../base/classes/PdfSignatureObject.md#clone)

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

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`compareArrays`](../../base/classes/PdfSignatureObject.md#comparearrays)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`copyFrom`](../../base/classes/PdfSignatureObject.md#copyfrom)

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

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`equals`](../../base/classes/PdfSignatureObject.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`inPdf`](../../base/classes/PdfSignatureObject.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`isEncryptable`](../../base/classes/PdfSignatureObject.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`isImmutable`](../../base/classes/PdfSignatureObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`isModified`](../../base/classes/PdfSignatureObject.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`matchesReference`](../../base/classes/PdfSignatureObject.md#matchesreference)

---

### order()

> **order**(): `number`

Gets the insertion order for this object in the PDF.

#### Returns

`number`

High order value to place signature near end of document.

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`order`](../../base/classes/PdfSignatureObject.md#order)

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

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`setByteRange`](../../base/classes/PdfSignatureObject.md#setbyterange)

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

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`setImmutable`](../../base/classes/PdfSignatureObject.md#setimmutable)

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

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`setModified`](../../base/classes/PdfSignatureObject.md#setmodified)

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

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`setSignedBytes`](../../base/classes/PdfSignatureObject.md#setsignedbytes)

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

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`toBytes`](../../base/classes/PdfSignatureObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`tokenize`](../../base/classes/PdfSignatureObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`toString`](../../base/classes/PdfSignatureObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`toTokens`](../../base/classes/PdfSignatureObject.md#totokens)

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

[`PdfSignatureObject`](../../base/classes/PdfSignatureObject.md).[`createPlaceholder`](../../base/classes/PdfSignatureObject.md#createplaceholder)
