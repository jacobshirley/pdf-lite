[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [fonts/parsers/ttf-parser](../README.md) / TtfParser

# Class: TtfParser

Parses TrueType font files (.ttf) to extract metrics and glyph widths.

## Implements

- [`FontParser`](../../../types/interfaces/FontParser.md)

## Constructors

### Constructor

> **new TtfParser**(`fontData`): `TtfParser`

#### Parameters

##### fontData

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`TtfParser`

## Methods

### getCharWidths()

> **getCharWidths**(`firstChar`, `lastChar`): `number`[]

Gets character widths for a range of characters.
Widths are scaled to PDF's 1000-unit em square.

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
