# Contributing to PDF-Lite

Thank you for your interest in contributing to PDF-Lite! This guide will help you understand the project structure and maintain consistency with the existing codebase.

## Project Aims

PDF-Lite is designed to be:

- **Zero Dependencies**: No external libraries required, making it lightweight and secure
- **Cross-Platform**: Works seamlessly in both browser and Node.js environments
- **Type-Safe**: Built with TypeScript for type safety and reduced runtime errors
- **Low-Level**: Provides granular control over PDF constructs
- **Extensible**: Easy to add new PDF features and capabilities
- **Standards-Compliant**: Follows PDF specification standards

## Project Structure

```
packages/
└── pdf-lite/                    # Main PDF library
    ├── src/
    │   ├── core/               # Core PDF primitives (objects, streams, etc.)
    │   ├── document/           # PDF document management
    │   ├── encryption/         # PDF encryption/decryption (RC4, AES)
    │   ├── compression/        # Compression algorithms (Flate, LZW, etc.)
    │   ├── signature/          # Digital signature support
    │   ├── stream/             # Stream processing utilities
    │   └── parser/             # PDF parsing utilities
    └── test/                   # Integration and unit tests
examples/                       # Practical usage examples
```

## Code Standards

### 1. PDF Specification Documentation

All classes representing PDF constructs **must** include the PDF specification reference in their JSDoc:

```typescript
/**
 * Represents a PDF Dictionary object.
 *
 * @spec PDF 32000-1:2008, Section 7.3.7
 *
 * A dictionary object is an associative table containing pairs of objects,
 * known as the dictionary's entries. The key shall be a name object, and the
 * value may be any kind of object, including another dictionary.
 */
export class PdfDictionary {
    // Implementation...
}
```

### 2. Test Files

Every source file **must** have a corresponding test file in the same directory:

```
src/core/PdfDictionary.ts
src/core/PdfDictionary.test.ts
```

Tests should cover:

- Basic construction and serialization
- Edge cases and error conditions
- Round-trip operations (parse → serialize → parse)
- PDF specification compliance
- Real-world PDF examples when possible

### 3. Examples

All new features and public APIs **must** include practical examples in the `examples/` folder:

```
examples/
├── basic/
│   ├── create-simple-pdf.ts
│   ├── read-pdf.ts
│   └── modify-pdf.ts
├── encryption/
│   ├── password-protect.ts
│   └── certificate-encrypt.ts
├── signatures/
│   ├── sign-document.ts
│   └── verify-signature.ts
└── README.md
```

Examples should:

- Be fully functional and runnable
- Include clear comments explaining each step
- Cover real-world use cases
- Be referenced in the main documentation
- Use `tsx` to run TypeScript examples directly

### 4. Consistent Class Structure

Follow this structure for all PDF classes:

```typescript
export class PdfYourClass {
    // 1. Public properties
    public property1: Type1
    public property2: Type2

    // 2. Constructor
    constructor(options: { property1: Type1; property2: Type2 }) {
        this.property1 = options.property1
        this.property2 = options.property2
    }

    // 3. Static factory methods
    static parse(data: Uint8Array): PdfYourClass {
        /* ... */
    }

    // 4. Instance methods
    serialize(): Uint8Array {
        /* ... */
    }

    toString(): string {
        /* ... */
    }
}
```

## Development Workflow

### 1. Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Compile TypeScript
pnpm compile

# Format code
pnpm format
```

### 2. Making Changes

1. **Create a branch** for your feature or bugfix:

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Write tests first** (TDD approach recommended):

    ```bash
    # Create test file
    touch src/your-module/YourClass.test.ts

    # Run tests in watch mode
    cd packages/pdf-lite
    pnpm test --watch
    ```

3. **Implement the feature** following the code standards above

4. **Ensure all tests pass**:

    ```bash
    pnpm test
    ```

5. **Format your code**:

    ```bash
    pnpm format
    ```

6. **Compile to check for TypeScript errors**:
    ```bash
    pnpm compile
    ```

### 3. Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add support for XYZ PDF feature"

# Bug fix
git commit -m "fix: correct parsing of encrypted streams"

# Documentation
git commit -m "docs: update encryption examples"

# Tests
git commit -m "test: add tests for compression algorithms"

# Refactor
git commit -m "refactor: simplify stream processing logic"
```

The commit message format is enforced by commitlint.

### 4. Pull Request Process

1. Ensure your code passes all tests and linting
2. Update documentation if you've changed APIs
3. Add examples if you've added new features
4. Update EXAMPLES.md if you've added new examples
5. Submit a pull request with a clear description of changes

