[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-indirect-object](../README.md) / PdfIndirectObject

# Class: PdfIndirectObject\<T\>

## Extends

- [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Extended by

- [`PdfAcroForm`](../../../../acroform/pdf-acro-form/classes/PdfAcroForm.md)
- [`PdfAnnotation`](../../../../annotations/pdf-annotation/classes/PdfAnnotation.md)
- [`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md)
- [`PdfPage`](../../../../pdf/pdf-page/classes/PdfPage.md)
- [`PdfPages`](../../../../pdf/pdf-pages/classes/PdfPages.md)
- [`PdfCertObject`](../../../../signing/document-security-store/classes/PdfCertObject.md)
- [`PdfCrlObject`](../../../../signing/document-security-store/classes/PdfCrlObject.md)
- [`PdfOcspObject`](../../../../signing/document-security-store/classes/PdfOcspObject.md)
- [`PdfDocumentSecurityStoreObject`](../../../../signing/document-security-store/classes/PdfDocumentSecurityStoreObject.md)
- [`PdfAppearanceStream`](../../../../acroform/appearance/pdf-appearance-stream/classes/PdfAppearanceStream.md)
- [`PdfXfaData`](../../../../acroform/xfa/pdf-xfa-data/classes/PdfXfaData.md)
- [`PdfSignatureObject`](../../../../signing/signatures/base/classes/PdfSignatureObject.md)

## Type Parameters

### T

`T` _extends_ [`PdfObject`](../../pdf-object/classes/PdfObject.md) = [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Constructors

### Constructor

> **new PdfIndirectObject**\<`T`\>(`options?`): `PdfIndirectObject`\<`T`\>

#### Parameters

##### options?

[`PdfIndirectObjectOptions`](../type-aliases/PdfIndirectObjectOptions.md)\<`T`\>

#### Returns

`PdfIndirectObject`\<`T`\>

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`constructor`](../../pdf-object/classes/PdfObject.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`cachedTokens`](../../pdf-object/classes/PdfObject.md#cachedtokens)

---

### compressed?

> `optional` **compressed**: `boolean`

---

### content

> **content**: `T`

---

### encryptable?

> `optional` **encryptable**: `boolean`

---

### generationNumber

> **generationNumber**: `number`

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`immutable`](../../pdf-object/classes/PdfObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`modified`](../../pdf-object/classes/PdfObject.md#modified)

---

### objectNumber

> **objectNumber**: `number`

---

### offset

> **offset**: [`Ref`](../../../ref/classes/Ref.md)\<`number`\>

---

### orderIndex?

> `optional` **orderIndex**: `number`

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`postTokens`](../../pdf-object/classes/PdfObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`preTokens`](../../pdf-object/classes/PdfObject.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

## Accessors

### isTrailingDelimited

#### Get Signature

> **get** **isTrailingDelimited**(): `boolean`

Returns true if this object's serialized form ends with a self-delimiting
character (e.g., `)`, `>`, `]`, `>>`). Such objects do not require trailing
whitespace before the next token.

##### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isTrailingDelimited`](../../pdf-object/classes/PdfObject.md#istrailingdelimited)

---

### key

#### Get Signature

> **get** **key**(): `string`

##### Returns

`string`

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`objectType`](../../pdf-object/classes/PdfObject.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

##### Returns

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

## Methods

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../pdf-object/classes/PdfObject.md)

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`as`](../../pdf-object/classes/PdfObject.md#as)

---

### becomes()

> **becomes**\<`T`\>(`cls`): `T`

#### Type Parameters

##### T

`T` _extends_ `PdfIndirectObject`\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls

(`options`) => `T`

#### Returns

`T`

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`clone`](../../pdf-object/classes/PdfObject.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`cloneImpl`](../../pdf-object/classes/PdfObject.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

`PdfIndirectObject`

#### Returns

`void`

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

[`PdfObject`](../../pdf-object/classes/PdfObject.md)

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`equals`](../../pdf-object/classes/PdfObject.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isImmutable`](../../pdf-object/classes/PdfObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isModified`](../../pdf-object/classes/PdfObject.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)\<`PdfIndirectObject`\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>\>

#### Returns

`boolean`

---

### order()

> **order**(): `number`

#### Returns

`number`

---

### resolve()

> **resolve**\<`T`\>(`cls?`): `T`

#### Type Parameters

##### T

`T` _extends_ `PdfIndirectObject`\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls?

(`options`) => `T`

#### Returns

`T`

---

### setImmutable()

> **setImmutable**(`immutable?`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable?

`boolean`

#### Returns

`void`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`setImmutable`](../../pdf-object/classes/PdfObject.md#setimmutable)

---

### setModified()

> **setModified**(`modified`): `void`

Sets the modified state of the object. Override this method if the modified state is determined differently

#### Parameters

##### modified

`boolean` = `true`

#### Returns

`void`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`setModified`](../../pdf-object/classes/PdfObject.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`toBase64`](../../pdf-object/classes/PdfObject.md#tobase64)

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

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`toBytes`](../../pdf-object/classes/PdfObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`tokenize`](../../pdf-object/classes/PdfObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`toString`](../../pdf-object/classes/PdfObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`toTokens`](../../pdf-object/classes/PdfObject.md#totokens)

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): `PdfIndirectObject`\<`T` _extends_ `unknown` ? [`PdfNull`](../../pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

`PdfIndirectObject`\<`T` _extends_ `unknown` ? [`PdfNull`](../../pdf-null/classes/PdfNull.md) : `T`\>
