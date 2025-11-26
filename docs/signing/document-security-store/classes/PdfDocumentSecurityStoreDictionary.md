[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/document-security-store](../README.md) / PdfDocumentSecurityStoreDictionary

# Class: PdfDocumentSecurityStoreDictionary

Dictionary for the Document Security Store (DSS).
Contains arrays of certificates, CRLs, OCSPs, and VRI entries.

## Extends

- [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `Certs?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `CRLs?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `OCSPs?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `Type?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"DSS"`\>; `VRI?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); \}\>

## Constructors

### Constructor

> **new PdfDocumentSecurityStoreDictionary**(`entries?`): `PdfDocumentSecurityStoreDictionary`

#### Parameters

##### entries?

[`PdfDictionaryMap`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryMap.md) | \{ `Certs?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `CRLs?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `OCSPs?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `Type?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"DSS"`\>; `VRI?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); \}

#### Returns

`PdfDocumentSecurityStoreDictionary`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`constructor`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#constructor)

## Properties

### innerTokens

> **innerTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[] = `[]`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`innerTokens`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#innertokens)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`modified`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#modified)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`postTokens`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`preTokens`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#pretokens)

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`objectType`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#objecttype)

---

### values

#### Get Signature

> **get** **values**(): `{ readonly [K in string]: T[K] }`

##### Returns

`{ readonly [K in string]: T[K] }`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`values`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#values)

## Methods

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`as`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`clone`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#clone)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<`any`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`copyFrom`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#copyfrom)

---

### delete()

> **delete**\<`K`\>(`key`): `void`

#### Type Parameters

##### K

`K` _extends_ `"Type"` \| `"VRI"` \| `"OCSPs"` \| `"CRLs"` \| `"Certs"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`delete`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#delete)

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`equals`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#equals)

---

### get()

> **get**\<`K`\>(`key`): `object`\[`K`\] \| `undefined`

#### Type Parameters

##### K

`K` _extends_ `"Type"` \| `"VRI"` \| `"OCSPs"` \| `"CRLs"` \| `"Certs"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`object`\[`K`\] \| `undefined`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`get`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#get)

---

### has()

> **has**\<`K`\>(`key`): `boolean`

#### Type Parameters

##### K

`K` _extends_ `"Type"` \| `"VRI"` \| `"OCSPs"` \| `"CRLs"` \| `"Certs"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`has`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#has)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`isModified`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#ismodified)

---

### set()

> **set**\<`K`\>(`key`, `value`): `void`

#### Type Parameters

##### K

`K` _extends_ `"Type"` \| `"VRI"` \| `"OCSPs"` \| `"CRLs"` \| `"Certs"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

##### value

`object`\[`K`\]

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`set`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#set)

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

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`setModified`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#setmodified)

---

### toBytes()

> **toBytes**(`padTo?`): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Parameters

##### padTo?

`number`

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`toBytes`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`tokenize`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`toString`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`toTokens`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#totokens)
