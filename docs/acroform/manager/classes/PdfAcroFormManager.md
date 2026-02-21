[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/manager](../README.md) / PdfAcroFormManager

# Class: PdfAcroFormManager

Manages AcroForm fields in PDF documents.
Provides methods to read and write form field values.

## Constructors

### Constructor

> **new PdfAcroFormManager**(`document`): `PdfAcroFormManager`

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`PdfAcroFormManager`

## Methods

### exists()

> **exists**(): `Promise`\<`boolean`\>

Checks if the document contains AcroForm fields.

#### Returns

`Promise`\<`boolean`\>

True if the document has AcroForm fields, false otherwise

---

### getXfa()

> **getXfa**(): `Promise`\<[`PdfXfaForm`](../../xfa/pdf-xfa-form/classes/PdfXfaForm.md) \| `null`\>

Gets the XFA form wrapper, loading it lazily on first access.

#### Returns

`Promise`\<[`PdfXfaForm`](../../xfa/pdf-xfa-form/classes/PdfXfaForm.md) \| `null`\>

The PdfXfaForm or null if no XFA forms exist

---

### read()

> **read**(): `Promise`\<[`PdfAcroForm`](../../pdf-acro-form/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\> \| `null`\>

Gets the AcroForm object from the document catalog.

#### Returns

`Promise`\<[`PdfAcroForm`](../../pdf-acro-form/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\> \| `null`\>

The AcroForm object or null if not found

---

### setXfa()

> **setXfa**(`xfa`): `Promise`\<`void`\>

Explicitly sets the XFA form instance, bypassing the lazy load on next write.

#### Parameters

##### xfa

[`PdfXfaForm`](../../xfa/pdf-xfa-form/classes/PdfXfaForm.md)

#### Returns

`Promise`\<`void`\>

---

### write()

> **write**(`acroForm?`): `Promise`\<`void`\>

Writes the provided AcroForm to the associated PDF document.

#### Parameters

##### acroForm?

[`PdfAcroForm`](../../pdf-acro-form/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\>

The AcroForm instance to serialize into the document.

#### Returns

`Promise`\<`void`\>

#### Throws

Error If writing the AcroForm to the document fails.
