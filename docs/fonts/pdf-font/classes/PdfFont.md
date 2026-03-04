[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [fonts/pdf-font](../README.md) / PdfFont

# Class: PdfFont

Represents an embedded font in a PDF document.
Extends PdfIndirectObject with a PdfDictionary content for the font dict.

## Extends

- [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`PdfFontDictionary`\>

## Constructors

### Constructor

> **new PdfFont**(`font`): `PdfFont`

#### Parameters

##### font

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`PdfFont`

#### Overrides

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`constructor`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#constructor)

### Constructor

> **new PdfFont**(`fontName`): `PdfFont`

#### Parameters

##### fontName

`string`

#### Returns

`PdfFont`

#### Overrides

`PdfIndirectObject<PdfFontDictionary>.constructor`

### Constructor

> **new PdfFont**(`options`): `PdfFont`

#### Parameters

##### options

###### descriptor?

[`FontDescriptor`](../../types/interfaces/FontDescriptor.md) \| [`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md)

###### encoding?

`string`

###### fontData?

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

###### fontName?

`string`

###### resourceName?

`string`

#### Returns

`PdfFont`

#### Overrides

`PdfIndirectObject<PdfFontDictionary>.constructor`

## Properties

### cachedTokens?

> `protected` `optional` **cachedTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Cached byte representation of the object, if available

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`cachedTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#cachedtokens)

---

### compressed?

> `optional` **compressed**: `boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`compressed`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#compressed)

---

### content

> **content**: `PdfFontDictionary`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`content`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#content)

---

### encryptable?

> `optional` **encryptable**: `boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`encryptable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#encryptable)

---

### generationNumber

> **generationNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`generationNumber`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#generationnumber)

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`immutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#immutable)

---

### modified

> `protected` **modified**: `boolean` = `true`

Indicates whether the object has been modified. By default, assume it has been modified because it's a new object

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`modified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#modified)

---

### objectNumber

> **objectNumber**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectNumber`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objectnumber)

---

### offset

> **offset**: [`Ref`](../../../core/ref/classes/Ref.md)\<`number`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`offset`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#offset)

---

### orderIndex?

> `optional` **orderIndex**: `number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`orderIndex`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#orderindex)

---

### postTokens?

> `optional` **postTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`postTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#posttokens)

---

### preTokens?

> `optional` **preTokens**: [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Optional tokens to prepend or append during serialization

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`preTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#pretokens)

---

### resourceName

> **resourceName**: `string`

The PDF resource name used in content streams (e.g., 'F1', 'F2').
This is the identifier used in PDF operators like `/F1 12 Tf`.

---

### COURIER

> `readonly` `static` **COURIER**: `PdfFont`

---

### COURIER_BOLD

> `readonly` `static` **COURIER_BOLD**: `PdfFont`

---

### COURIER_BOLD_OBLIQUE

> `readonly` `static` **COURIER_BOLD_OBLIQUE**: `PdfFont`

---

### COURIER_OBLIQUE

> `readonly` `static` **COURIER_OBLIQUE**: `PdfFont`

---

### HELVETICA

> `readonly` `static` **HELVETICA**: `PdfFont`

---

### HELVETICA_BOLD

> `readonly` `static` **HELVETICA_BOLD**: `PdfFont`

---

### HELVETICA_BOLD_OBLIQUE

> `readonly` `static` **HELVETICA_BOLD_OBLIQUE**: `PdfFont`

---

### HELVETICA_OBLIQUE

> `readonly` `static` **HELVETICA_OBLIQUE**: `PdfFont`

---

### MAX_ORDER_INDEX

> `readonly` `static` **MAX_ORDER_INDEX**: `2147483647` = `2147483647`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`MAX_ORDER_INDEX`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#max_order_index)

---

### SYMBOL

> `readonly` `static` **SYMBOL**: `PdfFont`

---

### TIMES_BOLD

> `readonly` `static` **TIMES_BOLD**: `PdfFont`

---

### TIMES_BOLD_ITALIC

> `readonly` `static` **TIMES_BOLD_ITALIC**: `PdfFont`

---

### TIMES_ITALIC

> `readonly` `static` **TIMES_ITALIC**: `PdfFont`

---

### TIMES_ROMAN

> `readonly` `static` **TIMES_ROMAN**: `PdfFont`

---

### ZAPF_DINGBATS

> `readonly` `static` **ZAPF_DINGBATS**: `PdfFont`

## Accessors

### descriptor

#### Get Signature

> **get** **descriptor**(): [`FontDescriptor`](../../types/interfaces/FontDescriptor.md) \| [`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md) \| `undefined`

Gets the font descriptor with metrics and properties.
Available for embedded fonts, undefined for standard fonts or loaded fonts without descriptor.

##### Returns

[`FontDescriptor`](../../types/interfaces/FontDescriptor.md) \| [`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md) \| `undefined`

---

### dict

#### Get Signature

> **get** **dict**(): `PdfFontDictionary`

##### Returns

`PdfFontDictionary`

---

### encoding

#### Get Signature

> **get** **encoding**(): `string` \| `undefined`

##### Returns

`string` \| `undefined`

#### Set Signature

> **set** **encoding**(`enc`): `void`

##### Parameters

###### enc

`string` | `undefined`

##### Returns

`void`

---

### encodingMap

#### Get Signature

> **get** **encodingMap**(): `Map`\<`number`, `string`\> \| `null`

Gets the encoding map from the font's Encoding dictionary's Differences array.
Maps byte codes to Unicode characters for custom-encoded fonts.

##### Returns

`Map`\<`number`, `string`\> \| `null`

---

### firstChar

#### Get Signature

> **get** **firstChar**(): `number` \| `undefined`

Gets the first character code in the Widths array.

##### Returns

`number` \| `undefined`

#### Set Signature

> **set** **firstChar**(`value`): `void`

Sets the first character code in the Widths array.

##### Parameters

###### value

`number` | `undefined`

##### Returns

`void`

---

### fontData

#### Get Signature

> **get** **fontData**(): [`ByteArray`](../../../types/type-aliases/ByteArray.md) \| `undefined`

Gets the original font file bytes.
Available for embedded fonts, undefined for standard fonts or loaded fonts.

##### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md) \| `undefined`

---

### fontName

#### Get Signature

> **get** **fontName**(): `string` \| `undefined`

##### Returns

`string` \| `undefined`

#### Set Signature

> **set** **fontName**(`name`): `void`

##### Parameters

###### name

`string` | `undefined`

##### Returns

`void`

---

### fontRef

#### Get Signature

> **get** **fontRef**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

**`Internal`**

Legacy property for backward compatibility with code that accesses fontRef.
Returns this font's reference since PdfFont IS the indirect object.

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)

---

### fontType

#### Get Signature

> **get** **fontType**(): `"Type1"` \| `"TrueType"` \| `"Type0"` \| `"MMType1"` \| `"Type3"` \| `undefined`

Gets the font type (Subtype in PDF).

##### Returns

`"Type1"` \| `"TrueType"` \| `"Type0"` \| `"MMType1"` \| `"Type3"` \| `undefined`

#### Set Signature

> **set** **fontType**(`type`): `void`

Sets the font type (Subtype in PDF).

##### Parameters

###### type

`"Type1"` | `"TrueType"` | `"Type0"` | `"MMType1"` | `"Type3"` | `undefined`

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isTrailingDelimited`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#istrailingdelimited)

---

### isUnicode

#### Get Signature

> **get** **isUnicode**(): `boolean`

Whether this font uses Unicode (Type0/composite) encoding.

##### Returns

`boolean`

---

### key

#### Get Signature

> **get** **key**(): `string`

##### Returns

`string`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`key`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#key)

---

### lastChar

#### Get Signature

> **get** **lastChar**(): `number` \| `undefined`

Gets the last character code in the Widths array.

##### Returns

`number` \| `undefined`

#### Set Signature

> **set** **lastChar**(`value`): `void`

Sets the last character code in the Widths array.

##### Parameters

###### value

`number` | `undefined`

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`objectType`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#objecttype)

---

### reference

#### Get Signature

> **get** **reference**(): [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

##### Returns

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<`this`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`reference`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#reference)

---

### reverseEncodingMap

#### Get Signature

> **get** **reverseEncodingMap**(): `Map`\<`string`, `number`\> \| `undefined`

Gets the reverse encoding map (Unicode character → byte code).
Useful for encoding text back into the font's custom encoding.

##### Returns

`Map`\<`string`, `number`\> \| `undefined`

---

### widths

#### Get Signature

> **get** **widths**(): `number`[] \| `undefined`

Gets the character widths array.

##### Returns

`number`[] \| `undefined`

#### Set Signature

> **set** **widths**(`values`): `void`

Sets the character widths array.

##### Parameters

###### values

`number`[] | `undefined`

##### Returns

`void`

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`as`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#as)

---

### becomes()

> **becomes**\<`T`\>(`cls`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`becomes`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#becomes)

---

### clone()

> **clone**(): `this`

Creates a deep clone of the object

#### Returns

`this`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`clone`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#clone)

---

### cloneImpl()

> **cloneImpl**(): `this`

Creates a deep clone of the object. Override this method in subclasses to ensure all properties are cloned correctly

#### Returns

`this`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`cloneImpl`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#cloneimpl)

---

### copyFrom()

> **copyFrom**(`other`): `void`

#### Parameters

##### other

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)

#### Returns

`void`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`copyFrom`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#copyfrom)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`equals`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#equals)

---

### getCharacterWidth()

> **getCharacterWidth**(`charCode`, `fontSize`): `number` \| `null`

Gets the character width scaled to the specified font size.
Returns null if the character is not in the font's width table.

#### Parameters

##### charCode

`number`

The character code to get the width for

##### fontSize

`number`

The font size to scale to

#### Returns

`number` \| `null`

The scaled character width or null if not found

---

### getCharacterWidthsForString()

> **getCharacterWidthsForString**(`text`, `fontSize`): (`number` \| `null`)[]

Gets character widths for all characters in a string.
Returns null for characters not in the font's width table.

#### Parameters

##### text

`string`

The text to get character widths for

##### fontSize

`number`

The font size to scale to

#### Returns

(`number` \| `null`)[]

Array of character widths (null for missing characters)

---

### getRawCharacterWidth()

> **getRawCharacterWidth**(`charCode`): `number` \| `null`

Gets the raw character width (in 1000-unit em square) for a character code.
Returns null if the character is not in the font's width table.

#### Parameters

##### charCode

`number`

The character code to get the width for

#### Returns

`number` \| `null`

The raw character width or null if not found

---

### hasCharacterWidth()

> **hasCharacterWidth**(`charCode`): `boolean`

Checks if the font has width data for a character code.

#### Parameters

##### charCode

`number`

The character code to check

#### Returns

`boolean`

True if width data is available, false otherwise

---

### inPdf()

> **inPdf**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`inPdf`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#inpdf)

---

### isEncryptable()

> **isEncryptable**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isEncryptable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isencryptable)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isImmutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#isimmutable)

---

### isModified()

> **isModified**(): `boolean`

Indicates whether the object has been modified. Override this method if the modified state is determined differently

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`isModified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#ismodified)

---

### matchesReference()

> **matchesReference**(`ref?`): `boolean`

#### Parameters

##### ref?

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>\>

#### Returns

`boolean`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`matchesReference`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#matchesreference)

---

### order()

> **order**(): `number`

#### Returns

`number`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`order`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#order)

---

### resolve()

> **resolve**\<`T`\>(`cls?`): `T`

#### Type Parameters

##### T

`T` _extends_ [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

#### Parameters

##### cls?

(`options`) => `T`

#### Returns

`T`

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`resolve`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#resolve)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setImmutable`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setimmutable)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`setModified`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#setmodified)

---

### toBase64()

> **toBase64**(): `string`

Serializes the document to a Base64-encoded string.

#### Returns

`string`

A promise that resolves to the PDF document as a Base64 string

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toBase64`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tobase64)

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

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toBytes`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tobytes)

---

### tokenize()

> `protected` **tokenize**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Tokenizes the object into an array of PdfTokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`tokenize`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tokenize)

