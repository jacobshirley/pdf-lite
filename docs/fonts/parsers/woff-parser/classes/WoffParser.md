[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [fonts/parsers/woff-parser](../README.md) / WoffParser

# Class: WoffParser

Parses WOFF (Web Open Font Format) files.
WOFF is a compressed wrapper around TTF/OTF fonts.

## Implements

- [`FontParser`](../../../types/interfaces/FontParser.md)

## Constructors

### Constructor

> **new WoffParser**(`woffData`): `WoffParser`

#### Parameters

##### woffData

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### Returns

`WoffParser`

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

Gets the decompressed TTF/OTF font data.

#### Returns

[`ByteArray`](../../../../types/type-aliases/ByteArray.md)

---

### getFontDescriptor()

> **getFontDescriptor**(`fontName?`): [`FontDescriptor`](../../../types/interfaces/FontDescriptor.md)

Creates a FontDescriptor suitable for embedding.

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
