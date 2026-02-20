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
 * Thrown when a character in a field value cannot be encoded by the field's
 * single-byte font (codepoint above U+00FF with no entry in the font's
 * Differences map). Callers can catch this to set NeedAppearances = true and
 * let the PDF viewer render the field instead.
 */
export class PdfFontEncodingError extends Error {
    readonly char: string
    readonly codePoint: number
    readonly fontName: string

    constructor(char: string, codePoint: number, fontName: string) {
        super(
            `Character '${char}' (U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}) cannot be encoded by font '${fontName}'`,
        )
        this.name = 'PdfFontEncodingError'
        this.char = char
        this.codePoint = codePoint
        this.fontName = fontName
    }
}

/**
 * Throws PdfFontEncodingError if any character in `value` cannot be represented
 * by the font's single-byte encoding (codepoint > U+00FF and absent from the
 * Differences reverse map). No-ops for Type0/Identity-H fonts (isUnicode=true).
 */
export function assertEncodable(
    value: string,
    isUnicode: boolean,
    reverseEncodingMap: Map<string, number> | undefined,
    fontName: string,
): void {
    if (isUnicode) return
    for (const char of value) {
        const code = char.codePointAt(0) ?? 0
        if (code > 0xff && !reverseEncodingMap?.has(char)) {
            throw new PdfFontEncodingError(char, code, fontName)
        }
    }
}
