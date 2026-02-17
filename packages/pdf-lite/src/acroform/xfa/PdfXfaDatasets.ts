import { PdfDocument } from '../../pdf/pdf-document.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfStream } from '../../core/objects/pdf-stream.js'

export interface XfaFieldData {
    name: string
    value: string
}

/**
 * Handles building and updating XFA datasets XML from AcroForm field values.
 */
export class PdfXfaDatasets {
    /**
     * Builds an updated XFA datasets indirect object from modified field values.
     * Returns undefined if no XFA update is needed.
     */
    static async build(
        document: PdfDocument,
        acroFormContent: PdfDictionary,
        modifiedFields: XfaFieldData[],
    ): Promise<PdfIndirectObject | undefined> {
        const hasXfa = await document.xfa.hasXfaForms()
        if (!hasXfa) return undefined

        let xml = await document.xfa.readXml()
        if (!xml) return undefined

        if (modifiedFields.length === 0) return undefined

        for (const { name, value } of modifiedFields) {
            xml = PdfXfaDatasets.updateFieldValue(xml, name, value)
        }

        const xfaArray = acroFormContent.get('XFA')
        if (!(xfaArray instanceof PdfArray)) return undefined

        const items = xfaArray.items
        let datasetsRef: PdfObjectReference | null = null
        for (let i = 0; i < items.length - 1; i += 2) {
            const name = items[i]
            const ref = items[i + 1]
            if (
                name instanceof PdfString &&
                name.value === 'datasets' &&
                ref instanceof PdfObjectReference
            ) {
                datasetsRef = ref
                break
            }
        }

        if (!datasetsRef) return undefined

        return new PdfIndirectObject({
            objectNumber: datasetsRef.objectNumber,
            generationNumber: datasetsRef.generationNumber,
            content: PdfStream.fromString(xml),
        })
    }

    /**
     * Updates a single field value in the XFA datasets XML.
     */
    static updateFieldValue(
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
            `<${PdfXfaDatasets.escapeRegex(leafName)}\\s*/>`,
        )
        if (selfClosingRegex.test(xml)) {
            return xml.replace(
                selfClosingRegex,
                `<${leafName}>${escapedValue}</${leafName}>`,
            )
        }

        const contentRegex = new RegExp(
            `(<${PdfXfaDatasets.escapeRegex(leafName)}(?:\\s[^>]*)?>)[\\s\\S]*?(</${PdfXfaDatasets.escapeRegex(leafName)}\\s*>)`,
        )
        if (contentRegex.test(xml)) {
            return xml.replace(contentRegex, `$1${escapedValue}$2`)
        }

        return xml
    }

    static escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
}
