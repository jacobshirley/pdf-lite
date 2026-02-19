[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/appearance/PdfButtonAppearanceStream](../README.md) / PdfButtonAppearanceStream

# Class: PdfButtonAppearanceStream

Appearance stream for button fields (checkboxes, radio buttons).

## Extends

- [`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md)

## Constructors

### Constructor

> **new PdfButtonAppearanceStream**(`ctx`): `PdfButtonAppearanceStream`

#### Parameters

##### ctx

###### contentStream

`string`

###### height

`number`

###### width

`number`

#### Returns

`PdfButtonAppearanceStream`

#### Overrides

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`constructor`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#constructor)

## Properties

### content

> **content**: [`PdfStream`](../../../../core/objects/pdf-stream/classes/PdfStream.md)

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`content`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`encryptable`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`generationNumber`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`immutable`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`modified`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`objectNumber`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`offset`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`orderIndex`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`postTokens`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`preTokens`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`MAX_ORDER_INDEX`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#max_order_index)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`objectType`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`reference`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#reference)

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

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`as`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`clone`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`cloneImpl`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`copyFrom`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#copyfrom)

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

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`equals`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`inPdf`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`isEncryptable`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`isImmutable`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`isModified`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`matchesReference`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`order`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#order)

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

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`setImmutable`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#setimmutable)

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

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`setModified`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#setmodified)

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

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`toBytes`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`tokenize`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`toString`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`toTokens`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#totokens)

---

### buildYesContent()

> `static` **buildYesContent**(`width`, `height`, `flags`): `string`

#### Parameters

##### width

`number`

##### height

`number`

##### flags

`number`

#### Returns

`string`

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

[`PdfAppearanceStream`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md).[`createPlaceholder`](../../PdfAppearanceStream/classes/PdfAppearanceStream.md#createplaceholder)
