[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/PdfFontEncodingCache](../README.md) / PdfFontEncodingCache

# Class: PdfFontEncodingCache

Resolves and caches font encoding maps from the form's default resources.

## Constructors

### Constructor

> **new PdfFontEncodingCache**(`document`, `defaultResources`): `PdfFontEncodingCache`

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md) | `undefined`

##### defaultResources

[`PdfDefaultResourcesDictionary`](../../PdfAcroForm/type-aliases/PdfDefaultResourcesDictionary.md) | `null`

#### Returns

`PdfFontEncodingCache`

## Properties

### fontEncodingMaps

> `readonly` **fontEncodingMaps**: `Map`\<`string`, `Map`\<`number`, `string`\>\>

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
