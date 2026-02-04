[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/acroform](../README.md) / PdfAcroForm

# Class: PdfAcroForm\<T\>

## Extends

- [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `CO?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `DA?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md); `DR?`: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md); `Fields`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `NeedAppearances?`: [`PdfBoolean`](../../../core/objects/pdf-boolean/classes/PdfBoolean.md); `Q?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `SigFlags?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); \}\>

## Type Parameters

### T

`T` _extends_ `Record`\<`string`, `string`\> = `Record`\<`string`, `string`\>

## Constructors

### Constructor

> **new PdfAcroForm**\<`T`\>(`options`): `PdfAcroForm`\<`T`\>

#### Parameters

##### options

###### container?

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

###### dict

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

###### document?

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

###### fields?

[`PdfAcroFormField`](PdfAcroFormField.md)[]

#### Returns

`PdfAcroForm`\<`T`\>

#### Overrides

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`constructor`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#constructor)

## Properties

### container?

> `readonly` `optional` **container**: [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

---

### fields

> **fields**: [`PdfAcroFormField`](PdfAcroFormField.md)[]

---

### fontEncodingMaps

> `readonly` **fontEncodingMaps**: `Map`\<`string`, `Map`\<`number`, `string`\> \| `null`\>

---

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

### defaultAppearance

#### Get Signature

> **get** **defaultAppearance**(): `string` \| `null`

Gets the default appearance string for the form

##### Returns

`string` \| `null`

#### Set Signature

> **set** **defaultAppearance**(`da`): `void`

Sets the default appearance string for the form

##### Parameters

###### da

`string`

##### Returns

`void`

---

### defaultQuadding

#### Get Signature

> **get** **defaultQuadding**(): `number`

Gets the default quadding (alignment) for the form
0 = left, 1 = center, 2 = right

##### Returns

`number`

#### Set Signature

> **set** **defaultQuadding**(`q`): `void`

Sets the default quadding (alignment) for the form

##### Parameters

###### q

`number`

##### Returns

`void`

---

### needAppearances

#### Get Signature

> **get** **needAppearances**(): `boolean`

Gets the NeedAppearances flag

##### Returns

`boolean`

#### Set Signature

> **set** **needAppearances**(`value`): `void`

Sets the NeedAppearances flag to indicate that appearance streams need to be regenerated

##### Parameters

###### value

`boolean`

##### Returns

`void`

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`objectType`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#objecttype)

---

### signatureFlags

#### Get Signature

> **get** **signatureFlags**(): `number`

Gets the signature flags

##### Returns

`number`

#### Set Signature

> **set** **signatureFlags**(`flags`): `void`

Sets the signature flags

##### Parameters

###### flags

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

`K` _extends_ `"Q"` \| `"DA"` \| `"Fields"` \| `"NeedAppearances"` \| `"SigFlags"` \| `"CO"` \| `"DR"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`delete`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#delete)

---

### entries()

> **entries**(): `IterableIterator`\<\[`string`, [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md) \| `undefined`\]\>

Returns an iterator for the dictionary entries.
Each entry is a tuple of [key string, value].

#### Returns

`IterableIterator`\<\[`string`, [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md) \| `undefined`\]\>

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`entries`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#entries)

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

### exportData()

> **exportData**(): `Partial`\<`T`\>

#### Returns

`Partial`\<`T`\>

---

### get()

> **get**\<`K`\>(`key`): `object`\[`K`\] \| `undefined`

#### Type Parameters

##### K

`K` _extends_ `"Q"` \| `"DA"` \| `"Fields"` \| `"NeedAppearances"` \| `"SigFlags"` \| `"CO"` \| `"DR"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`object`\[`K`\] \| `undefined`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`get`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#get)

---

### getFontEncodingMap()

> **getFontEncodingMap**(`fontName`): `Promise`\<`Map`\<`number`, `string`\> \| `null`\>

Gets the encoding map for a specific font in the form's resources.
Returns null if no custom encoding is found.
Results are cached for performance.

#### Parameters

##### fontName

`string`

#### Returns

`Promise`\<`Map`\<`number`, `string`\> \| `null`\>

---

### has()

> **has**\<`K`\>(`key`): `boolean`

#### Type Parameters

##### K

`K` _extends_ `"Q"` \| `"DA"` \| `"Fields"` \| `"NeedAppearances"` \| `"SigFlags"` \| `"CO"` \| `"DR"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`has`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#has)

---

### importData()

> **importData**(`fields`): `void`

#### Parameters

##### fields

`T`

#### Returns

`void`

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

`K` _extends_ `"Q"` \| `"DA"` \| `"Fields"` \| `"NeedAppearances"` \| `"SigFlags"` \| `"CO"` \| `"DR"`

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

### setValues()

> **setValues**(`values`): `void`

Sets multiple field values by field name.

#### Parameters

##### values

`Partial`\<`T`\>

Object with field names as keys and values to set

#### Returns

`void`

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

---

### write()

> **write**(`document`): `Promise`\<`void`\>

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`Promise`\<`void`\>

---

### fromDocument()

> `static` **fromDocument**(`document`): `Promise`\<`PdfAcroForm`\<`Record`\<`string`, `string`\>\> \| `null`\>

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`Promise`\<`PdfAcroForm`\<`Record`\<`string`, `string`\>\> \| `null`\>
