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

### read()

> **read**(): `Promise`\<[`PdfAcroForm`](../../acroform/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\> \| `null`\>

Gets the AcroForm object from the document catalog.

#### Returns

`Promise`\<[`PdfAcroForm`](../../acroform/classes/PdfAcroForm.md)\<`Record`\<`string`, `string`\>\> \| `null`\>

The AcroForm object or null if not found

---

### write()

> **write**(`acroForm`): `Promise`\<`void`\>

Writes the provided AcroForm to the associated PDF document.

#### Parameters

##### acroForm

[`PdfAcroForm`](../../acroform/classes/PdfAcroForm.md)

The AcroForm instance to serialize into the document.

#### Returns

`Promise`\<`void`\>

#### Throws

Error If writing the AcroForm to the document fails.
