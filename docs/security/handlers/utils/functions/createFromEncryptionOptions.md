[**pdf-lite**](../../../../README.md)

---

[pdf-lite](../../../../README.md) / [security/handlers/utils](../README.md) / createFromEncryptionOptions

# Function: createFromEncryptionOptions()

> **createFromEncryptionOptions**(`options`): [`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md)

Creates a security handler from encryption options.
Automatically selects the appropriate handler version based on the encryption method.

## Parameters

### options

[`PdfEncryptionOptions`](../../../types/type-aliases/PdfEncryptionOptions.md)

The encryption configuration options.

## Returns

[`PdfSecurityHandler`](../../base/classes/PdfSecurityHandler.md)

A configured security handler.

## Throws

Error if no encryption is selected or the type is unsupported.

## Example

```typescript
const handler = createFromEncryptionOptions({
    method: { default: 'AES-256-CBC' },
    password: 'secret',
    permissions: { print: true, copy: false },
})
```
