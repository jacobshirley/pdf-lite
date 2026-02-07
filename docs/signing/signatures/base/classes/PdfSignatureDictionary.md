[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [signing/signatures/base](../README.md) / PdfSignatureDictionary

# Class: PdfSignatureDictionary

PDF signature dictionary containing all signature-related entries.
Manages the ByteRange and Contents fields with appropriate placeholder sizing.

## Extends

- [`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)\>

## Constructors

### Constructor

> **new PdfSignatureDictionary**(`entries`): `PdfSignatureDictionary`

Creates a new signature dictionary.

#### Parameters

##### entries

`Omit`\<[`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md), `"Contents"` \| `"ByteRange"`\> & `object`

The signature dictionary entries, ByteRange and Contents are auto-populated if not provided.

#### Returns

`PdfSignatureDictionary`

#### Overrides

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`constructor`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#constructor)

## Properties

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`immutable`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#immutable)

---

### innerTokens

> **innerTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[] = `[]`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`innerTokens`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#innertokens)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`modified`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`postTokens`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`preTokens`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#pretokens)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`objectType`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#objecttype)

---

### values

#### Get Signature

> **get** **values**(): `{ readonly [K in string]: T[K] }`

##### Returns

`{ readonly [K in string]: T[K] }`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`values`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#values)

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

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`as`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`clone`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#clone)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<`any`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`copyFrom`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#copyfrom)

---

### delete()

> **delete**\<`K`\>(`key`): `void`

#### Type Parameters

##### K

`K` _extends_ keyof [`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)

#### Parameters

##### key

`K` | [`PdfName`](../../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`delete`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#delete)

---

### entries()

> **entries**(): `IterableIterator`\<\[`string`, [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md) \| `undefined`\]\>

Returns an iterator for the dictionary entries.
Each entry is a tuple of [key string, value].

#### Returns

`IterableIterator`\<\[`string`, [`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md) \| `undefined`\]\>

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`entries`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#entries)

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

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`equals`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#equals)

---

### get()

> **get**\<`K`\>(`key`): [`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)\[`K`\] \| `undefined`

#### Type Parameters

##### K

`K` _extends_ keyof [`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)

#### Parameters

##### key

`K` | [`PdfName`](../../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

[`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)\[`K`\] \| `undefined`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`get`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#get)

---

### has()

> **has**\<`K`\>(`key`): `boolean`

#### Type Parameters

##### K

`K` _extends_ keyof [`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)

#### Parameters

##### key

`K` | [`PdfName`](../../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`has`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#has)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`isImmutable`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`isModified`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#ismodified)

---

### set()

> **set**\<`K`\>(`key`, `value`): `void`

#### Type Parameters

##### K

`K` _extends_ keyof [`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)

#### Parameters

##### key

`K` | [`PdfName`](../../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

##### value

[`PdfSignatureDictionaryEntries`](../../../types/type-aliases/PdfSignatureDictionaryEntries.md)\[`K`\]

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`set`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#set)

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

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`setImmutable`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#setimmutable)

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

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`setModified`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#setmodified)

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

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`toBytes`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`tokenize`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`toString`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfDictionary`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`toTokens`](../../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#totokens)
