import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfXfaData } from './pdf-xfa-data.js'

/**
 * Typed wrapper around the XFA name/stream-ref array.
 * Holds eagerly-loaded references to component streams like datasets.
 */
export class PdfXfaForm {
    private xfaEntry?: PdfArray<PdfObjectReference>

    constructor(xfaEntry?: PdfArray<PdfObjectReference>) {
        this.xfaEntry = xfaEntry
    }

    get components(): {
        [type: string]: PdfIndirectObject
    } {
        const result: { [type: string]: PdfIndirectObject } = {}
        const items = this.xfaEntry?.items ?? []
        for (let i = 0; i < items.length - 1; i += 2) {
            const name = items[i]
            const ref = items[i + 1]

            if (
                name instanceof PdfString &&
                ref instanceof PdfObjectReference
            ) {
                result[name.value] = ref.resolve().as(PdfIndirectObject)
            }
        }
        return result
    }

    get datasets(): PdfXfaData | null {
        const datasetsRef = this.components['datasets']
        if (!datasetsRef) {
            return null
        }
        return datasetsRef.resolve().becomes(PdfXfaData)
    }
}
