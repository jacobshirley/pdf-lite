[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [acroform/xfa/pdf-xfa-form](../README.md) / PdfXfaForm

# Class: PdfXfaForm

Typed wrapper around the XFA name/stream-ref array.
Holds eagerly-loaded references to component streams like datasets.

## Constructors

### Constructor

> **new PdfXfaForm**(`xfaEntry?`): `PdfXfaForm`

#### Parameters

##### xfaEntry?

[`PdfArray`](../../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\<[`PdfIndirectObject`](../../../../core/objects/pdf-indirect-object/classes/PdfIndirectObject.md)\<[`PdfObject`](../../../../core/objects/pdf-object/classes/PdfObject.md)\>\>\>

#### Returns

`PdfXfaForm`

## Accessors

### components

#### Get Signature

> **get** **components**(): `object`

##### Returns

`object`

---

### datasets

#### Get Signature

> **get** **datasets**(): [`PdfXfaData`](../../pdf-xfa-data/classes/PdfXfaData.md) \| `null`

##### Returns

[`PdfXfaData`](../../pdf-xfa-data/classes/PdfXfaData.md) \| `null`
