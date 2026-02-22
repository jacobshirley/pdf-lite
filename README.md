**[Examples](./EXAMPLES.md)** | **[Documentation](https://jacobshirley.github.io/pdf-lite/v1)**

# pdf-lite

A low-level, minimal-dependency, type-safe PDF library that works in the browser and Node.js.

> **Note**: This library is actively developed and may not support all PDF features yet. However, it is designed to be extensible and can be improved over time.

PRs and issues are welcome!

[![npm version](https://img.shields.io/npm/v/pdf-lite.svg)](https://www.npmjs.com/package/pdf-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Type-safe**: Built with TypeScript, ensuring type safety and reducing runtime errors.
- **Browser and Node.js support**: Works seamlessly in both environments, allowing for versatile usage.
- **Low-level API**: Provides a low-level API for advanced users who want to manipulate PDF files directly, as well as a higher-level API for easier usage.
- **Minimal dependencies**: A small number external libraries are required, making it lightweight and easy to integrate.

## Installation

```bash
npm install pdf-lite
yarn add pdf-lite
pnpm add pdf-lite
```

## Usage

The library provides both low-level and high-level APIs for working with PDF documents. See [PDF Support](#pdf-support) for a list of supported features.

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

// Create the document
const document = new PdfDocument()

// Create a page using the high-level API
const page = document.pages.create({ width: 612, height: 792 })

// Create a font
const fontDict = new PdfDictionary()
fontDict.set('Type', new PdfName('Font'))
fontDict.set('Subtype', new PdfName('Type1'))
fontDict.set('BaseFont', new PdfName('Helvetica'))
const font = new PdfIndirectObject({ content: fontDict })
document.add(font)

// Add font to page resources
const fontResources = new PdfDictionary()
fontResources.set('F1', font.reference)
page.resources.set('Font', fontResources)

// Create content stream
const contentStream = new PdfIndirectObject({
    content: new PdfStream({
        header: new PdfDictionary(),
        original: 'BT /F1 24 Tf 100 700 Td (Hello, PDF-Lite!) Tj ET',
    }),
})
document.add(contentStream)

// Add content to page
page.addContentStream(contentStream.reference)

// Commit and output
await document.commit()
console.log('Pages in document:', document.pages.count())
console.log('Page dimensions:', page.getDimensions())
```

### Working with Pages

The `PdfPage` API provides a type-safe, high-level abstraction for working with pages:

```typescript
import { PdfDocument } from 'pdf-lite/pdf/pdf-document'

const document = new PdfDocument()

// Create pages with different dimensions
const page1 = document.pages.create({ width: 612, height: 792 }) // US Letter
const page2 = document.pages.create({ width: 792, height: 612, rotate: 90 }) // Landscape

// Access page properties
console.log(page1.getDimensions()) // { width: 612, height: 792 }
console.log(page2.rotate) // 90

// Iterate over pages
for (const page of document.pages) {
    console.log('Page dimensions:', page.getDimensions())
}

// Get specific pages
const firstPage = document.pages.get(0)
const allPages = document.pages.getAll()
console.log('Total pages:', document.pages.count())

// Insert and remove pages
document.pages.remove(1) // Remove second page
document.pages.insert(0, newPage) // Insert at beginning

// Set page boxes (for printing workflows)
page1.cropBox = createBox(10, 10, 602, 782)
page1.trimBox = createBox(10, 10, 602, 782)
page1.bleedBox = createBox(5, 5, 607, 787)

// Work with page annotations (form fields, links, etc.)
const annotRef = new PdfObjectReference(20, 0)
page1.addAnnotation(annotRef) // Adds to page's Annots array
console.log(page1.annots?.length) // Number of annotations on page
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

### AcroForm filling

Supports filling out AcroForm forms within PDF documents, allowing for dynamic content generation and user interaction.

- [x] Text fields
- [x] Checkboxes
- [x] Radio buttons
- [x] Dropdowns

### XFA Forms

You can read/write XFA XML data from PDFs, but rendering and filling XFA forms is not supported.

- [x] Read XFA XML
- [x] Write XFA XML

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## API Reference

See the [documentation folder](./docs/README.md) or the document site for a complete API reference.

## License

MIT License - see [LICENSE](LICENSE) for details.
