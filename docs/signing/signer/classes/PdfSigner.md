[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/signer](../README.md) / PdfSigner

# Class: PdfSigner

Handles digital signing operations for PDF documents.
Processes signature objects and optionally stores revocation information in the DSS.

## Example

```typescript
const signer = new PdfSigner()
const signedDoc = await signer.sign(document)
```

## Constructors

### Constructor

> **new PdfSigner**(): `PdfSigner`

#### Returns

`PdfSigner`

## Properties

### useDocumentSecurityStore

> **useDocumentSecurityStore**: `boolean` = `true`

Whether to use the Document Security Store for revocation information.

## Methods

### sign()

> **sign**(`document`): `Promise`\<[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)\>

Signs all signature objects in the document.
Computes byte ranges, generates signatures, and optionally adds revocation info to DSS.

#### Parameters

##### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

The PDF document to sign.

#### Returns

`Promise`\<[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)\>

The signed document.
