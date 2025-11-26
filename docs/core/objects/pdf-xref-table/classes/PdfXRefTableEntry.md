[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-xref-table](../README.md) / PdfXRefTableEntry

# Class: PdfXRefTableEntry

## Extends

- [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Constructors

### Constructor

> **new PdfXRefTableEntry**(`options`): `PdfXRefTableEntry`

#### Parameters

##### options

###### byteOffset

`number` \| [`Ref`](../../../ref/classes/Ref.md)\<`number`\> \| [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)

###### generationNumber

`number` \| [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)

###### inUse

`boolean`

###### objectNumber

`number` \| [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)

#### Returns

`PdfXRefTableEntry`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`constructor`](../../pdf-object/classes/PdfObject.md#constructor)

## Properties

### byteOffset

> **byteOffset**: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)

---

### generationNumber

> **generationNumber**: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)

---

### inUse

> **inUse**: `boolean`

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`modified`](../../pdf-object/classes/PdfObject.md#modified)

---

### objectNumber

> **objectNumber**: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)

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

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`objectType`](../../pdf-object/classes/PdfObject.md#objecttype)

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

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`clone`](../../pdf-object/classes/PdfObject.md#clone)

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

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isModified`](../../pdf-object/classes/PdfObject.md#ismodified)

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

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`setModified`](../../pdf-object/classes/PdfObject.md#setmodified)

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

> `protected` **tokenize**(): [`PdfXRefTableEntryToken`](../../../tokens/xref-table-entry-token/classes/PdfXRefTableEntryToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfXRefTableEntryToken`](../../../tokens/xref-table-entry-token/classes/PdfXRefTableEntryToken.md)[]

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
