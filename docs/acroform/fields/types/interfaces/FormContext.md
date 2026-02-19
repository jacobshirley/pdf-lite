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

> **defaultResources**: [`PdfDefaultResourcesDictionary`](../../../PdfAcroForm/type-aliases/PdfDefaultResourcesDictionary.md) \| `null`

---

### fields

> **fields**: `TField`[]

---

### fontEncodingMaps

> **fontEncodingMaps**: `Map`\<`string`, `Map`\<`number`, `string`\>\>
