[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/utils](../README.md) / createStandardSecurityHandlerFromDictionary

# Function: createStandardSecurityHandlerFromDictionary()

> **createStandardSecurityHandlerFromDictionary**(`dict`, `options?`): [`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md)

Creates a standard security handler from an encryption dictionary.
Selects the appropriate version (V1-V5) based on the dictionary parameters.

## Parameters

### dict

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF trailer.

### options?

Optional configuration including passwords and document ID.

#### documentId?

[`PdfId`](../../../types/type-aliases/PdfId.md)

#### ownerPassword?

`string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### password?

`string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

## Returns

[`PdfStandardSecurityHandler`](../../base/classes/PdfStandardSecurityHandler.md)

The appropriate standard security handler instance.

## Throws

Error if the version/revision combination is unsupported.

## Example

```typescript
const handler = createStandardSecurityHandlerFromDictionary(encryptDict, {
    password: 'user',
    ownerPassword: 'owner',
})
```