## Adding New PDF Features

### 1. Encryption Algorithms

To add a new encryption algorithm:

1. **Create the algorithm class** in `src/encryption/`:

    ```typescript
    export class NewEncryptionAlgorithm {
        encrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
            // Implementation
        }

        decrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
            // Implementation
        }
    }
    ```

2. **Add tests** covering encryption/decryption round-trips

3. **Update the encryption handler** to support the new algorithm

4. **Add examples** showing how to use the new algorithm

### 2. Compression Algorithms

To add a new compression algorithm:

1. **Create the codec class** in `src/compression/`:

    ```typescript
    export class NewCompressionCodec {
        encode(data: Uint8Array): Uint8Array {
            // Implementation
        }

        decode(data: Uint8Array): Uint8Array {
            // Implementation
        }
    }
    ```

2. **Register the filter** in the filter registry

3. **Add tests** with various data types and edge cases

4. **Document** PDF specification compliance

### 3. Signature Types

To add a new signature type:

1. **Implement the signature handler** in `src/signature/`

2. **Add support** for the signature format (PKCS#7, CAdES, etc.)

3. **Create comprehensive tests** including validation

4. **Add examples** for signing and verification

## Testing Guidelines

### Unit Tests

- Test individual components in isolation
- Mock external dependencies
- Cover edge cases and error conditions
- Use descriptive test names

Example:

```typescript
import { describe, it, expect } from 'vitest'
import { PdfDictionary } from './PdfDictionary'

describe('PdfDictionary', () => {
    it('should create an empty dictionary', () => {
        const dict = new PdfDictionary()
        expect(dict.size).toBe(0)
    })

    it('should serialize to PDF format', () => {
        const dict = new PdfDictionary()
        dict.set('Type', new PdfName('Catalog'))
        expect(dict.toString()).toBe('<< /Type /Catalog >>')
    })

    it('should handle nested dictionaries', () => {
        // Test implementation
    })
})
```

### Integration Tests

- Test real-world PDF operations
- Use actual PDF files when possible
- Verify PDF specification compliance
- Test cross-platform compatibility (Node.js and browser)

### Performance Tests

For performance-critical code:

- Benchmark against large PDF files
- Test memory usage with streaming
- Profile encryption/decryption operations

## Documentation

### Code Documentation

- Use JSDoc comments for all public APIs
- Include examples in JSDoc when helpful
- Reference PDF specification sections
- Document parameters, return types, and exceptions

Example:

````typescript
/**
 * Encrypts a PDF stream using the specified algorithm.
 *
 * @spec PDF 32000-1:2008, Section 7.4.4
 *
 * @param stream - The stream to encrypt
 * @param algorithm - The encryption algorithm to use
 * @returns The encrypted stream
 * @throws {Error} If encryption fails
 *
 * @example
 * ```typescript
 * const encrypted = encryptStream(stream, 'AES-256')
 * ```
 */
export function encryptStream(
    stream: PdfStream,
    algorithm: EncryptionAlgorithm,
): PdfStream {
    // Implementation
}
````

### README Updates

When adding features:

- Update the feature checklist in README.md
- Add links to examples
- Document any breaking changes
- Update the "Future Plans" section if applicable

### Example Documentation

All examples should:

- Have a clear, descriptive filename
- Include a header comment explaining what it demonstrates
- Show complete, runnable code
- Handle errors appropriately
- Be added to EXAMPLES.md

## Common Patterns

### Error Handling

Use descriptive error messages:

```typescript
if (!isValidPdfVersion(version)) {
    throw new Error(
        `Invalid PDF version: ${version}. Expected format: 1.x where x is 0-7`,
    )
}
```

### Type Safety

Prefer type-safe operations:

```typescript
// Good
const name = dict.get<PdfName>('Type')

// Avoid
const name = dict.get('Type') as PdfName
```

### Memory Efficiency

For large PDFs, use streaming:

```typescript
// Good - streaming
const stream = createReadStream(pdfPath).pipe(pdfParser).pipe(processStream)

// Avoid - loading entire file
const buffer = await readFile(pdfPath)
```

## Getting Help

- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Examples**: Check the `examples/` folder for reference implementations

## Resources

- [PDF 32000-1:2008 Specification](https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf)
- [PDF Reference (older versions)](https://www.adobe.com/devnet/pdf/pdf_reference.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

Thank you for contributing to PDF-Lite! 🎉
