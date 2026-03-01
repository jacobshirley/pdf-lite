[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-dictionary](../README.md) / PdfDictionary

# Class: PdfDictionary\<T\>

## Extends

- [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Extended by

- [`PdfDefaultResourcesDictionary`](../../../../annotations/pdf-default-resources/classes/PdfDefaultResourcesDictionary.md)
- [`PdfDocumentSecurityStoreDictionary`](../../../../signing/document-security-store/classes/PdfDocumentSecurityStoreDictionary.md)
- [`PdfStreamPredictor`](../../pdf-stream/classes/PdfStreamPredictor.md)
- [`PdfSignatureDictionary`](../../../../signing/signatures/base/classes/PdfSignatureDictionary.md)

## Type Parameters

### T

`T` _extends_ [`PdfDictionaryEntries`](../type-aliases/PdfDictionaryEntries.md) = [`PdfDictionaryEntries`](../type-aliases/PdfDictionaryEntries.md)

## Constructors

### Constructor

> **new PdfDictionary**\<`T`\>(`entries?`): `PdfDictionary`\<`T`\>

#### Parameters

##### entries?

[`PdfDictionaryMap`](../type-aliases/PdfDictionaryMap.md) | `T`

#### Returns

`PdfDictionary`\<`T`\>

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`constructor`](../../pdf-object/classes/PdfObject.md#constructor)

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`cachedTokens`](../../pdf-object/classes/PdfObject.md#cachedtokens)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`immutable`](../../pdf-object/classes/PdfObject.md#immutable)

---

### innerTokens

> **innerTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[] = `[]`

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

### isTrailingDelimited

#### Get Signature

> **get** **isTrailingDelimited**(): `boolean`

Returns true if this object's serialized form ends with a self-delimiting
character (e.g., `)`, `>`, `]`, `>>`). Such objects do not require trailing
whitespace before the next token.

##### Returns

`boolean`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isTrailingDelimited`](../../pdf-object/classes/PdfObject.md#istrailingdelimited)

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

### values

#### Get Signature

> **get** **values**(): `{ readonly [K in string]: T[K] }`

##### Returns

`{ readonly [K in string]: T[K] }`

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

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`clone`](../../pdf-object/classes/PdfObject.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`cloneImpl`](../../pdf-object/classes/PdfObject.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

`PdfDictionary`\<`any`\>

#### Returns

`void`

---

### delete()

> **delete**\<`K`\>(`key`): `void`

#### Type Parameters

##### K

`K` _extends_ `string`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`void`

---

### entries()

> **entries**(): `IterableIterator`\<\[`string`, [`PdfObject`](../../pdf-object/classes/PdfObject.md) \| `undefined`\]\>

Returns an iterator for the dictionary entries.
Each entry is a tuple of [key string, value].

#### Returns

`IterableIterator`\<\[`string`, [`PdfObject`](../../pdf-object/classes/PdfObject.md) \| `undefined`\]\>

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

### get()

> **get**\<`K`\>(`key`): `T`\[`K`\] \| `undefined`

#### Type Parameters

##### K

`K` _extends_ `string`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`T`\[`K`\] \| `undefined`

---

### has()

> **has**\<`K`\>(`key`): `boolean`

#### Type Parameters

##### K

`K` _extends_ `string`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`boolean`

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

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`isModified`](../../pdf-object/classes/PdfObject.md#ismodified)

---

### set()

> **set**\<`K`\>(`key`, `value`): `void`

#### Type Parameters

##### K

`K` _extends_ `string`

#### Parameters

##### key

`K` | [`PdfName`](../../pdf-name/classes/PdfName.md)\<`K`\>

##### value

`T`\[`K`\]

#### Returns

`void`

---

### setImmutable()

> **setImmutable**(`immutable?`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable?

`boolean`

#### Returns

`void`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`setImmutable`](../../pdf-object/classes/PdfObject.md#setimmutable)

---

### setModified()

> **setModified**(`modified?`): `void`

Sets the modified state of the object. Override this method if the modified state is determined differently

#### Parameters

##### modified?

`boolean`

#### Returns

`void`

#### Overrides

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`setModified`](../../pdf-object/classes/PdfObject.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfObject`](../../pdf-object/classes/PdfObject.md).[`toBase64`](../../pdf-object/classes/PdfObject.md#tobase64)

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
