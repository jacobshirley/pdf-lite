import { PdfNameToken } from '../tokens/name-token.js'
import { PdfObject } from './pdf-object.js'

export class PdfName<T extends string = string> extends PdfObject {
    value: T

    constructor(value: T) {
        super()
        this.value = PdfName.unescapeName(value) as T
    }

    protected tokenize() {
        return [new PdfNameToken(PdfName.escapeName(this.value))]
    }

    cloneImpl(): this {
        const cloned = new PdfName(this.value) as this
        return cloned
    }

    /**
     * Escapes a PDF name according to PDF specification.
     * PDF names can't contain spaces or certain special chars except # for escaping.
     *
     * @param name - The name to escape
     * @returns The escaped name
     */
    static escapeName(name: string): string {
        // Escape special characters in PDF names
        // Characters that need escaping: space, #, %, (, ), <, >, [, ], {, }, /, +, ',' and non-ASCII
        // Safe characters: A-Z, a-z, 0-9, -, _, . + ,
        return name.replace(/[^+,A-Za-z0-9-_.]/g, (char) => {
            const hex = char
                .charCodeAt(0)
                .toString(16)
                .toUpperCase()
                .padStart(2, '0')
            return `#${hex}`
        })
    }

    /**
     * Unescapes a PDF name by converting #XX hex sequences back to characters.
     *
     * @param escapedName - The escaped name with #XX sequences
     * @returns The unescaped name
     */
    static unescapeName(escapedName: string): string {
        return escapedName.replace(/#([0-9A-Fa-f]{2})/g, (_, hex) => {
            return String.fromCharCode(parseInt(hex, 16))
        })
    }
}
