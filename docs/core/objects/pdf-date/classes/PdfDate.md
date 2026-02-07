[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-date](../README.md) / PdfDate

# Class: PdfDate

## Extends

- [`PdfString`](../../pdf-string/classes/PdfString.md)

## Constructors

### Constructor

> **new PdfDate**(`date`): `PdfDate`

#### Parameters

##### date

`Date`

#### Returns

`PdfDate`

#### Overrides

[`PdfString`](../../pdf-string/classes/PdfString.md).[`constructor`](../../pdf-string/classes/PdfString.md#constructor)

## Properties

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`immutable`](../../pdf-string/classes/PdfString.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`modified`](../../pdf-string/classes/PdfString.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`postTokens`](../../pdf-string/classes/PdfString.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`preTokens`](../../pdf-string/classes/PdfString.md#pretokens)

## Accessors

### date

#### Get Signature

> **get** **date**(): `Date`

##### Returns

`Date`

---

### isUTF16BE

#### Get Signature

> **get** **isUTF16BE**(): `boolean`

Checks if this string is UTF-16BE encoded (has UTF-16BE BOM).
UTF-16BE strings start with the byte order mark 0xFE 0xFF.

##### Returns

`boolean`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`isUTF16BE`](../../pdf-string/classes/PdfString.md#isutf16be)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`objectType`](../../pdf-string/classes/PdfString.md#objecttype)

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

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`raw`](../../pdf-string/classes/PdfString.md#raw)

---

### value

#### Get Signature

> **get** **value**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`value`](../../pdf-string/classes/PdfString.md#value)

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

[`PdfString`](../../pdf-string/classes/PdfString.md).[`as`](../../pdf-string/classes/PdfString.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`clone`](../../pdf-string/classes/PdfString.md#clone)

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

[`PdfString`](../../pdf-string/classes/PdfString.md).[`equals`](../../pdf-string/classes/PdfString.md#equals)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`isImmutable`](../../pdf-string/classes/PdfString.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`isModified`](../../pdf-string/classes/PdfString.md#ismodified)

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

[`PdfString`](../../pdf-string/classes/PdfString.md).[`setImmutable`](../../pdf-string/classes/PdfString.md#setimmutable)

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

[`PdfString`](../../pdf-string/classes/PdfString.md).[`setModified`](../../pdf-string/classes/PdfString.md#setmodified)

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

[`PdfString`](../../pdf-string/classes/PdfString.md).[`toBytes`](../../pdf-string/classes/PdfString.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfStringToken`](../../../tokens/string-token/classes/PdfStringToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfStringToken`](../../../tokens/string-token/classes/PdfStringToken.md)[]

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`tokenize`](../../pdf-string/classes/PdfString.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`toString`](../../pdf-string/classes/PdfString.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfString`](../../pdf-string/classes/PdfString.md).[`toTokens`](../../pdf-string/classes/PdfString.md#totokens)
