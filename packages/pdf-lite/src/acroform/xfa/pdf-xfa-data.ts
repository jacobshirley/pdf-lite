import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'

export interface XfaFieldData {
    name: string
    value: string
}

/**
 * Wraps an XFA datasets stream as a typed PDF indirect object.
 * Provides methods to read/write XML and update individual field values.
 */
export class PdfXfaData extends PdfIndirectObject<PdfStream> {
    constructor(stream: PdfIndirectObject) {
        super(stream)
    }

    get xml(): string {
        const decompressed = this.content.decode()
        return new TextDecoder().decode(decompressed)
    }

    set xml(xml: string) {
        this.content.removeAllFilters()
        this.content.rawAsString = xml
    }

    updateField(name: string, value: string): void {
        this.xml = PdfXfaData.updateFieldValue(this.xml, name, value)
    }

    updateFields(fields: XfaFieldData[]): void {
        if (fields.length === 0) return

        let xml = this.xml
        for (const { name, value } of fields) {
            xml = PdfXfaData.updateFieldValue(xml, name, value)
        }
        this.xml = xml
    }

    getFieldValue(name: string): string | null {
        const xml = this.xml
        const segments = name.split('.')
        const leafSegment = segments[segments.length - 1]
        const leafName = leafSegment.replace(/\[\d+\]$/, '')

        if (leafName.startsWith('#')) return null

        const contentRegex = new RegExp(
            `<${PdfXfaData.escapeRegex(leafName)}(?:\\s[^>]*)?>([\\s\\S]*?)</${PdfXfaData.escapeRegex(leafName)}\\s*>`,
        )
        const match = xml.match(contentRegex)
        return match ? match[1] : null
    }

    private static updateFieldValue(
        xml: string,
        fieldName: string,
        value: string,
    ): string {
        const segments = fieldName.split('.')
        const leafSegment = segments[segments.length - 1]
        const leafName = leafSegment.replace(/\[\d+\]$/, '')

        if (leafName.startsWith('#')) return xml

        const escapedValue = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')

        const selfClosingRegex = new RegExp(
            `<${PdfXfaData.escapeRegex(leafName)}\\s*/>`,
        )
        if (selfClosingRegex.test(xml)) {
            return xml.replace(
                selfClosingRegex,
                `<${leafName}>${escapedValue}</${leafName}>`,
            )
        }

        const contentRegex = new RegExp(
            `(<${PdfXfaData.escapeRegex(leafName)}(?:\\s[^>]*)?>)[\\s\\S]*?(</${PdfXfaData.escapeRegex(leafName)}\\s*>)`,
        )
        if (contentRegex.test(xml)) {
            return xml.replace(contentRegex, `$1${escapedValue}$2`)
        }

        return xml
    }

    private static escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
}
