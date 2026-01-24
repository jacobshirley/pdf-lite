[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [acroform/acroform-manager](../README.md) / PdfAcroFormManager

# Class: PdfAcroFormManager\<T\>

Manages AcroForm fields in PDF documents.
Provides methods to read and write form field values.

## Type Parameters

### T

`T` _extends_ `Record`\<`string`, `string`\> = `Record`\<`string`, `string`\>

## Constructors

### Constructor

> **new PdfAcroFormManager**\<`T`\>(`document`): `PdfAcroFormManager`\<`T`\>

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

#### Returns

`PdfAcroFormManager`\<`T`\>

## Methods

### getFieldValues()

> **getFieldValues**(): `Promise`\<`T` \| `null`\>

Gets all form field values as a key-value map.

#### Returns

`Promise`\<`T` \| `null`\>

Object with field names as keys and values as strings

---

### hasAcroForm()

> **hasAcroForm**(): `Promise`\<`boolean`\>

Checks if the document contains AcroForm fields.

#### Returns

`Promise`\<`boolean`\>

True if the document has AcroForm fields, false otherwise

---

### setFieldValues()

> **setFieldValues**(`newFields`): `Promise`\<`void`\>

Sets a form field value by field name.

#### Parameters

##### newFields

`Partial`\<`T`\>

#### Returns

`Promise`\<`void`\>

#### Throws

Error if the field is not found
