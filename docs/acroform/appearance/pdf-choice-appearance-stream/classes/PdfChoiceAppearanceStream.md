[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/appearance/pdf-choice-appearance-stream](../README.md) / PdfChoiceAppearanceStream

# Class: PdfChoiceAppearanceStream

Appearance stream for choice fields (dropdowns, list boxes).

## Extends

- [`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md)

## Constructors

### Constructor

> **new PdfChoiceAppearanceStream**(`ctx`): `PdfChoiceAppearanceStream`

#### Parameters

##### ctx

###### da

[`PdfDefaultAppearance`](../../../fields/pdf-default-appearance/classes/PdfDefaultAppearance.md)

###### displayOptions?

`string`[]

###### flags

`number` \| [`PdfFormFieldFlags`](../../../fields/pdf-form-field-flags/classes/PdfFormFieldFlags.md)

###### fontResources?

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>

###### isUnicode?

`boolean`

###### rect

\[`number`, `number`, `number`, `number`\]

###### resolvedFonts?

`Map`\<`string`, [`PdfFont`](../../../../fonts/pdf-font/classes/PdfFont.md)\>

###### reverseEncodingMap?

`Map`\<`string`, `number`\>

###### selectedIndex?

`number`

###### value

`string`

#### Returns

`PdfChoiceAppearanceStream`

#### Overrides

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`constructor`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`cachedTokens`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#cachedtokens)

---

### compressed?

> `optional` **compressed**: `boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`compressed`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#compressed)

---

### content

> **content**: [`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`content`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`encryptable`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`generationNumber`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`immutable`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`modified`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`objectNumber`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`offset`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`orderIndex`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`postTokens`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`preTokens`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`MAX_ORDER_INDEX`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#max_order_index)

## Accessors

### contentStream

#### Get Signature

> **get** **contentStream**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **contentStream**(`newContent`): `void`

##### Parameters

###### newContent

`string`

##### Returns

`void`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`contentStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#contentstream)

---

### graphics

#### Set Signature

> **set** **graphics**(`g`): `void`

##### Parameters

###### g

[`PdfGraphics`](../../pdf-graphics/classes/PdfGraphics.md)

##### Returns

`void`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`graphics`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#graphics)

---

### isTrailingDelimited

#### Get Signature

> **get** **isTrailingDelimited**(): `boolean`

Returns true if this object's serialized form ends with a self-delimiting
character (e.g., `)`, `>`, `]`, `>>`). Such objects do not require trailing
whitespace before the next token.

##### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`isTrailingDelimited`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#istrailingdelimited)

---

### key

#### Get Signature

> **get** **key**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`key`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#key)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`objectType`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`reference`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#reference)

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

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`as`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#as)

---

### becomes()

> **becomes**\<`T`\>(`cls`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`becomes`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#becomes)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`clone`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`cloneImpl`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`copyFrom`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#copyfrom)

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

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`equals`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`inPdf`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`isEncryptable`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`isImmutable`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`isModified`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\>

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`matchesReference`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`order`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#order)

---

### resolve()

> **resolve**\<`T`\>(`cls?`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls?

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`resolve`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#resolve)

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

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`setImmutable`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#setimmutable)

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

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`setModified`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`toBase64`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#tobase64)

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

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`toBytes`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`tokenize`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`toString`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`toTokens`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#totokens)

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

[`PdfAppearanceStream`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md).[`createPlaceholder`](../../pdf-appearance-stream/classes/PdfAppearanceStream.md#createplaceholder)
