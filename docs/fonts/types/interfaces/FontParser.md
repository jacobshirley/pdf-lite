[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [fonts/types](../README.md) / FontParser

# Interface: FontParser

Common interface for all font parsers.

## Methods

### getCharWidths()

> **getCharWidths**(`firstChar`, `lastChar`): `number`[]

#### Parameters

##### firstChar

`number`

##### lastChar

`number`

#### Returns

`number`[]

---

### getFontData()

> **getFontData**(): [`ByteArray`](../../../types/type-aliases/ByteArray.md)

#### Returns

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

---

### getFontDescriptor()

> **getFontDescriptor**(`fontName?`): [`FontDescriptor`](FontDescriptor.md)

#### Parameters

##### fontName?

`string`

#### Returns

[`FontDescriptor`](FontDescriptor.md)

---

### getFontInfo()

> **getFontInfo**(): [`TtfFontInfo`](TtfFontInfo.md)

#### Returns

[`TtfFontInfo`](TtfFontInfo.md)

---

### parseCmap()

> **parseCmap**(): `Map`\<`number`, `number`\>

Parses the font's cmap table to extract Unicode to glyph ID mappings.

#### Returns

`Map`\<`number`, `number`\>

A map from Unicode code points to glyph IDs

---

### parseHmtx()

> **parseHmtx**(): `Map`\<`number`, `number`\>

Parses the font's hmtx table to extract glyph advance widths.

#### Returns

`Map`\<`number`, `number`\>

A map from glyph IDs to advance widths (in font units)
