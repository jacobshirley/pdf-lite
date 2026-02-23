import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import type { UnicodeFontDescriptor, CIDWidth } from '../types.js'

export class PdfCIDFontObject extends PdfIndirectObject<PdfDictionary> {
    constructor(
        descriptor: UnicodeFontDescriptor,
        descriptorRef: PdfObjectReference,
    ) {
        super({ content: new PdfDictionary() })

        this.content.set('Type', new PdfName('Font'))
        this.content.set('Subtype', new PdfName('CIDFontType2'))
        this.content.set('BaseFont', new PdfName(descriptor.fontName))

        const cidSystemInfo = new PdfDictionary()
        cidSystemInfo.set('Registry', new PdfString('Adobe'))
        cidSystemInfo.set('Ordering', new PdfString('Identity'))
        cidSystemInfo.set('Supplement', new PdfNumber(0))
        this.content.set('CIDSystemInfo', cidSystemInfo)

        this.content.set('FontDescriptor', descriptorRef)
        this.content.set('DW', new PdfNumber(descriptor.defaultWidth ?? 1000))

        if (descriptor.cidWidths && descriptor.cidWidths.length > 0) {
            this.content.set(
                'W',
                PdfCIDFontObject.buildCIDWidthArray(descriptor.cidWidths),
            )
        }

        this.content.set(
            'CIDToGIDMap',
            new PdfName(descriptor.cidToGidMap ?? 'Identity'),
        )
    }

    static buildCIDWidthArray(widths: CIDWidth[]): PdfArray {
        const items: (PdfNumber | PdfArray)[] = []

        for (const entry of widths) {
            if ('width' in entry) {
                items.push(new PdfNumber(entry.cid))
                items.push(new PdfArray([new PdfNumber(entry.width)]))
            } else {
                items.push(new PdfNumber(entry.startCid))
                items.push(
                    new PdfArray(entry.widths.map((w) => new PdfNumber(w))),
                )
            }
        }

        return new PdfArray(items)
    }
}
