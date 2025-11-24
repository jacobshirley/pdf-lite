# pdf-lite: a low-level, zero-dependency, type-safe PDF library that works in the browser and Node.js

Please note, this library is still in its early stages and may not support all PDF features. However, it is designed to be extensible and can be improved over time.

PRs and issues are welcome!

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

Handles various compression algorithms, including Flate, LZW, and JPEG, for efficient file size management.

**Compression algorithms supported:**

- [x] Flate
- [x] LZW
- [x] ASCII85
- [x] ASCIIHex
- [x] RunLength

### Streaming

Supports streaming PDF content, enabling efficient handling of large files and reducing memory usage.

- [x] Transform-based streaming

### Signing

Provides support for digitally signing PDF documents, ensuring authenticity and integrity. See package `pdf-lite-signature` for more details.

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

## Future Plans

- **Writing Linearized PDF**: Writing linearized PDFs for faster web viewing, improving user experience when accessing documents online.

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

```typescript
import { pdfReader } from 'pdf-lite'
```
