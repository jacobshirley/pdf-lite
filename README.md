**[Examples](./EXAMPLES.md)** | **[Documentation](https://jacobshirley.github.io/pdf-lite/v1)**

# pdf-lite

A low-level, minimal-dependency, type-safe PDF library that works in the browser and Node.js.

> **Note**: This library is actively developed and may not support all PDF features yet. However, it is designed to be extensible and can be improved over time.

PRs and issues are welcome!

[![npm version](https://img.shields.io/npm/v/pdf-lite.svg)](https://www.npmjs.com/package/pdf-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Zero dependencies**: No external libraries are required, making it lightweight and easy to integrate.
- **Type-safe**: Built with TypeScript, ensuring type safety and reducing runtime errors.
- **Browser and Node.js support**: Works seamlessly in both environments, allowing for versatile usage.
- **Low-level API**: Provides a low-level API for advanced users who want to manipulate PDF files directly, as well as a higher-level API for easier usage.

## PDF Support

### Low-level PDF constructs

Provides access to low-level PDF constructs, allowing for advanced manipulation and customization of PDF documents.

- [x] PDF numbers
- [x] PDF strings
- [x] PDF arrays
- [x] PDF dictionaries
- [x] PDF streams
- [x] PDF null
- [x] PDF booleans
- [x] PDF object references
- [x] PDF name objects
- [x] PDF indirect objects
- [x] PDF comments
- [x] PDF trailer
- [x] PDF object streams
- [x] PDF xref streams
- [x] PDF xref tables

### Encryption

Supports encrypting and decrypting PDF files using standard algorithms, ensuring document security. Implements a password recovery feature for encrypted PDFs, allowing users to regain access to their documents.

**Encryption algorithms supported:**

- [x] RC4-40
- [x] RC4-128
- [x] AES-128
- [x] AES-256

**Encryption methods:**

- [x] Password-based encryption
- [x] Certificate-based encryption (public key)

### Compression

Handles various compression algorithms, including Flate, LZW, and RunLength for efficient file size management. Note: image compression such as JPEG is not supported.

**Compression algorithms supported:**

- [x] Flate
- [x] LZW
- [x] ASCII85
- [x] ASCIIHex
- [x] RunLength

### Signing

PDF Signatures are powered by the [pki-lite](https://www.npmjs.com/package/pki-lite) library.

Provides support for digitally signing PDF documents, ensuring authenticity and integrity. All signing functionality is integrated into the main `pdf-lite` package.

**Signing algorithms supported:**

- [x] RSA
- [x] ECDSA

**Signature types supported:**

- [x] adbe.pkcs7.detached
- [x] adbe.pkcs7.sha1
- [x] adbe.x509.rsa_sha1
- [x] ETSI.CAdES.detached
- [x] ETSI.RFC3161

**LTV support/Revocation Info/Document Security Store (DSS):**

Long-Term Validation (LTV) support ensures that digital signatures remain valid over time, even after the signing certificate has expired. To enable this, the Document Security Store (DSS) is used to store revocation information and other metadata related to the signature.

- [x] DSS (Document Security Store)
- [x] CRL (Certificate Revocation List)
- [x] OCSP (Online Certificate Status Protocol)

**Other features:**

- [x] Timestamping
- [x] Verification of existing signatures

## Future Plans

- **Writing Linearized PDF**: Writing linearized PDFs for faster web viewing, improving user experience when accessing documents online.

## Development

This project uses pnpm for package management.

### Setup

```bash
pnpm install
```

### Building

```bash
pnpm compile
```

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run acceptance tests
pnpm test:acceptance
```

### Package Structure

The main package (`packages/pdf-lite`) contains:

- **src/core/** - Low-level PDF constructs (objects, parser, tokenizer)
- **src/pdf/** - High-level PDF document handling
- **src/signing/** - Digital signature support
- **src/security/** - Encryption and security handlers
- **src/filters/** - Compression/decompression filters

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Installation

```bash
npm install pdf-lite
```

or

```bash
yarn add pdf-lite
```

or

```bash
pnpm add pdf-lite
```

## Usage

The library provides both low-level and high-level APIs for working with PDF documents.

### Reading a PDF

```typescript
import { PdfReader } from 'pdf-lite/pdf/pdf-reader'
import { readFile } from 'fs/promises'

const pdfBytes = await readFile('document.pdf')
const doc = await PdfReader.fromBytes([pdfBytes])
```

### Creating a PDF from Scratch

```typescript
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'

// Create the document
const document = new PdfDocument()

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})

// Create and commit objects
document.commit(contentStream)
// ... create pages, catalog, etc.

// Output the PDF
console.log(document.toString())
```

### Working with Encryption

```typescript
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfV2SecurityHandler } from 'pdf-lite/security/handlers/v2'

const document = new PdfDocument()
// ... build your PDF structure

// Set up encryption
document.securityHandler = new PdfV2SecurityHandler({
    password: 'user-password',
    documentId: 'unique-doc-id',
    encryptMetadata: true,
})

// Encrypt the document
await document.encrypt()

console.log(document.toString())
```

### Signing PDFs

```typescript
import {
    PdfAdbePkcs7DetachedSignatureObject,
    PdfEtsiCadesDetachedSignatureObject,
} from 'pdf-lite'

// See examples directory for complete signing implementations
```

For more detailed examples, see the [EXAMPLES.md](EXAMPLES.md) file and the [examples/](examples/) directory.

## Project Structure

This project is organized as a monorepo:

- **packages/pdf-lite** - Main library package
- **examples/** - Example scripts demonstrating library usage
- **scripts/** - Build and development scripts

## API Reference

The library uses TypeScript subpath exports for modular imports:

```typescript
// PDF Document
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'
import { PdfReader } from 'pdf-lite/pdf/pdf-reader'

// Core PDF objects
import { PdfArray } from 'pdf-lite/core/objects/pdf-array'
import { PdfDictionary } from 'pdf-lite/core/objects/pdf-dictionary'
import { PdfStream } from 'pdf-lite/core/objects/pdf-stream'
import { PdfString } from 'pdf-lite/core/objects/pdf-string'
import { PdfName } from 'pdf-lite/core/objects/pdf-name'
import { PdfNumber } from 'pdf-lite/core/objects/pdf-number'
import { PdfIndirectObject } from 'pdf-lite/core/objects/pdf-indirect-object'
import { PdfObjectReference } from 'pdf-lite/core/objects/pdf-object-reference'

// Security
import { PdfV2SecurityHandler } from 'pdf-lite/security/handlers/v2'

// Signing
import {
    PdfAdbePkcs7DetachedSignatureObject,
    PdfAdbePkcs7Sha1SignatureObject,
    PdfAdbePkcsX509RsaSha1SignatureObject,
    PdfEtsiCadesDetachedSignatureObject,
    PdfEtsiRfc3161SignatureObject,
} from 'pdf-lite'
```

## License

MIT License - see [LICENSE](LICENSE) for details.
