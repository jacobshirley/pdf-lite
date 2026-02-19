[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [annotations/PdfWidgetAnnotation](../README.md) / PdfWidgetAnnotation

# Class: PdfWidgetAnnotation

Widget annotation subtype. Extends PdfAnnotation with widget-specific
properties: isWidget (Type/Subtype) and AS (appearance state).

## Extends

- [`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md)

## Extended by

- [`PdfFormField`](../../../acroform/fields/PdfFormField/classes/PdfFormField.md)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`constructor`](../../PdfAnnotation/classes/PdfAnnotation.md#constructor)

## Properties

### content

> **content**: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`content`](../../PdfAnnotation/classes/PdfAnnotation.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`encryptable`](../../PdfAnnotation/classes/PdfAnnotation.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`generationNumber`](../../PdfAnnotation/classes/PdfAnnotation.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`immutable`](../../PdfAnnotation/classes/PdfAnnotation.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`modified`](../../PdfAnnotation/classes/PdfAnnotation.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`objectNumber`](../../PdfAnnotation/classes/PdfAnnotation.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`offset`](../../PdfAnnotation/classes/PdfAnnotation.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`orderIndex`](../../PdfAnnotation/classes/PdfAnnotation.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`postTokens`](../../PdfAnnotation/classes/PdfAnnotation.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`preTokens`](../../PdfAnnotation/classes/PdfAnnotation.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`MAX_ORDER_INDEX`](../../PdfAnnotation/classes/PdfAnnotation.md#max_order_index)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`annotationFlags`](../../PdfAnnotation/classes/PdfAnnotation.md#annotationflags)

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

> **get** **appearanceStreamDict**(): [`PdfAppearanceStreamDictionary`](../../PdfAnnotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

##### Returns

[`PdfAppearanceStreamDictionary`](../../PdfAnnotation/type-aliases/PdfAppearanceStreamDictionary.md) \| `null`

#### Set Signature

> **set** **appearanceStreamDict**(`dict`): `void`

##### Parameters

###### dict

[`PdfAppearanceStreamDictionary`](../../PdfAnnotation/type-aliases/PdfAppearanceStreamDictionary.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfTextFormField`](../../../acroform/fields/PdfTextFormField/classes/PdfTextFormField.md).[`appearanceStreamDict`](../../../acroform/fields/PdfTextFormField/classes/PdfTextFormField.md#appearancestreamdict)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`hidden`](../../PdfAnnotation/classes/PdfAnnotation.md#hidden)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`invisible`](../../PdfAnnotation/classes/PdfAnnotation.md#invisible)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`locked`](../../PdfAnnotation/classes/PdfAnnotation.md#locked)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`noRotate`](../../PdfAnnotation/classes/PdfAnnotation.md#norotate)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`noView`](../../PdfAnnotation/classes/PdfAnnotation.md#noview)

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

[`PdfSignatureFormField`](../../../acroform/fields/PdfSignatureFormField/classes/PdfSignatureFormField.md).[`noZoom`](../../../acroform/fields/PdfSignatureFormField/classes/PdfSignatureFormField.md#nozoom)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`objectType`](../../PdfAnnotation/classes/PdfAnnotation.md#objecttype)

---

### parentRef

#### Get Signature

> **get** **parentRef**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `null`

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) \| `null`

#### Set Signature

> **set** **parentRef**(`ref`): `void`

##### Parameters

###### ref

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md) | `null`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`parentRef`](../../PdfAnnotation/classes/PdfAnnotation.md#parentref)

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

[`PdfSignatureFormField`](../../../acroform/fields/PdfSignatureFormField/classes/PdfSignatureFormField.md).[`print`](../../../acroform/fields/PdfSignatureFormField/classes/PdfSignatureFormField.md#print)

---

### rect

#### Get Signature

> **get** **rect**(): `number`[] \| `null`

##### Returns

`number`[] \| `null`

#### Set Signature

> **set** **rect**(`rect`): `void`

##### Parameters

###### rect

`number`[] | `null`

##### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`rect`](../../PdfAnnotation/classes/PdfAnnotation.md#rect)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`reference`](../../PdfAnnotation/classes/PdfAnnotation.md#reference)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`as`](../../PdfAnnotation/classes/PdfAnnotation.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`clone`](../../PdfAnnotation/classes/PdfAnnotation.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`cloneImpl`](../../PdfAnnotation/classes/PdfAnnotation.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`copyFrom`](../../PdfAnnotation/classes/PdfAnnotation.md#copyfrom)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`equals`](../../PdfAnnotation/classes/PdfAnnotation.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`inPdf`](../../PdfAnnotation/classes/PdfAnnotation.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`isEncryptable`](../../PdfAnnotation/classes/PdfAnnotation.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`isImmutable`](../../PdfAnnotation/classes/PdfAnnotation.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`isModified`](../../PdfAnnotation/classes/PdfAnnotation.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`matchesReference`](../../PdfAnnotation/classes/PdfAnnotation.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`order`](../../PdfAnnotation/classes/PdfAnnotation.md#order)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`setImmutable`](../../PdfAnnotation/classes/PdfAnnotation.md#setimmutable)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`setModified`](../../PdfAnnotation/classes/PdfAnnotation.md#setmodified)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`toBytes`](../../PdfAnnotation/classes/PdfAnnotation.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`tokenize`](../../PdfAnnotation/classes/PdfAnnotation.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`toString`](../../PdfAnnotation/classes/PdfAnnotation.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`toTokens`](../../PdfAnnotation/classes/PdfAnnotation.md#totokens)

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

[`PdfAnnotation`](../../PdfAnnotation/classes/PdfAnnotation.md).[`createPlaceholder`](../../PdfAnnotation/classes/PdfAnnotation.md#createplaceholder)
