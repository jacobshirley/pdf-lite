[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/pdf-font-encoding-cache](../README.md) / PdfFontEncodingCache

# Class: PdfFontEncodingCache

Resolves and caches font encoding maps from the form's default resources.

## Constructors

### Constructor

> **new PdfFontEncodingCache**(`document`, `defaultResources`): `PdfFontEncodingCache`

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md) | `undefined`

##### defaultResources

[`PdfDefaultResourcesDictionary`](../../pdf-acro-form/type-aliases/PdfDefaultResourcesDictionary.md) | `null`

#### Returns

`PdfFontEncodingCache`

## Properties

### fontEncodingMaps

> `readonly` **fontEncodingMaps**: `Map`\<`string`, `Map`\<`number`, `string`\>\>

---

### fontRefs

> `readonly` **fontRefs**: `Map`\<`string`, [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>

Object references for all resolved fonts, keyed by resource name.

---

### fontTypes

> `readonly` **fontTypes**: `Map`\<`string`, `string`\>

## Methods

### cacheAllFontEncodings()

> **cacheAllFontEncodings**(`fields`): `Promise`\<`void`\>

#### Parameters

##### fields

`object`[]

#### Returns

`Promise`\<`void`\>

---

### getFontEncodingMap()

> **getFontEncodingMap**(`fontName`): `Promise`\<`Map`\<`number`, `string`\> \| `null`\>

#### Parameters

##### fontName

`string`

#### Returns

`Promise`\<`Map`\<`number`, `string`\> \| `null`\>

---

### isFontUnicode()

> **isFontUnicode**(`fontName`): `boolean`

#### Parameters

##### fontName

`string`

#### Returns

`boolean`
