[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/fields/types](../README.md) / FormContext

# Interface: FormContext\<TField\>

Interface that PdfAcroForm implements, used by PdfFormField to avoid circular imports.
Uses generic field type to avoid circular dependency.

## Type Parameters

### TField

`TField` = `any`

## Properties

### defaultAppearance

> **defaultAppearance**: `string` \| `null`

---

### defaultResources

> **defaultResources**: [`PdfDefaultResourcesDictionary`](../../../pdf-acro-form/type-aliases/PdfDefaultResourcesDictionary.md) \| `null`

---

### fields

> **fields**: `TField`[]

---

### fontEncodingMaps

> **fontEncodingMaps**: `Map`\<`string`, `Map`\<`number`, `string`\>\>

---

### fontRefs

> **fontRefs**: `Map`\<`string`, [`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>

Object references for all resolved fonts, keyed by resource name.

---

### isFontUnicode()

> **isFontUnicode**: (`fontName`) => `boolean`

#### Parameters

##### fontName

`string`

#### Returns

`boolean`

---

### needAppearances

> **needAppearances**: `boolean`
