/**
 * Checks if a string contains non-ASCII characters that require UTF-16BE encoding
 *
 * @param str - The string to check
 * @returns True if the string contains characters above ASCII range (code > 127)
 *
 * @example
 * ```typescript
 * needsUnicodeEncoding('Hello') // Returns false
 * needsUnicodeEncoding('PROSZĘ') // Returns true
 * ```
 */
export function needsUnicodeEncoding(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
            return true
        }
    }
    return false
}
