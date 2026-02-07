[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-string](../README.md) / PdfString

# Class: PdfString

## Extends

- [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Extended by

- [`PdfDate`](../../pdf-date/classes/PdfDate.md)

## Constructors

### Constructor

> **new PdfString**(`raw`, `originalBytes?`): `PdfString`

#### Parameters

##### raw

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### originalBytes?

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`PdfString`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`constructor`](../../pdf-object/classes/PdfObject.md#constructor)

## Properties

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`immutable`](../../pdf-object/classes/PdfObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`modified`](../../pdf-object/classes/PdfObject.md#modified)

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

### isUTF16BE

#### Get Signature

> **get** **isUTF16BE**(): `boolean`

Checks if this string is UTF-16BE encoded (has UTF-16BE BOM).
UTF-16BE strings start with the byte order mark 0xFE 0xFF.

##### Returns

`boolean`

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`objectType`](../../pdf-object/classes/PdfObject.md#objecttype)

---

### raw

#### Get Signature

> **get** **raw**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Set Signature

> **set** **raw**(`raw`): `void`

##### Parameters

###### raw

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### Returns

`void`

---

### value

#### Get Signature

> **get** **value**(): `string`

##### Returns

`string`

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

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isImmutable`](../../pdf-object/classes/PdfObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isModified`](../../pdf-object/classes/PdfObject.md#ismodified)

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

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`setImmutable`](../../pdf-object/classes/PdfObject.md#setimmutable)

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

> `protected` **tokenize**(): [`PdfStringToken`](../../../tokens/string-token/classes/PdfStringToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfStringToken`](../../../tokens/string-token/classes/PdfStringToken.md)[]

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
