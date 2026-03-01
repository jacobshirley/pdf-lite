[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-stream](../README.md) / PdfStreamPredictor

# Class: PdfStreamPredictor

## Extends

- [`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)\<\{ `BitsPerComponent?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); `Colors?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); `Columns?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); `Predictor?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); \}\>

## Constructors

### Constructor

> **new PdfStreamPredictor**(`entries?`): `PdfStreamPredictor`

#### Parameters

##### entries?

[`PdfDictionaryMap`](../../pdf-dictionary/type-aliases/PdfDictionaryMap.md) | \{ `BitsPerComponent?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); `Colors?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); `Columns?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); `Predictor?`: [`PdfNumber`](../../pdf-number/classes/PdfNumber.md); \}

#### Returns

`PdfStreamPredictor`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`constructor`](../../pdf-dictionary/classes/PdfDictionary.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`cachedTokens`](../../pdf-dictionary/classes/PdfDictionary.md#cachedtokens)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`immutable`](../../pdf-dictionary/classes/PdfDictionary.md#immutable)

---

### innerTokens

> **innerTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[] = `[]`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`innerTokens`](../../pdf-dictionary/classes/PdfDictionary.md#innertokens)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`modified`](../../pdf-dictionary/classes/PdfDictionary.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`postTokens`](../../pdf-dictionary/classes/PdfDictionary.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`preTokens`](../../pdf-dictionary/classes/PdfDictionary.md#pretokens)

---

### NONE

> `static` **NONE**: `PdfStreamPredictor`

---

### PNG_AVERAGE

> `static` **PNG_AVERAGE**: `PdfStreamPredictor`

---

### PNG_NONE

> `static` **PNG_NONE**: `PdfStreamPredictor`

---

### PNG_OPTIMUM

> `static` **PNG_OPTIMUM**: `PdfStreamPredictor`

---

### PNG_PAETH

> `static` **PNG_PAETH**: `PdfStreamPredictor`

---

### PNG_SUB

> `static` **PNG_SUB**: `PdfStreamPredictor`

---

### PNG_UP

> `static` **PNG_UP**: `PdfStreamPredictor`

---

### TIFF

> `static` **TIFF**: `PdfStreamPredictor`

---

### XREF_STREAM

> `static` **XREF_STREAM**: `PdfStreamPredictor`

## Accessors

### bitsPerComponent

#### Get Signature

> **get** **bitsPerComponent**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **bitsPerComponent**(`value`): `void`

##### Parameters

###### value

`number`

##### Returns

`void`

---

### colors

#### Get Signature

> **get** **colors**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **colors**(`value`): `void`

##### Parameters

###### value

`number`

##### Returns

`void`

---

### columns

#### Get Signature

> **get** **columns**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **columns**(`value`): `void`

##### Parameters

###### value

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

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`isTrailingDelimited`](../../pdf-dictionary/classes/PdfDictionary.md#istrailingdelimited)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`objectType`](../../pdf-dictionary/classes/PdfDictionary.md#objecttype)

---

### predictor

#### Get Signature

> **get** **predictor**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **predictor**(`value`): `void`

##### Parameters

###### value

`number`

##### Returns

`void`

---

### values

#### Get Signature

> **get** **values**(): `{ readonly [K in string]: T[K] }`

##### Returns

`{ readonly [K in string]: T[K] }`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`values`](../../pdf-dictionary/classes/PdfDictionary.md#values)

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

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`as`](../../pdf-dictionary/classes/PdfDictionary.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`clone`](../../pdf-dictionary/classes/PdfDictionary.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Overrides

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`cloneImpl`](../../pdf-dictionary/classes/PdfDictionary.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)\<`any`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`copyFrom`](../../pdf-dictionary/classes/PdfDictionary.md#copyfrom)

---

### decode()

> **decode**(`data`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Parameters

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### delete()

> **delete**\<`K`\>(`key`): `void`

#### Type Parameters

##### K

`K` _extends_ `"Predictor"` \| `"Columns"` \| `"Colors"` \| `"BitsPerComponent"`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`delete`](../../pdf-dictionary/classes/PdfDictionary.md#delete)

---

### encode()

> **encode**(`data`, `filterType`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Parameters

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### filterType

`number` = `0`

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### entries()

> **entries**(): `IterableIterator`\<\[`string`, [`PdfObject`](../../pdf-object/classes/PdfObject.md) \| `undefined`\]\>

Returns an iterator for the dictionary entries.
Each entry is a tuple of [key string, value].

#### Returns

`IterableIterator`\<\[`string`, [`PdfObject`](../../pdf-object/classes/PdfObject.md) \| `undefined`\]\>

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`entries`](../../pdf-dictionary/classes/PdfDictionary.md#entries)

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

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`equals`](../../pdf-dictionary/classes/PdfDictionary.md#equals)

---

### get()

> **get**\<`K`\>(`key`): `object`\[`K`\] \| `undefined`

#### Type Parameters

##### K

`K` _extends_ `"Predictor"` \| `"Columns"` \| `"Colors"` \| `"BitsPerComponent"`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`object`\[`K`\] \| `undefined`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`get`](../../pdf-dictionary/classes/PdfDictionary.md#get)

---

### has()

> **has**\<`K`\>(`key`): `boolean`

#### Type Parameters

##### K

`K` _extends_ `"Predictor"` \| `"Columns"` \| `"Colors"` \| `"BitsPerComponent"`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`has`](../../pdf-dictionary/classes/PdfDictionary.md#has)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`isImmutable`](../../pdf-dictionary/classes/PdfDictionary.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`isModified`](../../pdf-dictionary/classes/PdfDictionary.md#ismodified)

---

### set()

> **set**\<`K`\>(`key`, `value`): `void`

#### Type Parameters

##### K

`K` _extends_ `"Predictor"` \| `"Columns"` \| `"Colors"` \| `"BitsPerComponent"`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

##### value

`object`\[`K`\]

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`set`](../../pdf-dictionary/classes/PdfDictionary.md#set)

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

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`setImmutable`](../../pdf-dictionary/classes/PdfDictionary.md#setimmutable)

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

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`setModified`](../../pdf-dictionary/classes/PdfDictionary.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`toBase64`](../../pdf-dictionary/classes/PdfDictionary.md#tobase64)

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

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`toBytes`](../../pdf-dictionary/classes/PdfDictionary.md#tobytes)

---

### toDecodeParms()

> **toDecodeParms**(): [`DecodeParms`](../../../../types/type-aliases/DecodeParms.md)

#### Returns

[`DecodeParms`](../../../../types/type-aliases/DecodeParms.md)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`tokenize`](../../pdf-dictionary/classes/PdfDictionary.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`toString`](../../pdf-dictionary/classes/PdfDictionary.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md).[`toTokens`](../../pdf-dictionary/classes/PdfDictionary.md#totokens)

---

### fromDecodeParms()

> `static` **fromDecodeParms**(`params`): `PdfStreamPredictor`

#### Parameters

##### params

[`DecodeParms`](../../../../types/type-aliases/DecodeParms.md)

#### Returns

`PdfStreamPredictor`

---

### fromDictionary()

> `static` **fromDictionary**(`dict?`): `PdfStreamPredictor` \| `undefined`

#### Parameters

##### dict?

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>

#### Returns

`PdfStreamPredictor` \| `undefined`
