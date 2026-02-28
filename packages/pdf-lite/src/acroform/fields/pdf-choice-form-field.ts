import { PdfFormField } from './pdf-form-field.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import { PdfChoiceAppearanceStream } from '../appearance/pdf-choice-appearance-stream.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { PdfIndirectObject, PdfObject } from '../../core/index.js'

/**
 * Choice form field subtype (dropdowns, list boxes).
 */
export class PdfChoiceFormField extends PdfFormField {
    static {
        PdfFormField.registerFieldType('Ch', PdfChoiceFormField)
    }

    get selectedIndex(): number {
        return this.options.findIndex((opt) => opt.value === this.value)
    }

    get options(): {
        label: string
        value: string
    }[] {
        let opt: PdfObject | undefined =
            this.content.get('Opt') ?? this.parent?.content.get('Opt')
        if (!opt) return []

        if (opt instanceof PdfObjectReference) {
            opt = opt
                .resolve()
                .as(
                    PdfIndirectObject<
                        PdfArray<PdfString | PdfArray<PdfString>>
                    >,
                ).content
        }

        if (!(opt instanceof PdfArray)) return []

        return opt.items.map((item) => {
            if (item instanceof PdfArray && item.items.length >= 2) {
                const label =
                    item.items[1] instanceof PdfString
                        ? item.items[1].value
                        : ''
                const value =
                    item.items[0] instanceof PdfString
                        ? item.items[0].value
                        : ''
                return { label, value }
            } else if (item instanceof PdfString) {
                return { label: item.value, value: item.value }
            } else {
                return { label: '', value: '' }
            }
        })
    }

    set options(
        values:
            | {
                  label: string
                  value: string
              }[]
            | string[]
            | PdfObjectReference
            | undefined,
    ) {
        if (values === undefined) {
            this.content.delete('Opt')
            return
        }

        if (values instanceof PdfObjectReference) {
            this.content.set('Opt', values)
            return
        }

        if (values.length === 0) {
            this.content.delete('Opt')
            return
        }

        const optArray = new PdfArray<PdfString | PdfArray<PdfString>>()
        for (const option of values) {
            if (typeof option === 'string') {
                optArray.items.push(new PdfString(option))
            } else if (option.label === option.value) {
                optArray.items.push(new PdfString(option.value))
            } else {
                const pair = new PdfArray<PdfString>()
                pair.items.push(new PdfString(option.value))
                pair.items.push(new PdfString(option.label))
                optArray.items.push(pair)
            }
        }
        this.content.set('Opt', optArray)
    }

    generateAppearance(options?: { makeReadOnly?: boolean }): boolean {
        const rect = this.rect
        if (!rect || rect.length !== 4) return false

        const da = this.defaultAppearance
        if (!da) return false

        const value = this.value
        if (!value) return false

        const parsed = PdfDefaultAppearance.parse(da)
        if (!parsed) return false

        const font = this.font
        const fontResources = this.buildFontResources(parsed.fontName)

        const isUnicode = font?.isUnicode ?? false
        const reverseEncodingMap = font?.reverseEncodingMap

        this.setAppearanceStream(
            new PdfChoiceAppearanceStream({
                rect: rect as [number, number, number, number],
                value,
                da: parsed,
                flags: this.flags,
                fontResources,
                isUnicode,
                reverseEncodingMap,
                displayOptions: this.options.map((opt) => opt.label),
                selectedIndex: this.selectedIndex,
            }),
        )

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
