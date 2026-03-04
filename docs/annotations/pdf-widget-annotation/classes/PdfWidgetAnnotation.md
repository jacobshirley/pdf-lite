[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [annotations/pdf-widget-annotation](../README.md) / PdfWidgetAnnotation

# Class: PdfWidgetAnnotation

Widget annotation subtype. Extends PdfAnnotation with widget-specific
properties: isWidget (Type/Subtype) and AS (appearance state).

## Extends

- [`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md)

## Extended by

- [`PdfFormField`](../../../acroform/fields/pdf-form-field/classes/PdfFormField.md)

## Constructors

### Constructor

> **new PdfWidgetAnnotation**(`options?`): `PdfWidgetAnnotation`

#### Parameters

##### options?

###### other?

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Returns

`PdfWidgetAnnotation`

#### Overrides

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`constructor`](../../pdf-annotation/classes/PdfAnnotation.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`cachedTokens`](../../pdf-annotation/classes/PdfAnnotation.md#cachedtokens)

---

### compressed?

> `optional` **compressed**: `boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`compressed`](../../pdf-annotation/classes/PdfAnnotation.md#compressed)

---

### content

> **content**: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`content`](../../pdf-annotation/classes/PdfAnnotation.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`encryptable`](../../pdf-annotation/classes/PdfAnnotation.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`generationNumber`](../../pdf-annotation/classes/PdfAnnotation.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`immutable`](../../pdf-annotation/classes/PdfAnnotation.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`modified`](../../pdf-annotation/classes/PdfAnnotation.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`objectNumber`](../../pdf-annotation/classes/PdfAnnotation.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`offset`](../../pdf-annotation/classes/PdfAnnotation.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`orderIndex`](../../pdf-annotation/classes/PdfAnnotation.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`postTokens`](../../pdf-annotation/classes/PdfAnnotation.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`preTokens`](../../pdf-annotation/classes/PdfAnnotation.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`MAX_ORDER_INDEX`](../../pdf-annotation/classes/PdfAnnotation.md#max_order_index)

## Accessors

### annotationFlags

#### Get Signature

> **get** **annotationFlags**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **annotationFlags**(`flags`): `void`

##### Parameters

###### flags

`number`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`annotationFlags`](../../pdf-annotation/classes/PdfAnnotation.md#annotationflags)

---

### appearanceState

#### Get Signature

> **get** **appearanceState**(): `string` \| `null`

##### Returns

`string` \| `null`

#### Set Signature

> **set** **appearanceState**(`state`): `void`

##### Parameters

###### state

`string` | `null`

##### Returns

`void`

---

### appearanceStreamDict

#### Get Signature

> **get** **appearanceStreamDict**(): [`PdfAppearanceStreamDictionary`](../../pdf-annotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

##### Returns

[`PdfAppearanceStreamDictionary`](../../pdf-annotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

#### Set Signature

> **set** **appearanceStreamDict**(`dict`): `void`

##### Parameters

###### dict

[`PdfAppearanceStreamDictionary`](../../pdf-annotation/type-aliases/PdfAppearanceStreamDictionary.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfTextFormField`](../../../acroform/fields/pdf-text-form-field/classes/PdfTextFormField.md).[`appearanceStreamDict`](../../../acroform/fields/pdf-text-form-field/classes/PdfTextFormField.md#appearancestreamdict)

---

### hidden

#### Get Signature

> **get** **hidden**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **hidden**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`hidden`](../../pdf-annotation/classes/PdfAnnotation.md#hidden)

---

### invisible

#### Get Signature

> **get** **invisible**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **invisible**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`invisible`](../../pdf-annotation/classes/PdfAnnotation.md#invisible)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`isTrailingDelimited`](../../pdf-annotation/classes/PdfAnnotation.md#istrailingdelimited)

---

### isWidget

#### Get Signature

> **get** **isWidget**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **isWidget**(`isWidget`): `void`

##### Parameters

###### isWidget

`boolean`

##### Returns

`void`

---

### key

#### Get Signature

> **get** **key**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`key`](../../pdf-annotation/classes/PdfAnnotation.md#key)

---

### locked

#### Get Signature

> **get** **locked**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **locked**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`locked`](../../pdf-annotation/classes/PdfAnnotation.md#locked)

---

### noRotate

#### Get Signature

> **get** **noRotate**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noRotate**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`noRotate`](../../pdf-annotation/classes/PdfAnnotation.md#norotate)

---

### noView

#### Get Signature

> **get** **noView**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noView**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`noView`](../../pdf-annotation/classes/PdfAnnotation.md#noview)

---

### noZoom

#### Get Signature

> **get** **noZoom**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noZoom**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfSignatureFormField`](../../../acroform/fields/pdf-signature-form-field/classes/PdfSignatureFormField.md).[`noZoom`](../../../acroform/fields/pdf-signature-form-field/classes/PdfSignatureFormField.md#nozoom)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`objectType`](../../pdf-annotation/classes/PdfAnnotation.md#objecttype)

---

### page

#### Get Signature

> **get** **page**(): [`PdfPage`](../../../pdf/pdf-page/classes/PdfPage.md) \| `null`

##### Returns

[`PdfPage`](../../../pdf/pdf-page/classes/PdfPage.md) \| `null`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`page`](../../pdf-annotation/classes/PdfAnnotation.md#page)

---

### parentRef

#### Get Signature

> **get** **parentRef**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>\> \| `null`

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>\> \| `null`

#### Set Signature

> **set** **parentRef**(`ref`): `void`

##### Parameters

###### ref

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>\> | `null`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`parentRef`](../../pdf-annotation/classes/PdfAnnotation.md#parentref)

---

### print

#### Get Signature

> **get** **print**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **print**(`value`): `void`

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`PdfSignatureFormField`](../../../acroform/fields/pdf-signature-form-field/classes/PdfSignatureFormField.md).[`print`](../../../acroform/fields/pdf-signature-form-field/classes/PdfSignatureFormField.md#print)

---

### rect

#### Get Signature

> **get** **rect**(): \[`number`, `number`, `number`, `number`\] \| `null`

##### Returns

\[`number`, `number`, `number`, `number`\] \| `null`

#### Set Signature

> **set** **rect**(`rect`): `void`

##### Parameters

###### rect

\[`number`, `number`, `number`, `number`\] | `null`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`rect`](../../pdf-annotation/classes/PdfAnnotation.md#rect)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`reference`](../../pdf-annotation/classes/PdfAnnotation.md#reference)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`as`](../../pdf-annotation/classes/PdfAnnotation.md#as)

---

### becomes()

> **becomes**\<`T`\>(`cls`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`becomes`](../../pdf-annotation/classes/PdfAnnotation.md#becomes)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`clone`](../../pdf-annotation/classes/PdfAnnotation.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`cloneImpl`](../../pdf-annotation/classes/PdfAnnotation.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`copyFrom`](../../pdf-annotation/classes/PdfAnnotation.md#copyfrom)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`equals`](../../pdf-annotation/classes/PdfAnnotation.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`inPdf`](../../pdf-annotation/classes/PdfAnnotation.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`isEncryptable`](../../pdf-annotation/classes/PdfAnnotation.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`isImmutable`](../../pdf-annotation/classes/PdfAnnotation.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`isModified`](../../pdf-annotation/classes/PdfAnnotation.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>\>

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`matchesReference`](../../pdf-annotation/classes/PdfAnnotation.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`order`](../../pdf-annotation/classes/PdfAnnotation.md#order)

---

### resolve()

> **resolve**\<`T`\>(`cls?`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls?

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`resolve`](../../pdf-annotation/classes/PdfAnnotation.md#resolve)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`setImmutable`](../../pdf-annotation/classes/PdfAnnotation.md#setimmutable)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`setModified`](../../pdf-annotation/classes/PdfAnnotation.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`toBase64`](../../pdf-annotation/classes/PdfAnnotation.md#tobase64)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`toBytes`](../../pdf-annotation/classes/PdfAnnotation.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`tokenize`](../../pdf-annotation/classes/PdfAnnotation.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`toString`](../../pdf-annotation/classes/PdfAnnotation.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`toTokens`](../../pdf-annotation/classes/PdfAnnotation.md#totokens)

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

[`PdfAnnotation`](../../pdf-annotation/classes/PdfAnnotation.md).[`createPlaceholder`](../../pdf-annotation/classes/PdfAnnotation.md#createplaceholder)
