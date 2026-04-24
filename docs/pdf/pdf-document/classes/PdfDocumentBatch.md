[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [pdf/pdf-document](../README.md) / PdfDocumentBatch

# Class: PdfDocumentBatch

Batches multiple `add()` calls into a single update pass.
Created via [PdfDocument.batch](PdfDocument.md#batch).

## Constructors

### Constructor

> **new PdfDocumentBatch**(`document`): `PdfDocumentBatch`

**`Internal`**

#### Parameters

##### document

[`PdfDocument`](PdfDocument.md)

#### Returns

`PdfDocumentBatch`

## Methods

### add()

> **add**(...`objects`): `this`

Adds one or more objects to the document without triggering an update.

#### Parameters

##### objects

...[`PdfObject`](../../../core/objects/pdf-object/classes/PdfObject.md)[]

PDF objects to add

#### Returns

`this`

---

### commit()

> **commit**(): `void`

Commits the batch, running a single update pass for all added objects.

#### Returns

`void`

---

### rollback()

> **rollback**(): `void`

Rolls back the batch, removing all objects that were added and
restoring the document to its state before the batch was created.

#### Returns

`void`
