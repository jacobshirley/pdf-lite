[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/xfa/PdfXfaForm](../README.md) / PdfXfaForm

# Class: PdfXfaForm

Typed wrapper around the XFA name/stream-ref array.
Holds eagerly-loaded references to component streams like datasets.

## Extends

- [`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md)

## Constructors

### Constructor

> **new PdfXfaForm**(`items`): `PdfXfaForm`

#### Parameters

##### items

[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)[] = `[]`

#### Returns

`PdfXfaForm`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`constructor`](../../../../core/objects/pdf-array/classes/PdfArray.md#constructor)

## Properties

### datasets

> **datasets**: [`PdfXfaData`](../../PdfXfaData/classes/PdfXfaData.md) \| `null` = `null`

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`immutable`](../../../../core/objects/pdf-array/classes/PdfArray.md#immutable)

---

### innerTokens

> **innerTokens**: [`PdfWhitespaceToken`](../../../../core/tokens/whitespace-token/classes/PdfWhitespaceToken.md)[] = `[]`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`innerTokens`](../../../../core/objects/pdf-array/classes/PdfArray.md#innertokens)

---

### items

> **items**: [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)[]

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`items`](../../../../core/objects/pdf-array/classes/PdfArray.md#items)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`modified`](../../../../core/objects/pdf-array/classes/PdfArray.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`postTokens`](../../../../core/objects/pdf-array/classes/PdfArray.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`preTokens`](../../../../core/objects/pdf-array/classes/PdfArray.md#pretokens)

## Accessors

### length

#### Get Signature

> **get** **length**(): `number`

##### Returns

`number`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`length`](../../../../core/objects/pdf-array/classes/PdfArray.md#length)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`objectType`](../../../../core/objects/pdf-array/classes/PdfArray.md#objecttype)

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

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`as`](../../../../core/objects/pdf-array/classes/PdfArray.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`clone`](../../../../core/objects/pdf-array/classes/PdfArray.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`cloneImpl`](../../../../core/objects/pdf-array/classes/PdfArray.md#cloneimpl)

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

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`equals`](../../../../core/objects/pdf-array/classes/PdfArray.md#equals)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`isImmutable`](../../../../core/objects/pdf-array/classes/PdfArray.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`isModified`](../../../../core/objects/pdf-array/classes/PdfArray.md#ismodified)

---

### push()

> **push**(`item`): `void`

#### Parameters

##### item

[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`void`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`push`](../../../../core/objects/pdf-array/classes/PdfArray.md#push)

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

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`setImmutable`](../../../../core/objects/pdf-array/classes/PdfArray.md#setimmutable)

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

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`setModified`](../../../../core/objects/pdf-array/classes/PdfArray.md#setmodified)

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

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`toBytes`](../../../../core/objects/pdf-array/classes/PdfArray.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`tokenize`](../../../../core/objects/pdf-array/classes/PdfArray.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`toString`](../../../../core/objects/pdf-array/classes/PdfArray.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md).[`toTokens`](../../../../core/objects/pdf-array/classes/PdfArray.md#totokens)

---

### write()

> **write**(`document`): `void`

#### Parameters

##### document

[`PdfDocument`](../../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`void`

---

### fromDocument()

> `static` **fromDocument**(`document`): `Promise`\<`PdfXfaForm` \| `null`\>

#### Parameters

##### document

[`PdfDocument`](../../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`Promise`\<`PdfXfaForm` \| `null`\>
