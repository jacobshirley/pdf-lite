[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/utils](../README.md) / createFromDictionary

# Function: createFromDictionary()

> **createFromDictionary**(`dict`, `options?`): [`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md)

Creates a security handler from an encryption dictionary.
Automatically detects the handler type (Standard or Adobe.PubSec) and version.

## Parameters

### dict

[`PdfEncryptionDictionary`](../../../types/type-aliases/PdfEncryptionDictionary.md)

The encryption dictionary from the PDF trailer.

### options?

Optional configuration including passwords and recipients.

#### documentId?

[`PdfId`](../../../types/type-aliases/PdfId.md)

#### ownerPassword?

`string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### password?

`string` \| [`ByteArray`](../../../../types/type-aliases/ByteArray.md)

#### recipients?

[`PdfEncryptionRecipient`](../../../types/type-aliases/PdfEncryptionRecipient.md)[]

## Returns

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md)

The appropriate security handler instance.

## Throws

Error if the filter type is unsupported.

## Example

```typescript
const handler = createFromDictionary(encryptDict, { password: 'secret' })
```
