export class Xml {
    static escapeValue(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
    }

    static getElementContent(xml: string, tagName: string): string | null {
        const escaped = Xml.escapeRegex(tagName)
        const regex = new RegExp(
            `<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}\\s*>`,
        )
        const match = xml.match(regex)
        return match ? match[1] : null
    }

    static setElementContent(
        xml: string,
        tagName: string,
        content: string,
    ): string {
        const escaped = Xml.escapeRegex(tagName)

        // Try expanding a self-closing tag
        const selfClosing = new RegExp(`<${escaped}\\s*/>`)
        if (selfClosing.test(xml)) {
            return xml.replace(
                selfClosing,
                `<${tagName}>${content}</${tagName}>`,
            )
        }

        // Try replacing content of an existing tag
        const contentRegex = new RegExp(
            `(<${escaped}(?:\\s[^>]*)?>)[\\s\\S]*?(</${escaped}\\s*>)`,
        )
        if (contentRegex.test(xml)) {
            return xml.replace(contentRegex, `$1${content}$2`)
        }

        return xml
    }

    static hasElement(xml: string, tagName: string): boolean {
        const escaped = Xml.escapeRegex(tagName)
        return (
            new RegExp(`</${escaped}\\s*>`).test(xml) ||
            new RegExp(`<${escaped}\\s*/>`).test(xml)
        )
    }

    static insertChild(
        xml: string,
        parentTagName: string,
        childXml: string,
    ): string {
        const escaped = Xml.escapeRegex(parentTagName)

        // Insert before closing tag
        const closingRegex = new RegExp(`(</${escaped}\\s*>)`)
        if (closingRegex.test(xml)) {
            return xml.replace(closingRegex, `${childXml}$1`)
        }

        // Expand self-closing tag
        const selfClosing = new RegExp(`<${escaped}\\s*/>`)
        if (selfClosing.test(xml)) {
            return xml.replace(
                selfClosing,
                `<${parentTagName}>${childXml}</${parentTagName}>`,
            )
        }

        return xml
    }

    static wrapInElements(content: string, tagNames: string[]): string {
        let result = content
        for (let i = tagNames.length - 1; i >= 0; i--) {
            result = `<${tagNames[i]}>${result}</${tagNames[i]}>`
        }
        return result
    }

    static escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
}
