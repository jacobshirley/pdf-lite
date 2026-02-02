import { describe, expect, it } from 'vitest'
import { escapeString } from '../../src/utils/escapeString'
import { stringToBytes } from '../../src/utils/stringToBytes'

const BACKSLASH = '\\'

describe('String Escaping for PDF', () => {
    it('should escape parentheses', () => {
        const input = stringToBytes('()')
        const output = escapeString(input)
        const result = new TextDecoder().decode(output)
        expect(result).toBe('\\(\\)')
    })

    it('should escape backslashes', () => {
        const input = stringToBytes('\\')
        const output = escapeString(input)
        const result = new TextDecoder().decode(output)
        expect(result).toBe('\\\\')
    })

    it('should escape newline and carriage return characters', () => {
        const input = stringToBytes('\n\r')
        const output = escapeString(input)
        const result = new TextDecoder().decode(output)
        expect(result).toBe(`\\n${BACKSLASH}\r`)
    })

    it('should not escape other control characters', () => {
        // The current implementation only escapes (, ), \, \n, and \r
        // Other characters like \f, \b, \t are passed through as-is
        const input = stringToBytes('\f\b\t')
        const output = escapeString(input)
        expect(output).toEqual(input)
    })

    it('should not escape regular printable characters', () => {
        const input = stringToBytes(
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*-_=+[]{}|;:,.<>?',
        )
        const output = escapeString(input)
        const result = new TextDecoder().decode(output)
        expect(result).toBe(
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*-_=+[]{}|;:,.<>?',
        )
    })

    it('should handle mixed content with escaped characters', () => {
        const input = stringToBytes('Hello (PDF)\nTest\\Path')
        const output = escapeString(input)
        const result = new TextDecoder().decode(output)
        expect(result).toBe(`Hello \\(PDF\\)\\nTest\\\\Path`)
    })

    it('should handle complex path strings', () => {
        const input = 'Path: C:\\Program Files\\App (x86)\\test.exe'
        const output = escapeString(input)
        const result = new TextDecoder().decode(output)
        expect(result).toBe(
            'Path: C:\\\\Program Files\\\\App \\(x86\\)\\\\test.exe',
        )
    })

    it('should handle edge cases', () => {
        // Empty string
        const empty = stringToBytes('')
        const emptyOutput = escapeString(empty)
        expect(new TextDecoder().decode(emptyOutput)).toBe('')

        // String with only printable characters
        const printableOnly = stringToBytes('Hello World')
        const printableOutput = escapeString(printableOnly)
        expect(new TextDecoder().decode(printableOutput)).toBe('Hello World')

        // String with only escaped characters
        const escapedOnly = stringToBytes('()\\')
        const escapedOutput = escapeString(escapedOnly)
        expect(new TextDecoder().decode(escapedOutput)).toBe('\\(\\)\\\\')
    })

    it('should accept string input directly', () => {
        const output = escapeString('Test (string)')
        const result = new TextDecoder().decode(output)
        expect(result).toBe('Test \\(string\\)')
    })
})
