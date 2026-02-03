[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [fonts/parsers/otf-parser](../README.md) / OtfParser

# Class: OtfParser

Parses OpenType font files (.otf) to extract metrics and glyph widths.
Supports both CFF-based and TrueType-based OpenType fonts.

Note: OTF files share the same table structure as TTF for metrics,
the main difference is the glyph outline format (CFF vs TrueType).

## Implements

- [`FontParser`](../../../types/interfaces/FontParser.md)

## Constructors

### Constructor

> **new OtfParser**(`fontData`): `OtfParser`

#### Parameters

##### fontData

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`OtfParser`

## Methods

### getCharWidths()

> **getCharWidths**(`firstChar`, `lastChar`): `number`[]

Gets character widths for a range of characters.

#### Parameters

##### firstChar

`number`

##### lastChar

`number`

#### Returns

`number`[]

#### Implementation of

[`FontParser`](../../../types/interfaces/FontParser.md).[`getCharWidths`](../../../types/interfaces/FontParser.md#getcharwidths)

---

### getFontData()

> **getFontData**(): [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

Returns the original font bytes.

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Implementation of

[`FontParser`](../../../types/interfaces/FontParser.md).[`getFontData`](../../../types/interfaces/FontParser.md#getfontdata)

---

### getFontDescriptor()

> **getFontDescriptor**(`fontName?`): [`FontDescriptor`](../../../types/interfaces/FontDescriptor.md)

Creates a FontDescriptor suitable for embedding.
Scales metrics to PDF's 1000-unit em square.

#### Parameters

##### fontName?

`string`

#### Returns

[`FontDescriptor`](../../../types/interfaces/FontDescriptor.md)

#### Implementation of

[`FontParser`](../../../types/interfaces/FontParser.md).[`getFontDescriptor`](../../../types/interfaces/FontParser.md#getfontdescriptor)

---

### getFontInfo()

> **getFontInfo**(): [`TtfFontInfo`](../../../types/interfaces/TtfFontInfo.md)

Parses the font and returns basic font information.

#### Returns

[`TtfFontInfo`](../../../types/interfaces/TtfFontInfo.md)

#### Implementation of

[`FontParser`](../../../types/interfaces/FontParser.md).[`getFontInfo`](../../../types/interfaces/FontParser.md#getfontinfo)

---

### isCFFBased()

> **isCFFBased**(): `boolean`

Returns true if this is a CFF-based OpenType font.

#### Returns

`boolean`
