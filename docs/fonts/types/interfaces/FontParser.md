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
