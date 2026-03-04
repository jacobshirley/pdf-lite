[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/pdf-form-field-flags](../README.md) / PdfFormFieldFlags

# Class: PdfFormFieldFlags

Field-specific Ff flag accessors for form fields.
These are separate from annotation flags (F field).
Extends PdfNumber so it can be stored directly in a PDF dictionary.

## Extends

- [`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md)

## Constructors

### Constructor

> **new PdfFormFieldFlags**(`value`): `PdfFormFieldFlags`

#### Parameters

##### value

`number` | [`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md) | `PdfFormFieldFlags`

#### Returns

`PdfFormFieldFlags`

#### Overrides

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`constructor`](../../../../core/objects/pdf-number/classes/PdfNumber.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`cachedTokens`](../../../../core/objects/pdf-number/classes/PdfNumber.md#cachedtokens)

---

### decimalPlaces

> **decimalPlaces**: `number`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`decimalPlaces`](../../../../core/objects/pdf-number/classes/PdfNumber.md#decimalplaces)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`immutable`](../../../../core/objects/pdf-number/classes/PdfNumber.md#immutable)

---

### isByteOffset

> **isByteOffset**: `boolean` = `false`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`isByteOffset`](../../../../core/objects/pdf-number/classes/PdfNumber.md#isbyteoffset)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`modified`](../../../../core/objects/pdf-number/classes/PdfNumber.md#modified)

---

### padTo

> **padTo**: `number`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`padTo`](../../../../core/objects/pdf-number/classes/PdfNumber.md#padto)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`postTokens`](../../../../core/objects/pdf-number/classes/PdfNumber.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`preTokens`](../../../../core/objects/pdf-number/classes/PdfNumber.md#pretokens)

## Accessors

### comb

#### Get Signature

> **get** **comb**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **comb**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### combo

#### Get Signature

> **get** **combo**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **combo**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### commitOnSelChange

#### Get Signature

> **get** **commitOnSelChange**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **commitOnSelChange**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### doNotScroll

#### Get Signature

> **get** **doNotScroll**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **doNotScroll**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### doNotSpellCheck

#### Get Signature

> **get** **doNotSpellCheck**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **doNotSpellCheck**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### edit

#### Get Signature

> **get** **edit**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **edit**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### flags

#### Get Signature

> **get** **flags**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **flags**(`v`): `void`

##### Parameters

###### v

`number` | `PdfFormFieldFlags`

##### Returns

`void`

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`isTrailingDelimited`](../../../../core/objects/pdf-number/classes/PdfNumber.md#istrailingdelimited)

---

### multiline

#### Get Signature

> **get** **multiline**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **multiline**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### multiSelect

#### Get Signature

> **get** **multiSelect**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **multiSelect**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### noExport

#### Get Signature

> **get** **noExport**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noExport**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### noToggleToOff

#### Get Signature

> **get** **noToggleToOff**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **noToggleToOff**(`v`): `void`

##### Parameters

###### v

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`objectType`](../../../../core/objects/pdf-number/classes/PdfNumber.md#objecttype)

---

### password

#### Get Signature

> **get** **password**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **password**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### pushButton

#### Get Signature

> **get** **pushButton**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **pushButton**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### radio

#### Get Signature

> **get** **radio**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **radio**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### readOnly

#### Get Signature

> **get** **readOnly**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **readOnly**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### ref

#### Get Signature

> **get** **ref**(): [`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

##### Returns

[`Ref`](../../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`ref`](../../../../core/objects/pdf-number/classes/PdfNumber.md#ref)

---

### required

#### Get Signature

> **get** **required**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **required**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

---

### sort

#### Get Signature

> **get** **sort**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **sort**(`v`): `void`

##### Parameters

###### v

`boolean`

##### Returns

`void`

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`value`](../../../../core/objects/pdf-number/classes/PdfNumber.md#value)

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`as`](../../../../core/objects/pdf-number/classes/PdfNumber.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`clone`](../../../../core/objects/pdf-number/classes/PdfNumber.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`cloneImpl`](../../../../core/objects/pdf-number/classes/PdfNumber.md#cloneimpl)

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`equals`](../../../../core/objects/pdf-number/classes/PdfNumber.md#equals)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`isImmutable`](../../../../core/objects/pdf-number/classes/PdfNumber.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`isModified`](../../../../core/objects/pdf-number/classes/PdfNumber.md#ismodified)

---

### onChange()

> **onChange**(`callback`): `void`

#### Parameters

##### callback

(`value`) => `void`

#### Returns

`void`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`onChange`](../../../../core/objects/pdf-number/classes/PdfNumber.md#onchange)

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`setImmutable`](../../../../core/objects/pdf-number/classes/PdfNumber.md#setimmutable)

---

### setModified()

> **setModified**(`modified?`): `void`

Sets the modified state of the object. Override this method if the modified state is determined differently

#### Parameters

##### modified?

`boolean`

#### Returns

`void`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`setModified`](../../../../core/objects/pdf-number/classes/PdfNumber.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`toBase64`](../../../../core/objects/pdf-number/classes/PdfNumber.md#tobase64)

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

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`toBytes`](../../../../core/objects/pdf-number/classes/PdfNumber.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfNumberToken`](../../../../core/tokens/number-token/classes/PdfNumberToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfNumberToken`](../../../../core/tokens/number-token/classes/PdfNumberToken.md)[]

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`tokenize`](../../../../core/objects/pdf-number/classes/PdfNumber.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`toString`](../../../../core/objects/pdf-number/classes/PdfNumber.md#tostring)

---

### toToken()

> **toToken**(): [`PdfNumberToken`](../../../../core/tokens/number-token/classes/PdfNumberToken.md)

#### Returns

[`PdfNumberToken`](../../../../core/tokens/number-token/classes/PdfNumberToken.md)

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`toToken`](../../../../core/objects/pdf-number/classes/PdfNumber.md#totoken)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfNumber`](../../../../core/objects/pdf-number/classes/PdfNumber.md).[`toTokens`](../../../../core/objects/pdf-number/classes/PdfNumber.md#totokens)
