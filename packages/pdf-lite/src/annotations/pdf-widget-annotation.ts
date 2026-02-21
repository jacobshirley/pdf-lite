import { PdfIndirectObject } from '../core/objects/pdf-indirect-object.js'
import { PdfName } from '../core/objects/pdf-name.js'
import { PdfAnnotation } from './pdf-annotation.js'

/**
 * Widget annotation subtype. Extends PdfAnnotation with widget-specific
 * properties: isWidget (Type/Subtype) and AS (appearance state).
 */
export class PdfWidgetAnnotation extends PdfAnnotation {
    constructor(options?: { other?: PdfIndirectObject }) {
        super(options)
    }

    get isWidget(): boolean {
        const type = this.content.get('Type')?.as(PdfName)?.value
        const subtype = this.content.get('Subtype')?.as(PdfName)?.value
        return type === 'Annot' && subtype === 'Widget'
    }

    set isWidget(isWidget: boolean) {
        if (isWidget) {
            this.content.set('Type', new PdfName('Annot'))
            this.content.set('Subtype', new PdfName('Widget'))
        } else {
            this.content.delete('Type')
            this.content.delete('Subtype')
        }
    }

    get appearanceState(): string | null {
        return this.content.get('AS')?.as(PdfName)?.value ?? null
    }

    set appearanceState(state: string | null) {
        if (state === null) {
            this.content.delete('AS')
        } else {
            this.content.set('AS', new PdfName(state))
        }
    }
}
