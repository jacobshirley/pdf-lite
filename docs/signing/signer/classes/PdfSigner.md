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

> **new PdfSigner**(`options`): `PdfSigner`

#### Parameters

##### options

###### document

[`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

###### useDocumentSecurityStore?

`boolean`

#### Returns

`PdfSigner`

## Properties

### document

> **document**: [`PdfDocument`](../../../pdf/pdf-document/classes/PdfDocument.md)

The PDF document to be signed.

---

### useDocumentSecurityStore

> **useDocumentSecurityStore**: `boolean` = `true`

Whether to use the Document Security Store for revocation information.

## Methods

### setDocumentSecurityStore()

> **setDocumentSecurityStore**(`dss`): `void`

Sets the Document Security Store (DSS) for the this.document.
Used for long-term validation of digital signatures.

#### Parameters

##### dss

[`PdfDocumentSecurityStoreObject`](../../document-security-store/classes/PdfDocumentSecurityStoreObject.md)

The Document Security Store object to set

#### Returns

`void`

#### Throws

Error if the document has no root dictionary

---

### sign()

> **sign**(): `Promise`\<`void`\>

Signs all signature objects in the this.document.
Computes byte ranges, generates signatures, and optionally adds revocation info to DSS.

#### Returns

`Promise`\<`void`\>

The signed this.document.

---

### verify()

> **verify**(`options?`): `Promise`\<[`PdfDocumentVerificationResult`](../type-aliases/PdfDocumentVerificationResult.md)\>

Verifies all signatures in the this.document.
First serializes the document to bytes and reloads it to ensure signatures
are properly deserialized into the correct classes before verification.
Then searches for signature objects, computes their byte ranges, and verifies each one.

#### Parameters

##### options?

Optional verification options.

###### certificateValidation?

`boolean` \| `CertificateValidationOptions`

#### Returns

`Promise`\<[`PdfDocumentVerificationResult`](../type-aliases/PdfDocumentVerificationResult.md)\>

The verification result for all signatures.

#### Example

```typescript
const signer = new PdfSigner()
const result = await signer.verify(document)
if (result.valid) {
    console.log('All signatures are valid')
} else {
    result.signatures.forEach((sig) => {
        if (!sig.result.valid) {
            console.log(`Signature ${sig.index} invalid:`, sig.result.reasons)
        }
    })
}
```
