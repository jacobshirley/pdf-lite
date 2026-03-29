import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'
import { Xml } from '../../utils/xml.js'

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
        return this.content.dataAsString
    }

    set xml(xml: string) {
        this.content.dataAsString = xml
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
        const leafName = PdfXfaData.leafName(name)
        if (!leafName) return null
        return Xml.getElementContent(this.xml, leafName)
    }

    importData(fields: Record<string, string | undefined>): void {
        for (const field in fields) {
            const value = fields[field]
            if (value === undefined) continue
            this.updateField(field, value)
        }
    }

    private static updateFieldValue(
        xml: string,
        fieldName: string,
        value: string,
    ): string {
        const leaf = PdfXfaData.leafName(fieldName)
        if (!leaf) return xml

        const escapedValue = Xml.escapeValue(value)

        // Try updating an existing element
        const updated = Xml.setElementContent(xml, leaf, escapedValue)
        if (updated !== xml) return updated

        // Element doesn't exist — create the missing hierarchy
        const segments = PdfXfaData.cleanSegments(fieldName)
        if (segments.length === 0) return xml

        // Find the deepest existing ancestor (skip the leaf itself)
        let insertAt = -1
        for (let i = segments.length - 2; i >= 0; i--) {
            if (Xml.hasElement(xml, segments[i])) {
                insertAt = i
                break
            }
        }
        if (insertAt === -1) return xml

        const childXml = Xml.wrapInElements(
            escapedValue,
            segments.slice(insertAt + 1),
        )
        return Xml.insertChild(xml, segments[insertAt], childXml)
    }

    private static leafName(fieldName: string): string | null {
        const segments = fieldName.split('.')
        const leaf = segments[segments.length - 1].replace(/\[\d+\]$/, '')
        return leaf.startsWith('#') ? null : leaf
    }

    private static cleanSegments(fieldName: string): string[] {
        return fieldName
            .split('.')
            .map((s) => s.replace(/\[\d+\]$/, ''))
            .filter((s) => !s.startsWith('#'))
    }
}
