[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-stream](../README.md) / PdfStream

# Class: PdfStream\<T\>

## Extends

- [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Extended by

- [`PdfObjStream`](PdfObjStream.md)
- [`PdfXRefStream`](PdfXRefStream.md)

## Type Parameters

### T

`T` _extends_ [`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md) = [`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)

## Constructors

### Constructor

> **new PdfStream**\<`T`\>(`options`): `PdfStream`\<`T`\>

#### Parameters

##### options

`string` | [`ByteArray`](../../../../types/type-aliases/ByteArray.md) | \{ `header`: `T`; `isModified?`: `boolean`; `original`: `string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md); \}

#### Returns

`PdfStream`\<`T`\>

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`constructor`](../../pdf-object/classes/PdfObject.md#constructor)

## Properties

### header

> **header**: `T`

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`modified`](../../pdf-object/classes/PdfObject.md#modified)

---

### original

> **original**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### postStreamDataTokens?

> `optional` **postStreamDataTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`postTokens`](../../pdf-object/classes/PdfObject.md#posttokens)

---

### preStreamDataTokens?

> `optional` **preStreamDataTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

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

---

### originalAsString

#### Get Signature

> **get** **originalAsString**(): `string`

##### Returns

`string`

---

### raw

#### Get Signature

> **get** **raw**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Set Signature

> **set** **raw**(`data`): `void`

##### Parameters

###### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### Returns

`void`

---

### rawAsString

#### Get Signature

> **get** **rawAsString**(): `string`

##### Returns

`string`

## Methods

### addFilter()

> **addFilter**(`filterName`): `PdfStream`\<`T`\>

#### Parameters

##### filterName

`"FlateDecode"` | `"Fl"` | `"ASCIIHexDecode"` | `"ASCII85Decode"` | `"LZWDecode"` | `"RunLengthDecode"` | `"CCITTFaxDecode"` | `"DCTDecode"` | `"JPXDecode"` | `"Crypt"`

#### Returns

`PdfStream`\<`T`\>

---

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

### decode()

> **decode**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

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

### getFilters()

> **getFilters**(): (`"FlateDecode"` \| `"Fl"` \| `"ASCIIHexDecode"` \| `"ASCII85Decode"` \| `"LZWDecode"` \| `"RunLengthDecode"` \| `"CCITTFaxDecode"` \| `"DCTDecode"` \| `"JPXDecode"` \| `"Crypt"`)[]

#### Returns

(`"FlateDecode"` \| `"Fl"` \| `"ASCIIHexDecode"` \| `"ASCII85Decode"` \| `"LZWDecode"` \| `"RunLengthDecode"` \| `"CCITTFaxDecode"` \| `"DCTDecode"` \| `"JPXDecode"` \| `"Crypt"`)[]

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isModified`](../../pdf-object/classes/PdfObject.md#ismodified)

---

### isType()

> **isType**(`name`): `boolean`

#### Parameters

##### name

`string`

#### Returns

`boolean`

---

### parseAs()

> **parseAs**\<`T`\>(`Class`): `T`

#### Type Parameters

##### T

`T` _extends_ `PdfStream`\<[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>

#### Parameters

##### Class

(`options`) => `T`

#### Returns

`T`

---

### removeAllFilters()

> **removeAllFilters**(): `PdfStream`\<`T`\>

#### Returns

`PdfStream`\<`T`\>

---

### removeFilter()

> **removeFilter**(`filterName`): `PdfStream`\<`T`\>

#### Parameters

##### filterName

`"FlateDecode"` | `"Fl"` | `"ASCIIHexDecode"` | `"ASCII85Decode"` | `"LZWDecode"` | `"RunLengthDecode"` | `"CCITTFaxDecode"` | `"DCTDecode"` | `"JPXDecode"` | `"Crypt"`

#### Returns

`PdfStream`\<`T`\>

---

### removePredictor()

> **removePredictor**(): `PdfStream`\<`T`\>

#### Returns

`PdfStream`\<`T`\>

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

### setPredictor()

> **setPredictor**(`predictorParams`): `PdfStream`\<`T`\>

#### Parameters

##### predictorParams

###### BitsPerComponent?

`number`

###### Colors?

`number`

###### Columns?

`number`

###### Predictor?

`number`

#### Returns

`PdfStream`\<`T`\>

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

> `protected` **tokenize**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

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

---

### applyFilters()

> `static` **applyFilters**(`data`, `filters`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Parameters

##### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### filters

(`"FlateDecode"` \| `"Fl"` \| `"ASCIIHexDecode"` \| `"ASCII85Decode"` \| `"LZWDecode"` \| `"RunLengthDecode"` \| `"CCITTFaxDecode"` \| `"DCTDecode"` \| `"JPXDecode"` \| `"Crypt"`)[]

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### fromString()

> `static` **fromString**(`data`): `PdfStream`

#### Parameters

##### data

`string`

#### Returns

`PdfStream`

---

### getAllFilters()

> `static` **getAllFilters**(): `object`

#### Returns

`object`

##### ASCII85Decode

> `readonly` **ASCII85Decode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### ASCIIHexDecode

> `readonly` **ASCIIHexDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### CCITTFaxDecode

> `readonly` **CCITTFaxDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### Crypt

> `readonly` **Crypt**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### DCTDecode

> `readonly` **DCTDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### Fl

> `readonly` **Fl**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### FlateDecode

> `readonly` **FlateDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### JPXDecode

> `readonly` **JPXDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### LZWDecode

> `readonly` **LZWDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

##### RunLengthDecode

> `readonly` **RunLengthDecode**: [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

---

### getFilter()

> `static` **getFilter**(`name`): [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

#### Parameters

##### name

`"FlateDecode"` | `"Fl"` | `"ASCIIHexDecode"` | `"ASCII85Decode"` | `"LZWDecode"` | `"RunLengthDecode"` | `"CCITTFaxDecode"` | `"DCTDecode"` | `"JPXDecode"` | `"Crypt"`

#### Returns

[`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)
