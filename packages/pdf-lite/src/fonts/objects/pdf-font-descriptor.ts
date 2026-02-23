import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import type { FontDescriptor } from '../types.js'

type PdfFontDescriptorDictionary = PdfDictionary<{
    Type: PdfName<'FontDescriptor'>
    FontName: PdfName
    FontFamily: PdfName
    FontWeight: PdfNumber
    Flags: PdfNumber
    FontBBox: PdfArray<PdfNumber>
    ItalicAngle: PdfNumber
    Ascent: PdfNumber
    Descent: PdfNumber
    CapHeight: PdfNumber
    StemV: PdfNumber
    FontFile2?: PdfObjectReference
}>

export class PdfFontDescriptorObject extends PdfIndirectObject<PdfFontDescriptorDictionary> {
    constructor(descriptor: FontDescriptor, fontFileRef?: PdfObjectReference) {
        super({ content: new PdfDictionary() })

        this.content.set('Type', new PdfName('FontDescriptor'))
        this.content.set('FontName', new PdfName(descriptor.fontName))
        this.content.set('FontFamily', new PdfName(descriptor.fontFamily))
        this.content.set('FontWeight', new PdfNumber(descriptor.fontWeight))
        this.content.set('Flags', new PdfNumber(descriptor.flags))
        this.content.set(
            'FontBBox',
            new PdfArray([
                new PdfNumber(descriptor.fontBBox[0]),
                new PdfNumber(descriptor.fontBBox[1]),
                new PdfNumber(descriptor.fontBBox[2]),
                new PdfNumber(descriptor.fontBBox[3]),
            ]),
        )
        this.content.set('ItalicAngle', new PdfNumber(descriptor.italicAngle))
        this.content.set('Ascent', new PdfNumber(descriptor.ascent))
        this.content.set('Descent', new PdfNumber(descriptor.descent))
        this.content.set('CapHeight', new PdfNumber(descriptor.capHeight))
        this.content.set('StemV', new PdfNumber(descriptor.stemV))

        if (fontFileRef) {
            this.content.set('FontFile2', fontFileRef)
        }
    }
}
