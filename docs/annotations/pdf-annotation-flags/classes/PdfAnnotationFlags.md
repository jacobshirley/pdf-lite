[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [annotations/pdf-annotation-flags](../README.md) / PdfAnnotationFlags

# Class: PdfAnnotationFlags

Provides annotation flag (F field) accessors for PDF annotations.
These are generic to all annotation types per the PDF spec.

## Extends

- [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md)

## Constructors

### Constructor

> **new PdfAnnotationFlags**(`value`): `PdfAnnotationFlags`

#### Parameters

##### value

`number` = `0`

#### Returns

`PdfAnnotationFlags`

#### Overrides

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`constructor`](../../../core/objects/pdf-number/classes/PdfNumber.md#constructor)

## Properties

### decimalPlaces

> **decimalPlaces**: `number`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`decimalPlaces`](../../../core/objects/pdf-number/classes/PdfNumber.md#decimalplaces)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`immutable`](../../../core/objects/pdf-number/classes/PdfNumber.md#immutable)

---

### isByteOffset

> **isByteOffset**: `boolean` = `false`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`isByteOffset`](../../../core/objects/pdf-number/classes/PdfNumber.md#isbyteoffset)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`modified`](../../../core/objects/pdf-number/classes/PdfNumber.md#modified)

---

### padTo

> **padTo**: `number`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`padTo`](../../../core/objects/pdf-number/classes/PdfNumber.md#padto)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`postTokens`](../../../core/objects/pdf-number/classes/PdfNumber.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`preTokens`](../../../core/objects/pdf-number/classes/PdfNumber.md#pretokens)

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

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`objectType`](../../../core/objects/pdf-number/classes/PdfNumber.md#objecttype)

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

---

### ref

#### Get Signature

> **get** **ref**(): [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

##### Returns

[`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`ref`](../../../core/objects/pdf-number/classes/PdfNumber.md#ref)

---

### value

#### Get Signature

> **get** **value**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **value**(`value`): `void`

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`value`](../../../core/objects/pdf-number/classes/PdfNumber.md#value)

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

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`as`](../../../core/objects/pdf-number/classes/PdfNumber.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`clone`](../../../core/objects/pdf-number/classes/PdfNumber.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`cloneImpl`](../../../core/objects/pdf-number/classes/PdfNumber.md#cloneimpl)

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

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`equals`](../../../core/objects/pdf-number/classes/PdfNumber.md#equals)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`isImmutable`](../../../core/objects/pdf-number/classes/PdfNumber.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`isModified`](../../../core/objects/pdf-number/classes/PdfNumber.md#ismodified)

---

### onChange()

> **onChange**(`callback`): `void`

#### Parameters

##### callback

(`value`) => `void`

#### Returns

`void`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`onChange`](../../../core/objects/pdf-number/classes/PdfNumber.md#onchange)

---

### setImmutable()

> **setImmutable**(`immutable`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable

`boolean` = `true`

#### Returns

`void`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`setImmutable`](../../../core/objects/pdf-number/classes/PdfNumber.md#setimmutable)

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

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`setModified`](../../../core/objects/pdf-number/classes/PdfNumber.md#setmodified)

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

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`toBytes`](../../../core/objects/pdf-number/classes/PdfNumber.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfNumberToken`](../../../core/tokens/number-token/classes/PdfNumberToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfNumberToken`](../../../core/tokens/number-token/classes/PdfNumberToken.md)[]

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`tokenize`](../../../core/objects/pdf-number/classes/PdfNumber.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`toString`](../../../core/objects/pdf-number/classes/PdfNumber.md#tostring)

---

### toToken()

> **toToken**(): [`PdfNumberToken`](../../../core/tokens/number-token/classes/PdfNumberToken.md)

#### Returns

[`PdfNumberToken`](../../../core/tokens/number-token/classes/PdfNumberToken.md)

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`toToken`](../../../core/objects/pdf-number/classes/PdfNumber.md#totoken)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md).[`toTokens`](../../../core/objects/pdf-number/classes/PdfNumber.md#totokens)
