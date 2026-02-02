import { describe, expect, it } from 'vitest'
import { PdfName } from '../../src/core/objects/pdf-name'

describe('PdfName', () => {
    describe('escapeName', () => {
        it('should not escape simple alphanumeric names', () => {
            expect(PdfName.escapeName('Yes')).toBe('Yes')
            expect(PdfName.escapeName('No')).toBe('No')
            expect(PdfName.escapeName('Off')).toBe('Off')
            expect(PdfName.escapeName('On')).toBe('On')
            expect(PdfName.escapeName('Type')).toBe('Type')
            expect(PdfName.escapeName('Subtype')).toBe('Subtype')
        })

        it('should preserve hyphens, underscores, and periods', () => {
            expect(PdfName.escapeName('my-name')).toBe('my-name')
            expect(PdfName.escapeName('my_name')).toBe('my_name')
            expect(PdfName.escapeName('name.value')).toBe('name.value')
            expect(PdfName.escapeName('test-value_123.pdf')).toBe(
                'test-value_123.pdf',
            )
        })

        it('should escape special characters with #XX format', () => {
            expect(PdfName.escapeName('test#value')).toBe('test#23value')
            expect(PdfName.escapeName('value(1)')).toBe('value#281#29')
            expect(PdfName.escapeName('name<value>')).toBe('name#3Cvalue#3E')
            expect(PdfName.escapeName('array[0]')).toBe('array#5B0#5D')
            expect(PdfName.escapeName('obj{key}')).toBe('obj#7Bkey#7D')
            expect(PdfName.escapeName('path/to/file')).toBe('path#2Fto#2Ffile')
        })

        it('should escape percent signs', () => {
            expect(PdfName.escapeName('50%')).toBe('50#25')
            expect(PdfName.escapeName('100%complete')).toBe('100#25complete')
        })

        it('should sanitize names with spaces by taking first word', () => {
            expect(PdfName.escapeName('Hello World')).toBe('Hello')
            expect(PdfName.escapeName('Value With Spaces')).toBe('Value')
            expect(PdfName.escapeName('First Second')).toBe('First')
            // Spaces are escaped if part of the name, but here they trigger sanitization
            expect(PdfName.escapeName('hello world')).toBe('hello')
        })

        it('should not sanitize names with periods', () => {
            // Periods are allowed in PDF names and should be preserved
            expect(PdfName.escapeName('file.txt')).toBe('file.txt')
            expect(PdfName.escapeName('name.value.test')).toBe(
                'name.value.test',
            )
        })

        it('should use "Yes" as default for empty or special-char-only names', () => {
            expect(PdfName.escapeName(' ')).toBe('Yes')
            expect(PdfName.escapeName('  ')).toBe('Yes')
        })

        it('should handle mixed scenarios', () => {
            // Space causes sanitization first, then no escaping needed
            expect(PdfName.escapeName('button value')).toBe('button')
            // No space, so escaping applies to special chars
            expect(PdfName.escapeName('test(value)')).toBe('test#28value#29')
        })

        it('should handle non-ASCII characters', () => {
            expect(PdfName.escapeName('café')).toBe('caf#E9')
            expect(PdfName.escapeName('test™')).toBe('test#2122')
        })
    })

    describe('unescapeName', () => {
        it('should unescape #XX sequences', () => {
            expect(PdfName.unescapeName('hello#20world')).toBe('hello world')
            expect(PdfName.unescapeName('test#23value')).toBe('test#value')
            expect(PdfName.unescapeName('value#281#29')).toBe('value(1)')
            expect(PdfName.unescapeName('name#3Cvalue#3E')).toBe('name<value>')
            expect(PdfName.unescapeName('array#5B0#5D')).toBe('array[0]')
            expect(PdfName.unescapeName('obj#7Bkey#7D')).toBe('obj{key}')
            expect(PdfName.unescapeName('path#2Fto#2Ffile')).toBe(
                'path/to/file',
            )
        })

        it('should handle lowercase hex codes', () => {
            expect(PdfName.unescapeName('hello#20world')).toBe('hello world')
            expect(PdfName.unescapeName('name#3cvalue#3e')).toBe('name<value>')
        })

        it('should leave unescaped names unchanged', () => {
            expect(PdfName.unescapeName('Yes')).toBe('Yes')
            expect(PdfName.unescapeName('No')).toBe('No')
            expect(PdfName.unescapeName('Type')).toBe('Type')
            expect(PdfName.unescapeName('my-name')).toBe('my-name')
            expect(PdfName.unescapeName('my_name')).toBe('my_name')
        })

        it('should handle percent signs', () => {
            expect(PdfName.unescapeName('50#25')).toBe('50%')
            expect(PdfName.unescapeName('100#25complete')).toBe('100%complete')
        })

        it('should handle non-ASCII characters', () => {
            expect(PdfName.unescapeName('caf#E9')).toBe('café')
            expect(PdfName.unescapeName('caf#e9')).toBe('café')
        })

        it('should handle multiple escaped sequences', () => {
            expect(PdfName.unescapeName('a#20b#20c')).toBe('a b c')
            expect(PdfName.unescapeName('#28#29#5B#5D')).toBe('()[]')
        })

        it('should ignore invalid escape sequences', () => {
            // Single # without valid hex
            expect(PdfName.unescapeName('test#value')).toBe('test#value')
            // # with only one hex digit
            expect(PdfName.unescapeName('test#2value')).toBe('test#2value')
            // # with non-hex characters
            expect(PdfName.unescapeName('test#GGvalue')).toBe('test#GGvalue')
        })
    })

    describe('escapeName and unescapeName round-trip', () => {
        it('should be reversible for special characters', () => {
            const testCases = [
                'value(1)',
                'name<value>',
                'array[0]',
                'obj{key}',
                'path/to/file',
                'test#value',
                '50%',
                'café',
            ]

            testCases.forEach((original) => {
                const escaped = PdfName.escapeName(original)
                const unescaped = PdfName.unescapeName(escaped)
                expect(unescaped).toBe(original)
            })
        })

        it('should handle simple names without changes', () => {
            const testCases = ['Yes', 'No', 'Off', 'On', 'Type', 'Subtype']

            testCases.forEach((name) => {
                const escaped = PdfName.escapeName(name)
                expect(escaped).toBe(name)
                const unescaped = PdfName.unescapeName(escaped)
                expect(unescaped).toBe(name)
            })
        })
    })

    describe('PdfName object', () => {
        it('should create a PdfName with a simple value', () => {
            const name = new PdfName('Type')
            expect(name.value).toBe('Type')
        })

        it('should tokenize with escaped name', () => {
            const name = new PdfName('test value')
            const tokens = name['tokenize']()
            expect(tokens).toHaveLength(1)
            // The token should contain the escaped version (sanitized to "test")
            expect(tokens[0].name).toBe('test')
        })

        it('should tokenize special characters with escaping', () => {
            const name = new PdfName('value(1)')
            const tokens = name['tokenize']()
            expect(tokens).toHaveLength(1)
            expect(tokens[0].name).toBe('value#281#29')
        })

        it('should clone correctly', () => {
            const name = new PdfName('Test')
            const cloned = name.clone()
            expect(cloned.value).toBe('Test')
            expect(cloned).not.toBe(name)
        })
    })
})
