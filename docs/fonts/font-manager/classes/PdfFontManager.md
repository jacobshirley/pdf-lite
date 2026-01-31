[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [fonts/font-manager](../README.md) / PdfFontManager

# Class: PdfFontManager

Manages font embedding in PDF documents.
Provides methods to embed TrueType and other font formats.

## Constructors

### Constructor

> **new PdfFontManager**(`document`): `PdfFontManager`

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`PdfFontManager`

## Methods

### embedStandardFont()

> **embedStandardFont**(`fontName`): `Promise`\<`string`\>

Embeds a standard PDF font (Type1).
These fonts don't require font data as they're built into PDF viewers.

#### Parameters

##### fontName

One of the 14 standard PDF fonts

`"Helvetica"` | `"Helvetica-Bold"` | `"Helvetica-Oblique"` | `"Helvetica-BoldOblique"` | `"Times-Roman"` | `"Times-Bold"` | `"Times-Italic"` | `"Times-BoldItalic"` | `"Courier"` | `"Courier-Bold"` | `"Courier-Oblique"` | `"Courier-BoldOblique"` | `"Symbol"` | `"ZapfDingbats"`

#### Returns

`Promise`\<`string`\>

The font resource name to use in content streams

---

### embedTrueTypeFont()

> **embedTrueTypeFont**(`fontData`, `fontName`, `descriptor`): `Promise`\<`string`\>

Embeds a TrueType font into the PDF document.

#### Parameters

##### fontData

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The font file bytes

##### fontName

`string`

The name to use for this font in the PDF

##### descriptor

[`FontDescriptor`](../../types/interfaces/FontDescriptor.md)

Font metrics and properties

#### Returns

`Promise`\<`string`\>

The font resource name (e.g., "F1") to use in content streams

---

### embedTrueTypeFontUnicode()

> **embedTrueTypeFontUnicode**(`fontData`, `fontName`, `descriptor`, `unicodeMappings?`): `Promise`\<`string`\>

Embeds a TrueType font with Unicode/Type0 support.
Use this for fonts that need to display non-ASCII characters.

#### Parameters

##### fontData

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The font file bytes

##### fontName

`string`

The name to use for this font in the PDF

##### descriptor

[`UnicodeFontDescriptor`](../../types/interfaces/UnicodeFontDescriptor.md)

Unicode font descriptor with CID metrics

##### unicodeMappings?

`Map`\<`number`, `number`\>

Map of CID to Unicode code point for ToUnicode CMap

#### Returns

`Promise`\<`string`\>

The font resource name (e.g., "F1") to use in content streams

---

### getAllFonts()

> **getAllFonts**(): `Map`\<`string`, [`EmbeddedFont`](../../types/interfaces/EmbeddedFont.md)\>

Gets all embedded fonts.

#### Returns

`Map`\<`string`, [`EmbeddedFont`](../../types/interfaces/EmbeddedFont.md)\>

---

### getFont()

> **getFont**(`fontName`): [`EmbeddedFont`](../../types/interfaces/EmbeddedFont.md) \| `undefined`

Gets the font reference by font name or resource name.

#### Parameters

##### fontName

`string`

#### Returns

[`EmbeddedFont`](../../types/interfaces/EmbeddedFont.md) \| `undefined`

---

### loadExistingFonts()

> **loadExistingFonts**(): `Promise`\<`Map`\<`string`, [`EmbeddedFont`](../../types/interfaces/EmbeddedFont.md)\>\>

Loads existing fonts from the PDF document.
Traverses the page tree and extracts font information from page resources.

#### Returns

`Promise`\<`Map`\<`string`, [`EmbeddedFont`](../../types/interfaces/EmbeddedFont.md)\>\>

Map of font names to their embedded font info
