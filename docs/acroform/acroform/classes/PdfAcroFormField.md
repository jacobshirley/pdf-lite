[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/acroform](../README.md) / PdfAcroFormField

# Class: PdfAcroFormField

## Extends

- [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `AS?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); `BS?`: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md); `DA?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md); `DV?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md) \| [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); `F?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `Ff?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `FT`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"Tx"` \| `"Btn"` \| `"Ch"` \| `"Sig"`\>; `Kids?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `MK?`: [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md); `P?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); `Rect?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md)\>; `T?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md); `V?`: [`PdfString`](../../../core/objects/pdf-string/classes/PdfString.md) \| [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); \}\>

## Constructors

### Constructor

> **new PdfAcroFormField**(`options?`): `PdfAcroFormField`

#### Parameters

##### options?

###### container?

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Returns

`PdfAcroFormField`

#### Overrides

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`constructor`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#constructor)

## Properties

### container?

> `readonly` `optional` **container**: [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

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

### parent?

> `optional` **parent**: `PdfAcroFormField`

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

### checked

#### Get Signature

> **get** **checked**(): `boolean`

##### Returns

`boolean`

#### Set Signature

> **set** **checked**(`isChecked`): `void`

##### Parameters

###### isChecked

`boolean`

##### Returns

`void`

---

### defaultValue

#### Get Signature

> **get** **defaultValue**(): `string`

Gets the default value

##### Returns

`string`

#### Set Signature

> **set** **defaultValue**(`val`): `void`

Sets the default value

##### Parameters

###### val

`string`

##### Returns

`void`

---

### fieldType

#### Get Signature

> **get** **fieldType**(): `string` \| `null`

Gets the field type

##### Returns

`string` \| `null`

---

### flags

#### Get Signature

> **get** **flags**(): `number`

Gets field flags (bitwise combination of field attributes)

##### Returns

`number`

#### Set Signature

> **set** **flags**(`flags`): `void`

Sets field flags

##### Parameters

###### flags

`number`

##### Returns

`void`

---

### fontName

#### Get Signature

> **get** **fontName**(): `string` \| `null`

##### Returns

`string` \| `null`

#### Set Signature

> **set** **fontName**(`fontName`): `void`

##### Parameters

###### fontName

`string`

##### Returns

`void`

---

### fontSize

#### Get Signature

> **get** **fontSize**(): `number` \| `null`

##### Returns

`number` \| `null`

#### Set Signature

> **set** **fontSize**(`size`): `void`

##### Parameters

###### size

`number`

##### Returns

`void`

---

### multiline

#### Get Signature

> **get** **multiline**(): `boolean`

Checks if the field is multiline (for text fields)

##### Returns

`boolean`

#### Set Signature

> **set** **multiline**(`isMultiline`): `void`

Sets the field as multiline (for text fields)

##### Parameters

###### isMultiline

`boolean`

##### Returns

`void`

---

### name

#### Get Signature

> **get** **name**(): `string`

Gets the field name

##### Returns

`string`

#### Set Signature

> **set** **name**(`name`): `void`

Sets the field name

##### Parameters

###### name

`string`

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

### password

#### Get Signature

> **get** **password**(): `boolean`

Checks if the field is a password field (for text fields)

##### Returns

`boolean`

#### Set Signature

> **set** **password**(`isPassword`): `void`

Sets the field as a password field (for text fields)

##### Parameters

###### isPassword

`boolean`

##### Returns

`void`

---

### readOnly

#### Get Signature

> **get** **readOnly**(): `boolean`

Checks if the field is read-only

##### Returns

`boolean`

#### Set Signature

> **set** **readOnly**(`isReadOnly`): `void`

Sets the field as read-only or editable

##### Parameters

###### isReadOnly

`boolean`

##### Returns

`void`

---

### required

#### Get Signature

> **get** **required**(): `boolean`

Checks if the field is required

##### Returns

`boolean`

#### Set Signature

> **set** **required**(`isRequired`): `void`

Sets the field as required or optional

##### Parameters

###### isRequired

`boolean`

##### Returns

`void`

---

### value

#### Get Signature

> **get** **value**(): `string`

##### Returns

`string`

#### Set Signature

> **set** **value**(`val`): `void`

##### Parameters

###### val

`string`

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

`K` _extends_ `"V"` \| `"P"` \| `"T"` \| `"F"` \| `"FT"` \| `"DV"` \| `"DA"` \| `"AS"` \| `"Kids"` \| `"Rect"` \| `"Ff"` \| `"BS"` \| `"MK"`

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

`K` _extends_ `"V"` \| `"P"` \| `"T"` \| `"F"` \| `"FT"` \| `"DV"` \| `"DA"` \| `"AS"` \| `"Kids"` \| `"Rect"` \| `"Ff"` \| `"BS"` \| `"MK"`

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

`K` _extends_ `"V"` \| `"P"` \| `"T"` \| `"F"` \| `"FT"` \| `"DV"` \| `"DA"` \| `"AS"` \| `"Kids"` \| `"Rect"` \| `"Ff"` \| `"BS"` \| `"MK"`

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

`K` _extends_ `"V"` \| `"P"` \| `"T"` \| `"F"` \| `"FT"` \| `"DV"` \| `"DA"` \| `"AS"` \| `"Kids"` \| `"Rect"` \| `"Ff"` \| `"BS"` \| `"MK"`

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
