[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/document-security-store](../README.md) / PdfOcspObject

# Class: PdfOcspObject

Indirect object containing an OCSP response stream.

## Extends

- [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\>

## Constructors

### Constructor

> **new PdfOcspObject**(`options?`): `PdfOcspObject`

#### Parameters

##### options?

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\> | [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\> | \{ `content?`: [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)\<[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>; `encryptable?`: `boolean`; `generationNumber?`: `number`; `objectNumber?`: `number`; `offset?`: `number` \| [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>; \}

#### Returns

`PdfOcspObject`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`constructor`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#constructor)

## Properties

### content

> **content**: [`PdfStream`](../../../core/objects/pdf-stream/classes/PdfStream.md)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`content`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`encryptable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`generationNumber`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`immutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`modified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectNumber`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`offset`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`orderIndex`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`postTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`preTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`MAX_ORDER_INDEX`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#max_order_index)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectType`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`reference`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#reference)

## Methods

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`as`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`clone`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`cloneImpl`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`copyFrom`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#copyfrom)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`equals`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`inPdf`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isEncryptable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isImmutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isModified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`matchesReference`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`order`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#order)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setImmutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setimmutable)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setModified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setmodified)

---

### toBytes()

> **toBytes**(`padTo?`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Parameters

##### padTo?

`number`

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toBytes`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`tokenize`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toString`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#totokens)

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`createPlaceholder`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#createplaceholder)
