[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [fonts/pdf-font](../README.md) / PdfFont

# Class: PdfFont

Represents an embedded font in a PDF document.
Extends PdfDictionary to provide both font metadata and PDF dictionary structure.

## Extends

- [`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<\{ `BaseFont`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); `DescendantFonts?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `Encoding?`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md); `FirstChar?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `FontDescriptor?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); `LastChar?`: [`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md); `Subtype`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"Type1"` \| `"TrueType"` \| `"Type0"`\>; `ToUnicode?`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); `Type`: [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`"Font"`\>; `Widths?`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfNumber`](../../../core/objects/pdf-number/classes/PdfNumber.md)\>; \}\>

## Constructors

### Constructor

> **new PdfFont**(`options`): `PdfFont`

#### Parameters

##### options

###### container?

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

###### descriptor?

[`FontDescriptor`](../../types/interfaces/FontDescriptor.md) \| [`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md)

###### dict?

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)\<[`PdfDictionaryEntries`](../../../core/objects/pdf-dictionary/type-aliases/PdfDictionaryEntries.md)\>

###### encoding?

`string`

###### fontData?

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

###### fontName?

`string`

###### manager?

[`PdfFontManager`](../../font-manager/classes/PdfFontManager.md)

###### resourceName?

`string`

#### Returns

`PdfFont`

#### Overrides

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`constructor`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#constructor)

## Properties

### auxiliaryObjects

> `protected` **auxiliaryObjects**: [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>[] = `[]`

Auxiliary objects that must be committed along with the font dict.
Includes FontDescriptor, FontFile2, CIDFont, ToUnicode, etc.

---

### container?

> `optional` **container**: [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>

Reference to the container indirect object that wraps this font dict.
Set by FontManager.write() when the font is committed to the PDF.

---

### immutable

> `protected` **immutable**: `boolean` = `false`

Indicates whether the object is immutable (cannot be modified)

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`immutable`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#immutable)

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

---

### resourceName

> **resourceName**: `string`

The PDF resource name used in content streams (e.g., 'F1', 'F2').
This is the identifier used in PDF operators like `/F1 12 Tf`.

## Accessors

### descriptor

#### Get Signature

> **get** **descriptor**(): [`FontDescriptor`](../../types/interfaces/FontDescriptor.md) \| [`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md) \| `undefined`

Gets the font descriptor with metrics and properties.
Available for embedded fonts, undefined for standard fonts or loaded fonts without descriptor.

##### Returns

[`FontDescriptor`](../../types/interfaces/FontDescriptor.md) \| [`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md) \| `undefined`

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
Returns the container object if available.

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

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`objectType`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#objecttype)

---

### values

#### Get Signature

> **get** **values**(): `{ readonly [K in string]: T[K] }`

##### Returns

`{ readonly [K in string]: T[K] }`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`values`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#values)

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

`K` _extends_ `"Type"` \| `"Subtype"` \| `"BaseFont"` \| `"FontDescriptor"` \| `"Encoding"` \| `"FirstChar"` \| `"LastChar"` \| `"Widths"` \| `"DescendantFonts"` \| `"ToUnicode"`

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

### get()

> **get**\<`K`\>(`key`): `object`\[`K`\] \| `undefined`

#### Type Parameters

##### K

`K` _extends_ `"Type"` \| `"Subtype"` \| `"BaseFont"` \| `"FontDescriptor"` \| `"Encoding"` \| `"FirstChar"` \| `"LastChar"` \| `"Widths"` \| `"DescendantFonts"` \| `"ToUnicode"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`object`\[`K`\] \| `undefined`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`get`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#get)

---

### getObjectsToCommit()

> **getObjectsToCommit**(): [`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>[]

Returns all objects that need to be committed to the PDF.
Includes auxiliary objects (descriptors, streams) and the container.

#### Returns

[`PdfIndirectObject`](../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)\>[]

---

### has()

> **has**\<`K`\>(`key`): `boolean`

#### Type Parameters

##### K

`K` _extends_ `"Type"` \| `"Subtype"` \| `"BaseFont"` \| `"FontDescriptor"` \| `"Encoding"` \| `"FirstChar"` \| `"LastChar"` \| `"Widths"` \| `"DescendantFonts"` \| `"ToUnicode"`

#### Parameters

##### key

`K` | [`PdfName`](../../../core/objects/pdf-name/classes/PdfName.md)\<`K`\>

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`has`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#has)

---

### isImmutable()

> **isImmutable**(): `boolean`

Indicates whether the object is immutable (cannot be modified)

#### Returns

`boolean`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`isImmutable`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#isimmutable)

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

`K` _extends_ `"Type"` \| `"Subtype"` \| `"BaseFont"` \| `"FontDescriptor"` \| `"Encoding"` \| `"FirstChar"` \| `"LastChar"` \| `"Widths"` \| `"DescendantFonts"` \| `"ToUnicode"`

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

### setImmutable()

> **setImmutable**(`immutable?`): `void`

Sets the immutable state of the object

#### Parameters

##### immutable?

`boolean`

#### Returns

`void`

#### Inherited from

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md).[`setImmutable`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md#setimmutable)

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

Returns the resource name for string coercion.
This enables using PdfFont objects in template literals like:

```typescript
const da = `/${font} 12 Tf 0 g`
```

#### Returns

`string`

#### Overrides

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

> `static` **fromStandardFont**(`fontName`): `PdfFont`

Creates a standard PDF Type1 font (one of the 14 built-in fonts).
These fonts don't require font data as they're built into PDF viewers.

#### Parameters

##### fontName

One of the 14 standard PDF fonts

`"Helvetica"` | `"Helvetica-Bold"` | `"Helvetica-Oblique"` | `"Helvetica-BoldOblique"` | `"Times-Roman"` | `"Times-Bold"` | `"Times-Italic"` | `"Times-BoldItalic"` | `"Courier"` | `"Courier-Bold"` | `"Courier-Oblique"` | `"Courier-BoldOblique"` | `"Symbol"` | `"ZapfDingbats"`

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
