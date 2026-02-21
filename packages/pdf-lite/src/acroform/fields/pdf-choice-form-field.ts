import { PdfFormField } from './pdf-form-field.js'
import { PdfDefaultAppearance } from './pdf-default-appearance.js'
import { PdfChoiceAppearanceStream } from '../appearance/pdf-choice-appearance-stream.js'
import { PdfDictionary } from '../../core/objects/pdf-dictionary.js'
import { PdfObjectReference } from '../../core/objects/pdf-object-reference.js'
import { PdfArray } from '../../core/objects/pdf-array.js'
import { PdfString } from '../../core/objects/pdf-string.js'
import { assertEncodable } from '../../errors.js'

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
        const opt =
            this.content
                .get('Opt')
                ?.as(PdfArray<PdfString | PdfArray<PdfString>>) ??
            this.parent?.content
                .get('Opt')
                ?.as(PdfArray<PdfString | PdfArray<PdfString>>)
        if (!opt) return []

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
            | undefined,
    ) {
        if (values === undefined) {
            this.content.delete('Opt')
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

        let fontResources: PdfDictionary | undefined
        const drFontValue = this.form?.defaultResources?.get('Font')
        const drFonts =
            drFontValue instanceof PdfDictionary ? drFontValue : undefined
        const daFontRef = this.form?.fontRefs?.get(parsed.fontName)
        if (drFonts || daFontRef) {
            // Build a fresh font dict using clean PdfObjectReferences (no
            // pre/postTokens inherited from the original parse context).
            const fontDict = new PdfDictionary()
            if (drFonts) {
                for (const [key, val] of drFonts.entries()) {
                    if (val instanceof PdfObjectReference) {
                        fontDict.set(
                            key,
                            new PdfObjectReference(
                                val.objectNumber,
                                val.generationNumber,
                            ),
                        )
                    } else if (val != null) {
                        fontDict.set(key, val)
                    }
                }
            }
            if (daFontRef && !fontDict.has(parsed.fontName)) {
                fontDict.set(
                    parsed.fontName,
                    new PdfObjectReference(
                        daFontRef.objectNumber,
                        daFontRef.generationNumber,
                    ),
                )
            }
            fontResources = new PdfDictionary()
            fontResources.set('Font', fontDict)
        }

        const isUnicode = this.form?.isFontUnicode(parsed.fontName) ?? false
        const encodingMap = this.form?.fontEncodingMaps?.get(parsed.fontName)
        const reverseEncodingMap: Map<string, number> | undefined = encodingMap
            ? new Map(Array.from(encodingMap, ([code, char]) => [char, code]))
            : undefined

        assertEncodable(value, isUnicode, reverseEncodingMap, parsed.fontName)

        this._appearanceStream = new PdfChoiceAppearanceStream({
            rect: rect as [number, number, number, number],
            value,
            da: parsed,
            flags: this.flags,
            fontResources,
            isUnicode,
            reverseEncodingMap,
            displayOptions: this.options.map((opt) => opt.label),
            selectedIndex: this.selectedIndex,
        })

        if (options?.makeReadOnly) {
            this.readOnly = true
            this.print = true
            this.noZoom = true
        }
        return true
    }
}
