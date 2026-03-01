[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [core/objects/pdf-object](../README.md) / PdfObject

# Abstract Class: PdfObject

## Extended by

- [`PdfDocument`](../../../../pdf/pdf-document/classes/PdfDocument.md)
- [`PdfRevision`](../../../../pdf/pdf-revision/classes/PdfRevision.md)
- [`PdfArray`](../../pdf-array/classes/PdfArray.md)
- [`PdfBoolean`](../../pdf-boolean/classes/PdfBoolean.md)
- [`PdfComment`](../../pdf-comment/classes/PdfComment.md)
- [`PdfDictionary`](../../pdf-dictionary/classes/PdfDictionary.md)
- [`PdfHexadecimal`](../../pdf-hexadecimal/classes/PdfHexadecimal.md)
- [`PdfIndirectObject`](../../pdf-indirect-object/classes/PdfIndirectObject.md)
- [`PdfName`](../../pdf-name/classes/PdfName.md)
- [`PdfNull`](../../pdf-null/classes/PdfNull.md)
- [`PdfNumber`](../../pdf-number/classes/PdfNumber.md)
- [`PdfObjectReference`](../../pdf-object-reference/classes/PdfObjectReference.md)
- [`PdfStartXRef`](../../pdf-start-xref/classes/PdfStartXRef.md)
- [`PdfStream`](../../pdf-stream/classes/PdfStream.md)
- [`PdfString`](../../pdf-string/classes/PdfString.md)
- [`PdfTrailer`](../../pdf-trailer/classes/PdfTrailer.md)
- [`PdfXRefTableEntry`](../../pdf-xref-table/classes/PdfXRefTableEntry.md)
- [`PdfXRefTableSectionHeader`](../../pdf-xref-table/classes/PdfXRefTableSectionHeader.md)
- [`PdfXRefTable`](../../pdf-xref-table/classes/PdfXRefTable.md)

## Constructors

### Constructor

> **new PdfObject**(): `PdfObject`

#### Returns

`PdfObject`

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

## Accessors

### isTrailingDelimited

#### Get Signature

> **get** **isTrailingDelimited**(): `boolean`

Returns true if this object's serialized form ends with a self-delimiting
character (e.g., `)`, `>`, `]`, `>>`). Such objects do not require trailing
whitespace before the next token.

##### Returns

`boolean`

---

### objectType

#### Get Signature

> **get** **objectType**(): `string`

The type of this PDF object

##### Returns

`string`

## Methods

### as()

> **as**\<`T`\>(`ctor`): `T`

Attempts to cast the object to a specific PdfObject subclass

#### Type Parameters

##### T

`T` _extends_ `PdfObject`

#### Parameters

##### ctor

(...`args`) => `T`

#### Returns

`T`

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

---

### cloneImpl()

> `abstract` `protected` **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

---

### equals()

> **equals**(`other?`): `boolean`

Compares this object to another for equality based on their token representations

#### Parameters

##### other?

`PdfObject`

#### Returns

`boolean`

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

---

### setImmutable()

> **setImmutable**(`immutable`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable

`boolean` = `true`

#### Returns

`void`

---

### setModified()

> **setModified**(`modified`): `void`

Sets the modified state of the object. Override this method if the modified state is determined differently

#### Parameters

##### modified

`boolean` = `true`

#### Returns

`void`

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

---

### toBytes()

> **toBytes**(`padTo?`): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Converts the object to a ByteArray, optionally padding to a specified length

#### Parameters

##### padTo?

`number`

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### tokenize()

> `abstract` `protected` **tokenize**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

---

### toString()

> **toString**(): `string`

Converts the object to a string representation

#### Returns

`string`

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../tokens/token/classes/PdfToken.md)[]
