[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [fonts/manager](../README.md) / PdfFontManager

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

### embedFromFile()

> **embedFromFile**(`fontData`, `options?`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

Embeds a font from file data with automatic parsing and configuration.
This is the recommended high-level API for embedding fonts.

#### Parameters

##### fontData

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

The font file bytes (TTF, OTF, or WOFF format)

##### options?

Optional configuration

###### fontName?

`string`

Custom font name (defaults to PostScript name from font)

###### unicode?

`boolean`

Use Unicode/Type0 encoding for non-ASCII characters

###### unicodeMappings?

`Map`\<`number`, `number`\>

Custom CID to Unicode mappings for Type0 fonts

#### Returns

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

A PdfFont object representing the embedded font

#### Example

```typescript
// Simple embedding with auto-generated name
const font = await document.fonts.embedFromFile(fontData)
field.font = font

// With custom name and Unicode support
const font = await document.fonts.embedFromFile(fontData, {
    fontName: 'MyCustomFont',
    unicode: true,
})
```

---

### embedStandardFont()

> **embedStandardFont**(`fontName`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

Embeds a standard PDF font (Type1).
These fonts don't require font data as they're built into PDF viewers.

#### Parameters

##### fontName

One of the 14 standard PDF fonts

`"Helvetica"` | `"Helvetica-Bold"` | `"Helvetica-Oblique"` | `"Helvetica-BoldOblique"` | `"Times-Roman"` | `"Times-Bold"` | `"Times-Italic"` | `"Times-BoldItalic"` | `"Courier"` | `"Courier-Bold"` | `"Courier-Oblique"` | `"Courier-BoldOblique"` | `"Symbol"` | `"ZapfDingbats"`

#### Returns

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

A PdfFont object representing the embedded font

---

### embedTrueTypeFont()

> **embedTrueTypeFont**(`fontData`, `fontName`, `descriptor`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

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

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

A PdfFont object representing the embedded font

---

### embedTrueTypeFontUnicode()

> **embedTrueTypeFontUnicode**(`fontData`, `fontName`, `descriptor`, `unicodeMappings?`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

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

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

A PdfFont object representing the embedded font

---

### findFontByName()

> **findFontByName**(`fontName`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md) \| `undefined`\>

#### Parameters

##### fontName

`string`

#### Returns

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md) \| `undefined`\>

---

### getAllFonts()

> **getAllFonts**(): `Promise`\<`Map`\<`string`, [`PdfFont`](../../pdf-font/classes/PdfFont.md)\>\>

Gets all embedded fonts.
Searches the PDF structure to find all fonts.

#### Returns

`Promise`\<`Map`\<`string`, [`PdfFont`](../../pdf-font/classes/PdfFont.md)\>\>

---

### getFont()

> **getFont**(`fontName`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md) \| `undefined`\>

Gets the font reference by font name or resource name.

#### Parameters

##### fontName

`string`

#### Returns

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md) \| `undefined`\>

---

### loadExistingFonts()

> **loadExistingFonts**(): `Promise`\<`Map`\<`string`, [`PdfFont`](../../pdf-font/classes/PdfFont.md)\>\>

Loads existing fonts from the PDF document.
Traverses the page tree and extracts font information from page resources.

#### Returns

`Promise`\<`Map`\<`string`, [`PdfFont`](../../pdf-font/classes/PdfFont.md)\>\>

Map of font names to their PdfFont objects

---

### write()

> **write**(`font`): `Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

**`Internal`**

Writes a font to the PDF document.
Assigns resource name, creates container object, commits all objects,
and registers it in page resources.

#### Parameters

##### font

[`PdfFont`](../../pdf-font/classes/PdfFont.md)

The PdfFont instance to write

#### Returns

`Promise`\<[`PdfFont`](../../pdf-font/classes/PdfFont.md)\>

The font with its resourceName and container set
