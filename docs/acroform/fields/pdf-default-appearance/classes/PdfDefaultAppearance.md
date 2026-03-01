[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/pdf-default-appearance](../README.md) / PdfDefaultAppearance

# Class: PdfDefaultAppearance

Value object that parses and builds DA (Default Appearance) strings.
DA format: "/FontName FontSize Tf ColorOp"

Extends PdfString so it can be stored directly in dictionaries
without additional wrapping.

## Extends

- [`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md)

## Constructors

### Constructor

> **new PdfDefaultAppearance**(`fontName`, `fontSize`, `colorOp`): `PdfDefaultAppearance`

#### Parameters

##### fontName

`string`

##### fontSize

`number`

##### colorOp

`string`

#### Returns

`PdfDefaultAppearance`

#### Overrides

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`constructor`](../../../../core/objects/pdf-string/classes/PdfString.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`cachedTokens`](../../../../core/objects/pdf-string/classes/PdfString.md#cachedtokens)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`immutable`](../../../../core/objects/pdf-string/classes/PdfString.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`modified`](../../../../core/objects/pdf-string/classes/PdfString.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`postTokens`](../../../../core/objects/pdf-string/classes/PdfString.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`preTokens`](../../../../core/objects/pdf-string/classes/PdfString.md#pretokens)

## Accessors

### colorOp

#### Get Signature

> **get** **colorOp**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **colorOp**(`op`): `void`

##### Parameters

###### op

`string`

##### Returns

`void`

---

### fontName

#### Get Signature

> **get** **fontName**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **fontName**(`name`): `void`

##### Parameters

###### name

`string`

##### Returns

`void`

---

### fontSize

#### Get Signature

> **get** **fontSize**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **fontSize**(`size`): `void`

##### Parameters

###### size

`number`

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`isTrailingDelimited`](../../../../core/objects/pdf-string/classes/PdfString.md#istrailingdelimited)

---

### isUTF16BE

#### Get Signature

> **get** **isUTF16BE**(): `boolean`

Checks if this string is UTF-16BE encoded (has UTF-16BE BOM).
UTF-16BE strings start with the byte order mark 0xFE 0xFF.

##### Returns

`boolean`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`isUTF16BE`](../../../../core/objects/pdf-string/classes/PdfString.md#isutf16be)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`objectType`](../../../../core/objects/pdf-string/classes/PdfString.md#objecttype)

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`raw`](../../../../core/objects/pdf-string/classes/PdfString.md#raw)

---

### value

#### Get Signature

> **get** **value**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **value**(`str`): `void`

##### Parameters

###### str

`string`

##### Returns

`void`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`value`](../../../../core/objects/pdf-string/classes/PdfString.md#value)

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`as`](../../../../core/objects/pdf-string/classes/PdfString.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`clone`](../../../../core/objects/pdf-string/classes/PdfString.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`cloneImpl`](../../../../core/objects/pdf-string/classes/PdfString.md#cloneimpl)

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`equals`](../../../../core/objects/pdf-string/classes/PdfString.md#equals)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`isImmutable`](../../../../core/objects/pdf-string/classes/PdfString.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`isModified`](../../../../core/objects/pdf-string/classes/PdfString.md#ismodified)

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`setImmutable`](../../../../core/objects/pdf-string/classes/PdfString.md#setimmutable)

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`setModified`](../../../../core/objects/pdf-string/classes/PdfString.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`toBase64`](../../../../core/objects/pdf-string/classes/PdfString.md#tobase64)

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

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`toBytes`](../../../../core/objects/pdf-string/classes/PdfString.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfStringToken`](../../../../core/tokens/string-token/classes/PdfStringToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfStringToken`](../../../../core/tokens/string-token/classes/PdfStringToken.md)[]

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`tokenize`](../../../../core/objects/pdf-string/classes/PdfString.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Overrides

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`toString`](../../../../core/objects/pdf-string/classes/PdfString.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfString`](../../../../core/objects/pdf-string/classes/PdfString.md).[`toTokens`](../../../../core/objects/pdf-string/classes/PdfString.md#totokens)

---

### parse()

> `static` **parse**(`da`): `PdfDefaultAppearance` \| `null`

#### Parameters

##### da

`string`

#### Returns

`PdfDefaultAppearance` \| `null`
