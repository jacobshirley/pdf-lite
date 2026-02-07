[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-number](../README.md) / PdfByteOffsetNumber

# Class: PdfByteOffsetNumber

## Extends

- [`PdfNumber`](PdfNumber.md)

## Constructors

### Constructor

> **new PdfByteOffsetNumber**(`options`): `PdfByteOffsetNumber`

#### Parameters

##### options

`number` | [`Ref`](../../../ref/classes/Ref.md)\<`number`\> | [`PdfNumber`](PdfNumber.md) | \{ `decimalPlaces?`: `number`; `padTo?`: `number`; `value`: `number` \| [`Ref`](../../../ref/classes/Ref.md)\<`number`\>; \}

#### Returns

`PdfByteOffsetNumber`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`constructor`](PdfNumber.md#constructor)

## Properties

### decimalPlaces

> **decimalPlaces**: `number`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`decimalPlaces`](PdfNumber.md#decimalplaces)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`immutable`](PdfNumber.md#immutable)

---

### isByteOffset

> **isByteOffset**: `boolean` = `true`

#### Overrides

[`PdfNumber`](PdfNumber.md).[`isByteOffset`](PdfNumber.md#isbyteoffset)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`modified`](PdfNumber.md#modified)

---

### padTo

> **padTo**: `number`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`padTo`](PdfNumber.md#padto)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`postTokens`](PdfNumber.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`preTokens`](PdfNumber.md#pretokens)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`objectType`](PdfNumber.md#objecttype)

---

### ref

#### Get Signature

> **get** **ref**(): [`Ref`](../../../ref/classes/Ref.md)\<`number`\>

##### Returns

[`Ref`](../../../ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`ref`](PdfNumber.md#ref)

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

[`PdfNumber`](PdfNumber.md).[`value`](PdfNumber.md#value)

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

[`PdfNumber`](PdfNumber.md).[`as`](PdfNumber.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`clone`](PdfNumber.md#clone)

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

[`PdfNumber`](PdfNumber.md).[`equals`](PdfNumber.md#equals)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`isImmutable`](PdfNumber.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`isModified`](PdfNumber.md#ismodified)

---

### onChange()

> **onChange**(`callback`): `void`

#### Parameters

##### callback

(`value`) => `void`

#### Returns

`void`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`onChange`](PdfNumber.md#onchange)

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

[`PdfNumber`](PdfNumber.md).[`setImmutable`](PdfNumber.md#setimmutable)

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

[`PdfNumber`](PdfNumber.md).[`setModified`](PdfNumber.md#setmodified)

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

[`PdfNumber`](PdfNumber.md).[`toBytes`](PdfNumber.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfNumberToken`](../../../tokens/number-token/classes/PdfNumberToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfNumberToken`](../../../tokens/number-token/classes/PdfNumberToken.md)[]

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`tokenize`](PdfNumber.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`toString`](PdfNumber.md#tostring)

---

### toToken()

> **toToken**(): [`PdfNumberToken`](../../../tokens/number-token/classes/PdfNumberToken.md)

#### Returns

[`PdfNumberToken`](../../../tokens/number-token/classes/PdfNumberToken.md)

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`toToken`](PdfNumber.md#totoken)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfNumber`](PdfNumber.md).[`toTokens`](PdfNumber.md#totokens)
