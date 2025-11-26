[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-indirect-object](../README.md) / PdfIndirectObject

# Class: PdfIndirectObject\<T\>

## Extends

- [`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)

## Extended by

- [`PdfCertObject`](../../../../signing/document-security-store/classes/PdfCertObject.md)
- [`PdfCrlObject`](../../../../signing/document-security-store/classes/PdfCrlObject.md)
- [`PdfOcspObject`](../../../../signing/document-security-store/classes/PdfOcspObject.md)
- [`PdfDocumentSecurityStoreObject`](../../../../signing/document-security-store/classes/PdfDocumentSecurityStoreObject.md)
- [`PdfSignatureObject`](../../../../signing/signatures/base/classes/PdfSignatureObject.md)

## Type Parameters

### T

`T` _extends_ [`PdfObject`](../../pdf-object/classes/PdfObject.md) = [`PdfObject`](../../pdf-object/classes/PdfObject.md)

## Constructors

### Constructor

> **new PdfIndirectObject**\<`T`\>(`options`): `PdfIndirectObject`\<`T`\>

#### Parameters

##### options

`T` | \{ `content`: `T`; `encryptable?`: `boolean`; `generationNumber?`: `number`; `objectNumber?`: `number`; `offset?`: `number` \| [`Ref`](../../../ref/classes/Ref.md)\<`number`\>; \}

#### Returns

`PdfIndirectObject`\<`T`\>

#### Overrides

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`constructor`](../../pdf-object-reference/classes/PdfObjectReference.md#constructor)

## Properties

### content

> **content**: `T`

---

### encryptable?

> `optional` **encryptable**: `boolean`

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`generationNumber`](../../pdf-object-reference/classes/PdfObjectReference.md#generationnumber)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`modified`](../../pdf-object-reference/classes/PdfObjectReference.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`objectNumber`](../../pdf-object-reference/classes/PdfObjectReference.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../ref/classes/Ref.md)\<`number`\>

---

### orderIndex?

> `optional` **orderIndex**: `number`

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`postTokens`](../../pdf-object-reference/classes/PdfObjectReference.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`preTokens`](../../pdf-object-reference/classes/PdfObjectReference.md#pretokens)

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

## Accessors

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`objectType`](../../pdf-object-reference/classes/PdfObjectReference.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)

##### Returns

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)

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

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`as`](../../pdf-object-reference/classes/PdfObjectReference.md#as)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Overrides

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`clone`](../../pdf-object-reference/classes/PdfObjectReference.md#clone)

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

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`equals`](../../pdf-object-reference/classes/PdfObjectReference.md#equals)

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Overrides

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`isModified`](../../pdf-object-reference/classes/PdfObjectReference.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)

#### Returns

`boolean`

---

### order()

> **order**(): `number`

#### Returns

`number`

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

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`setModified`](../../pdf-object-reference/classes/PdfObjectReference.md#setmodified)

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

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`toBytes`](../../pdf-object-reference/classes/PdfObjectReference.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Overrides

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`tokenize`](../../pdf-object-reference/classes/PdfObjectReference.md#tokenize)

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`toString`](../../pdf-object-reference/classes/PdfObjectReference.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md).[`toTokens`](../../pdf-object-reference/classes/PdfObjectReference.md#totokens)

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): `PdfIndirectObject`\<`T` _extends_ `unknown` ? [`PdfNull`](../../pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

`PdfIndirectObject`\<`T` _extends_ `unknown` ? [`PdfNull`](../../pdf-null/classes/PdfNull.md) : `T`\>
