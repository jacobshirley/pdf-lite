/**
 * Error thrown when the parser needs more input to continue parsing.
 */
export class NoMoreTokensError extends Error {}

/**
 * Error thrown when the end of file has been reached and no more input is available.
 */
export class EofReachedError extends Error {}

/**
 * Error thrown when an unexpected token is encountered during parsing.
 */
export class UnexpectedTokenError extends Error {
    constructor(expected: string, actual: string | null) {
        super(
            `Unexpected token: expected ${expected}, but got ${
                actual === null ? 'EOF' : actual
            }`,
        )
    }
}

/**
 * Error thrown when attempting to access a compressed object
 * that requires decompression from an object stream.
 */
export class FoundCompressedObjectError extends Error {}

/**
 * Error thrown when a PDF is encrypted and the blank password
 * does not grant access. Callers should catch this and prompt
 * the user for a password, then retry with the `password` option.
 */
export class PdfPasswordProtectedError extends Error {
    constructor(message?: string) {
        super(message ?? 'PDF is password protected')
    }
}

/**
 * Error thrown when a provided password is invalid for decrypting a PDF.
 */
export class PdfInvalidPasswordError extends Error {
    constructor(message?: string) {
        super(message ?? 'Invalid password')
    }
}
