[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [annotations/PdfAnnotationWriter](../README.md) / PdfAnnotationWriter

# Class: PdfAnnotationWriter

Manages page Annots arrays during AcroForm write operations.

## Constructors

### Constructor

> **new PdfAnnotationWriter**(): `PdfAnnotationWriter`

#### Returns

`PdfAnnotationWriter`

## Methods

### addFieldsToAnnots()

> `static` **addFieldsToAnnots**(`annotsArray`, `fieldRefs`): `void`

#### Parameters

##### annotsArray

[`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>

##### fieldRefs

[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]

#### Returns

`void`

---

### getPageAnnotsArray()

> `static` **getPageAnnotsArray**(`document`, `pageDict`): `Promise`\<\{ `annotsArray`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `generationNumber?`: `number`; `isIndirect`: `boolean`; `objectNumber?`: `number`; \}\>

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

##### pageDict

[`PdfDictionary`](../../../core/objects/pdf-dictionary/classes/PdfDictionary.md)

#### Returns

`Promise`\<\{ `annotsArray`: [`PdfArray`](../../../core/objects/pdf-array/classes/PdfArray.md)\<[`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)\>; `generationNumber?`: `number`; `isIndirect`: `boolean`; `objectNumber?`: `number`; \}\>

---

### updatePageAnnotations()

> `static` **updatePageAnnotations**(`document`, `fieldsByPage`): `Promise`\<`void`\>

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

##### fieldsByPage

`Map`\<`string`, \{ `fieldRefs`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md)[]; `pageRef`: [`PdfObjectReference`](../../../core/objects/pdf-object-reference/classes/PdfObjectReference.md); \}\>

#### Returns

`Promise`\<`void`\>