---

### toString()

> **toString**(): `string`

Returns the resource name for string coercion.
This enables using PdfFont objects in template literals like:

```typescript
const da = `/${font} 12 Tf 0 g`
```

#### Returns

`string`

#### Overrides

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toString`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#tostring)

---

### toTokens()

> **toTokens**(): [`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

Converts the object to an array of PdfTokens, including any pre or post tokens

#### Returns

[`PdfToken`](../../../core/tokens/token/classes/PdfToken.md)[]

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`toTokens`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#totokens)

---

### createPlaceholder()

> `static` **createPlaceholder**\<`T`\>(`objectNumber?`, `generationNumber?`, `content?`): [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Type Parameters

##### T

`T` _extends_ [`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)

#### Parameters

##### objectNumber?

`number`

##### generationNumber?

`number`

##### content?

`T`

#### Returns

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<`T` _extends_ `unknown` ? [`PdfNull`](../../../core/objects/pdf-null/classes/PdfNull.md) : `T`\>

#### Inherited from

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md).[`createPlaceholder`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md#createplaceholder)

---

### fromBytes()

> `static` **fromBytes**(`data`): `PdfFont`

Creates a PdfFont from font file bytes.
Automatically detects the font format (TTF, OTF, WOFF) and parses it.

#### Parameters

##### data

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The font file bytes

#### Returns

`PdfFont`

A PdfFont instance ready to be written to the PDF

---

### fromFile()

> `static` **fromFile**(`fontData`, `options?`): `PdfFont`

#### Parameters

##### fontData

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

##### options?

###### fontName?

`string`

###### unicode?

`boolean`

###### unicodeMappings?

`Map`\<`number`, `number`\>

#### Returns

`PdfFont`

---

### fromParser()

> `static` **fromParser**(`parser`): `PdfFont`

Creates a PdfFont from a FontParser instance.
Extracts all necessary information from the parser including font name,
descriptor, and font data.

#### Parameters

##### parser

[`FontParser`](../../types/interfaces/FontParser.md)

A FontParser instance (TtfParser, OtfParser, or WoffParser)

#### Returns

`PdfFont`

A PdfFont instance ready to be written to the PDF

---

### fromStandardFont()

> `static` **fromStandardFont**(`fontName`, `widths?`): `PdfFont`

Creates a standard PDF Type1 font (one of the 14 built-in fonts).
These fonts don't require font data as they're built into PDF viewers.

#### Parameters

##### fontName

`PdfStandardFontName`

One of the 14 standard PDF fonts

##### widths?

`number`[]

Optional AFM widths array (1/1000 em units) for chars 32–126

#### Returns

`PdfFont`

A PdfFont instance ready to be written to the PDF

---

### fromTrueTypeData()

> `static` **fromTrueTypeData**(`fontData`, `fontName`, `descriptor`): `PdfFont`

Creates a TrueType font from font file data.
Uses WinAnsiEncoding for standard 8-bit character support.

#### Parameters

##### fontData

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The TrueType font file bytes

##### fontName

`string`

The name to use for this font in the PDF

##### descriptor

[`FontDescriptor`](../../types/interfaces/FontDescriptor.md)

Font metrics and properties

#### Returns

`PdfFont`

A PdfFont instance ready to be written to the PDF

---

### fromType0Data()

> `static` **fromType0Data**(`fontData`, `fontName`, `descriptor`, `unicodeMappings?`): `PdfFont`

Creates a Type0 (composite) font with Unicode support.
Use this for fonts that need to display non-ASCII characters.

#### Parameters

##### fontData

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The TrueType font file bytes

##### fontName

`string`

The name to use for this font in the PDF

##### descriptor

[`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md)

Unicode font descriptor with CID metrics

##### unicodeMappings?

`Map`\<`number`, `number`\>

Optional map of CID to Unicode code point for ToUnicode CMap

#### Returns

`PdfFont`

A PdfFont instance ready to be written to the PDF

---

### getStandardFont()

> `static` **getStandardFont**(`fontName`): `PdfFont` \| `null`

Returns the static PdfFont instance for a standard font name, or null if not found.

#### Parameters

##### fontName

`string`

#### Returns

`PdfFont` \| `null`
