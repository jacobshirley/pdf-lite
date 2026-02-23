import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfIndirectObject } from '../../core/objects/pdf-indirect-object.js'
import { PdfName } from '../../core/objects/pdf-name.js'
import { PdfNumber } from '../../core/objects/pdf-number.js'
import { PdfArray } from '../../core/objects/pdf-array.js'

export class PdfFontDictionaryObject extends PdfIndirectObject<PdfDictionary> {
    constructor(dict?: PdfDictionary) {
        super({ content: dict ?? new PdfDictionary() })
    }

    get fontName(): string | undefined {
        return this.content.get('BaseFont')?.as(PdfName)?.value
    }

    set fontName(name: string | undefined) {
        if (!name) {
            this.content.delete('BaseFont')
        } else {
            this.content.set('BaseFont', new PdfName(name))
        }
    }

    get fontType():
        | 'Type1'
        | 'TrueType'
        | 'Type0'
        | 'MMType1'
        | 'Type3'
        | undefined {
        return this.content.get('Subtype')?.as(PdfName)?.value as
            | 'Type1'
            | 'TrueType'
            | 'Type0'
            | 'MMType1'
            | 'Type3'
            | undefined
    }

    set fontType(
        type: 'Type1' | 'TrueType' | 'Type0' | 'MMType1' | 'Type3' | undefined,
    ) {
        if (type) {
            this.content.set('Subtype', new PdfName(type))
        } else {
            this.content.delete('Subtype')
        }
    }

    get firstChar(): number | undefined {
        return this.content.get('FirstChar')?.as(PdfNumber)?.value
    }

    set firstChar(value: number | undefined) {
        if (value !== undefined) {
            this.content.set('FirstChar', new PdfNumber(value))
        } else {
            this.content.delete('FirstChar')
        }
    }

    get lastChar(): number | undefined {
        return this.content.get('LastChar')?.as(PdfNumber)?.value
    }

    set lastChar(value: number | undefined) {
        if (value !== undefined) {
            this.content.set('LastChar', new PdfNumber(value))
        } else {
            this.content.delete('LastChar')
        }
    }

    get widths(): number[] | undefined {
        const widths = this.content.get('Widths')?.as(PdfArray<PdfNumber>)
        if (!widths) return undefined
        return widths.items.map((item) => item.value)
    }

    set widths(values: number[] | undefined) {
        if (values) {
            this.content.set(
                'Widths',
                new PdfArray(values.map((w) => new PdfNumber(w))),
            )
        } else {
            this.content.delete('Widths')
        }
    }
}
