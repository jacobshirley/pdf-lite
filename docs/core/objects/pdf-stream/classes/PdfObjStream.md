[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-stream](../README.md) / PdfObjStream

# Class: PdfObjStream

## Extends

- [`PdfStream`](PdfStream.md)

## Constructors

### Constructor

> **new PdfObjStream**(`options`): `PdfObjStream`

#### Parameters

##### options

###### header

[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)

###### isModified?

`boolean`

###### original

`string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`PdfObjStream`

#### Overrides

[`PdfStream`](PdfStream.md).[`constructor`](PdfStream.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfStream`](PdfStream.md).[`cachedTokens`](PdfStream.md#cachedtokens)

---

### header

> **header**: [`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)

#### Inherited from

[`PdfStream`](PdfStream.md).[`header`](PdfStream.md#header)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfStream`](PdfStream.md).[`immutable`](PdfStream.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfStream`](PdfStream.md).[`modified`](PdfStream.md#modified)

---

### original

> **original**: [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfStream`](PdfStream.md).[`original`](PdfStream.md#original)

---

### postStreamDataTokens?

> `optional` **postStreamDataTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfStream`](PdfStream.md).[`postStreamDataTokens`](PdfStream.md#poststreamdatatokens)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfStream`](PdfStream.md).[`postTokens`](PdfStream.md#posttokens)

---

### preStreamDataTokens?

> `optional` **preStreamDataTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfStream`](PdfStream.md).[`preStreamDataTokens`](PdfStream.md#prestreamdatatokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfStream`](PdfStream.md).[`preTokens`](PdfStream.md#pretokens)

---

### PdfStreamPredictor

> `static` **PdfStreamPredictor**: _typeof_ [`PdfStreamPredictor`](PdfStreamPredictor.md)

#### Inherited from

[`PdfStream`](PdfStream.md).[`PdfStreamPredictor`](PdfStream.md#pdfstreampredictor)

## Accessors

### data

#### Get Signature

> **get** **data**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Set Signature

> **set** **data**(`data`): `void`

##### Parameters

###### data

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

##### Returns

`void`

#### Inherited from

[`PdfStream`](PdfStream.md).[`data`](PdfStream.md#data)

---

### dataAsString

#### Get Signature

> **get** **dataAsString**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **dataAsString**(`str`): `void`

##### Parameters

###### str

`string`

##### Returns

`void`

#### Inherited from

[`PdfStream`](PdfStream.md).[`dataAsString`](PdfStream.md#dataasstring)

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

[`PdfStream`](PdfStream.md).[`isTrailingDelimited`](PdfStream.md#istrailingdelimited)

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfStream`](PdfStream.md).[`objectType`](PdfStream.md#objecttype)

---

### originalAsString

#### Get Signature

> **get** **originalAsString**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfStream`](PdfStream.md).[`originalAsString`](PdfStream.md#originalasstring)

---

### predictor

#### Get Signature

> **get** **predictor**(): [`PdfStreamPredictor`](PdfStreamPredictor.md) \| `undefined`

##### Returns

[`PdfStreamPredictor`](PdfStreamPredictor.md) \| `undefined`

#### Set Signature

> **set** **predictor**(`predictor`): `void`

##### Parameters

###### predictor

[`PdfStreamPredictor`](PdfStreamPredictor.md)

##### Returns

`void`

#### Inherited from

[`PdfStream`](PdfStream.md).[`predictor`](PdfStream.md#predictor)

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

#### Inherited from

[`PdfStream`](PdfStream.md).[`raw`](PdfStream.md#raw)

---

### rawAsString

#### Get Signature

> **get** **rawAsString**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **rawAsString**(`str`): `void`

##### Parameters

###### str

`string`

##### Returns

`void`

#### Inherited from

[`PdfStream`](PdfStream.md).[`rawAsString`](PdfStream.md#rawasstring)

## Methods

### addFilter()

> **addFilter**(`filterName`): `PdfObjStream`

#### Parameters

##### filterName

`"FlateDecode"` | `"Fl"` | `"ASCIIHexDecode"` | `"ASCII85Decode"` | `"LZWDecode"` | `"RunLengthDecode"` | `"CCITTFaxDecode"` | `"DCTDecode"` | `"JPXDecode"` | `"Crypt"`

#### Returns

`PdfObjStream`

#### Inherited from

[`PdfStream`](PdfStream.md).[`addFilter`](PdfStream.md#addfilter)

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

[`PdfStream`](PdfStream.md).[`as`](PdfStream.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfStream`](PdfStream.md).[`clone`](PdfStream.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Overrides

[`PdfStream`](PdfStream.md).[`cloneImpl`](PdfStream.md#cloneimpl)

---

### decode()

> **decode**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfStream`](PdfStream.md).[`decode`](PdfStream.md#decode)

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

[`PdfStream`](PdfStream.md).[`equals`](PdfStream.md#equals)

---

### getFilters()

> **getFilters**(): (`"FlateDecode"` \| `"Fl"` \| `"ASCIIHexDecode"` \| `"ASCII85Decode"` \| `"LZWDecode"` \| `"RunLengthDecode"` \| `"CCITTFaxDecode"` \| `"DCTDecode"` \| `"JPXDecode"` \| `"Crypt"`)[]

#### Returns

(`"FlateDecode"` \| `"Fl"` \| `"ASCIIHexDecode"` \| `"ASCII85Decode"` \| `"LZWDecode"` \| `"RunLengthDecode"` \| `"CCITTFaxDecode"` \| `"DCTDecode"` \| `"JPXDecode"` \| `"Crypt"`)[]

#### Inherited from

[`PdfStream`](PdfStream.md).[`getFilters`](PdfStream.md#getfilters)

---

### getObject()

> **getObject**(`options`): [`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\> \| `undefined`

#### Parameters

##### options

###### objectNumber

`number`

#### Returns

[`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\> \| `undefined`

---

### getObjects()

> **getObjects**(): [`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>[]

#### Returns

[`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>[]

---

### getObjectStream()

> **getObjectStream**(): `Generator`\<[`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>\>

#### Returns

`Generator`\<[`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>\>

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfStream`](PdfStream.md).[`isImmutable`](PdfStream.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfStream`](PdfStream.md).[`isModified`](PdfStream.md#ismodified)

---

### isType()

> **isType**(`name`): `boolean`

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`PdfStream`](PdfStream.md).[`isType`](PdfStream.md#istype)

---

### parseAs()

> **parseAs**\<`T`\>(`Class`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfStream`](PdfStream.md)\<[`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>\>

#### Parameters

##### Class

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfStream`](PdfStream.md).[`parseAs`](PdfStream.md#parseas)

---

### removeAllFilters()

> **removeAllFilters**(): `PdfObjStream`

#### Returns

`PdfObjStream`

#### Inherited from

[`PdfStream`](PdfStream.md).[`removeAllFilters`](PdfStream.md#removeallfilters)

---

### removeFilter()

> **removeFilter**(`filterName`): `PdfObjStream`

#### Parameters

##### filterName

`"FlateDecode"` | `"Fl"` | `"ASCIIHexDecode"` | `"ASCII85Decode"` | `"LZWDecode"` | `"RunLengthDecode"` | `"CCITTFaxDecode"` | `"DCTDecode"` | `"JPXDecode"` | `"Crypt"`

#### Returns

`PdfObjStream`

#### Inherited from

[`PdfStream`](PdfStream.md).[`removeFilter`](PdfStream.md#removefilter)

---

### removePredictor()

> **removePredictor**(): `PdfObjStream`

#### Returns

`PdfObjStream`

#### Inherited from

[`PdfStream`](PdfStream.md).[`removePredictor`](PdfStream.md#removepredictor)

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

[`PdfStream`](PdfStream.md).[`setImmutable`](PdfStream.md#setimmutable)

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

[`PdfStream`](PdfStream.md).[`setModified`](PdfStream.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfStream`](PdfStream.md).[`toBase64`](PdfStream.md#tobase64)

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

[`PdfStream`](PdfStream.md).[`toBytes`](PdfStream.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfStream`](PdfStream.md).[`tokenize`](PdfStream.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfStream`](PdfStream.md).[`toString`](PdfStream.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfStream`](PdfStream.md).[`toTokens`](PdfStream.md#totokens)

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

#### Inherited from

[`PdfStream`](PdfStream.md).[`applyFilters`](PdfStream.md#applyfilters)

---

### fromObjects()

> `static` **fromObjects**(`objects`): `PdfObjStream`

#### Parameters

##### objects

`Iterable`\<[`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../pdf-object/classes/PdfObject.md)\>\>

#### Returns

`PdfObjStream`

---

### fromString()

> `static` **fromString**(`data`): [`PdfStream`](PdfStream.md)

#### Parameters

##### data

`string`

#### Returns

[`PdfStream`](PdfStream.md)

#### Inherited from

[`PdfStream`](PdfStream.md).[`fromString`](PdfStream.md#fromstring)

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

#### Inherited from

[`PdfStream`](PdfStream.md).[`getAllFilters`](PdfStream.md#getallfilters)

---

### getFilter()

> `static` **getFilter**(`name`): [`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

#### Parameters

##### name

`"FlateDecode"` | `"Fl"` | `"ASCIIHexDecode"` | `"ASCII85Decode"` | `"LZWDecode"` | `"RunLengthDecode"` | `"CCITTFaxDecode"` | `"DCTDecode"` | `"JPXDecode"` | `"Crypt"`

#### Returns

[`PdfFilter`](../../../../filters/types/interfaces/PdfFilter.md)

#### Inherited from

[`PdfStream`](PdfStream.md).[`getFilter`](PdfStream.md#getfilter)
